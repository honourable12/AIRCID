from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import json
import os

from app.db_utils import get_db, store_document_in_db, Document as DBDocument
from utils.kb_builder import get_embedding_model, chunk_documents, index_documents_to_chroma 
from langchain.docstore.document import Document as LangChainDocument 

router = APIRouter()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads a document (PDF or TXT), stores it in SQLite, and
    immediately indexes it into the ChromaDB vector store.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in [".pdf", ".txt"]:
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF and TXT are allowed.")

    try:
        file_content = await file.read()
        document_text = ""
        metadata = {"filename": file.filename, "file_type": file_extension}

        if file_extension == ".pdf":
            # For PDFs, load with PyPDFLoader to get page content and metadata
            from langchain_community.document_loaders import PyPDFLoader
            # Create a temporary file to save the uploaded PDF
            temp_file_path = f"/tmp/{file.filename}"
            with open(temp_file_path, "wb") as temp_file:
                temp_file.write(file_content)

            loader = PyPDFLoader(temp_file_path)
            lc_docs = loader.load()
            document_text = "\n\n".join([doc.page_content for doc in lc_docs])
            # Add LangChain's extracted metadata if useful, e.g., page numbers
            if lc_docs:
                metadata['total_pages'] = len(lc_docs)
                # You might want to merge specific metadata from lc_docs[0].metadata
                # For now, keeping it simple.

            os.remove(temp_file_path) # Clean up temp file

        elif file_extension == ".txt":
            document_text = file_content.decode('utf-8')

        # Store in SQLite database
        print(f"Storing '{file.filename}' in SQLite database...")
        db_doc = store_document_in_db(file.filename, document_text, metadata)
        print(f"Document stored with ID: {db_doc.id}")

        # Prepare document for ChromaDB indexing
        # Create a LangChain Document from the SQLite-stored content
        # Ensure metadata includes the SQLite DB ID and filename for source tracking
        chroma_metadata = {
            "source": f"DB_ID:{db_doc.id} - {db_doc.filename}",
            "db_id": db_doc.id,
            "filename": db_doc.filename,
            **metadata # Include original file metadata
        }
        langchain_doc_for_indexing = LangChainDocument(
            page_content=db_doc.content, # Use the content stored in DB
            metadata=chroma_metadata
        )

        # Chunk and index the newly added document into ChromaDB
        print(f"Chunking and indexing '{file.filename}' into ChromaDB...")
        text_chunks = chunk_documents([langchain_doc_for_indexing])
        
        # Incremental addition to ChromaDB (better than full rebuild for single docs)
        embeddings_model = get_embedding_model()
        from langchain_community.vectorstores import Chroma
        # Attempt to load existing DB. If it doesn't exist, this will create an empty one.
        chroma_db = Chroma(persist_directory=os.getenv("CHROMA_PERSIST_DIRECTORY", "chroma_db"), embedding_function=embeddings_model)
        chroma_db.add_documents(text_chunks)
        chroma_db.persist()
        print(f"Successfully added {len(text_chunks)} chunks from '{file.filename}' to ChromaDB.")

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Document uploaded and indexed successfully", "document_id": db_doc.id}
        )

    except Exception as e:
        print(f"Error during document upload/indexing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {e}")

@router.get("/list")
async def list_documents(db: Session = Depends(get_db)):
    """
    Lists all documents stored in the SQLite database.
    """
    documents = db.query(DBDocument).all()
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "upload_timestamp": doc.upload_timestamp.isoformat(),
            "metadata": json.loads(doc.metadata_json)
        }
        for doc in documents
    ]