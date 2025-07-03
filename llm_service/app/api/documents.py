from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db_utils import get_db, Document
from app.llm_service import LLMService
from app.security import role_required
from langchain.docstore.document import Document as LangchainDocument
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
import shutil
from typing import List
from PIL import Image 
import pytesseract 

router = APIRouter()
llm_service = LLMService()

UPLOAD_DIR = "uploaded_files_temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper function for OCR 
def perform_ocr_on_image(file_path: str) -> str:
    try:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        return text
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"OCR processing failed for image: {e}"
        )

@router.post("/upload", summary="Upload a document for processing",
            dependencies=[Depends(role_required(["admin", "researcher"]))])
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    file_content = None

    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_type = file.content_type

        if file_type == "application/pdf":
            from pypdf import PdfReader
            reader = PdfReader(file_location)
            file_content = ""
            for page in reader.pages:
                file_content += page.extract_text() or ""
            if not file_content:
                raise HTTPException(status_code=400, detail="Could not extract text from PDF. It might be a scanned PDF. Consider image upload for OCR.")

        elif file_type == "text/plain":
            with open(file_location, "r", encoding="utf-8") as f:
                file_content = f.read()

        elif file_type.startswith("image/"):
            file_content = perform_ocr_on_image(file_location)
            if not file_content:
                raise HTTPException(status_code=400, detail="Could not extract text from image using OCR.")
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_type}. Only PDF, TXT, and images are supported.",
            )

        if not file_content.strip():
            raise HTTPException(status_code=400, detail="Extracted content is empty. Document might be blank or corrupted.")


        # Store in SQLite database
        new_document = Document(
            filename=file.filename,
            file_type=file_type,
            content=file_content,
            filepath=file_location
        )
        db.add(new_document)
        db.commit()
        db.refresh(new_document)

        # Index in ChromaDB
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            length_function=len,
            is_separator_regex=False,
        )
        chunks = text_splitter.split_text(file_content)

        if not chunks:
            raise HTTPException(status_code=500, detail="No chunks generated from document content.")

        langchain_documents = []
        for i, chunk in enumerate(chunks):
            # Includes document ID and filename in metadata for traceability
            metadata = {
                "source": f"DB_ID:{new_document.id} - {new_document.filename}",
                "file_type": new_document.file_type,
                "chunk_id": i + 1,
            }
            langchain_documents.append(
                LangchainDocument(page_content=chunk, metadata=metadata)
            )

        llm_service.vectorstore.add_documents(langchain_documents)

        return JSONResponse(
            status_code=200,
            content={
                "message": "Document uploaded and indexed successfully",
                "document_id": new_document.id,
                "filename": new_document.filename,
                "indexed_chunks": len(langchain_documents)
            },
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error during document upload: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error during upload: {e}")
    finally:
        if os.path.exists(file_location):
            os.remove(file_location)

@router.get("/list")
async def list_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    return [
        {"id": doc.id, "filename": doc.filename, "file_type": doc.file_type, "uploaded_at": doc.uploaded_at}
        for doc in documents
    ]

@router.get("/{document_id}", summary="Retrieve a document by ID",
            response_model=dict,
            dependencies=[Depends(role_required(["admin", "researcher"]))]) # NEW: Admin or researcher can view
async def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    return {
        "id": document.id,
        "filename": document.filename,
        "file_type": document.file_type,
        "content": document.content,
        "uploaded_at": document.uploaded_at.isoformat()
    }

@router.delete("/{document_id}", dependencies=[Depends(role_required(["admin", "researcher"]))])
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    db_document = db.query(Document).filter(Document.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        llm_service.vectorstore._collection.delete(
            where={"source": f"DB_ID:{db_document.id} - {db_document.filename}"}
        )
        db.delete(db_document)
        db.commit()

        return JSONResponse(
            status_code=200,
            content={"message": f"Document {document_id} deleted successfully from DB and ChromaDB."}
        )
    except Exception as e:
        db.rollback()
        print(f"Error deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {e}")
    