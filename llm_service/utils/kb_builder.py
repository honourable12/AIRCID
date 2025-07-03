import os
import json
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.docstore.document import Document as LangChainDocument
from sqlalchemy.orm import Session
from app.db_utils import SessionLocal, Document
from app.llm_service import LLMService
from typing import List
from PIL import Image
import pytesseract

from app.db_utils import get_all_documents_for_indexing, Document as DBDocument

# --- Configuration ---
CHROMA_PERSIST_DIRECTORY = "chroma_db"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
KNOWLEDGE_BASE_DIR = "knowledge_base_docs"

def get_embedding_model():
    """Singleton-like function to get the embedding model."""
    if not hasattr(get_embedding_model, 'model'):
        print(f"Loading embedding model: {EMBEDDING_MODEL_NAME}")
        get_embedding_model.model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    return get_embedding_model.model

def load_documents_from_db(db : Session) -> List[LangChainDocument]:
    db_documents = db.query(Document).all()
    langchain_documents = []
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
        is_separator_regex=False,
    )
    
    for doc in db_documents:
        content = doc.content 
        metadata = {"source": f"DB_ID:{doc.id} - {doc.filename}", "file_type": doc.file_type}
        
    if doc.file_type and doc.file_tyoe_startswith('image/'):
        # try:
            #     # This assumes original image files are persistently available
            #     # e.g., in a mounted volume or a specific directory.
            #     # This is a simplification; a production app might store image paths
            #     # or the binary blobs and regenerate on demand.
            #     temp_image_path = os.path.join("temp_uploaded_files", doc.filename)
            #     if os.path.exists(temp_image_path):
            #         content = extract_text_from_image(temp_image_path)
            #     else:
            #         print(f"Warning: Image file not found for OCR: {temp_image_path}")
            #         content = "" # Or a placeholder
            # except Exception as e:
            #     print(f"Error OCRing document {doc.filename} during KB rebuild: {e}")
            #     content = ""
            pass
            if content: # Only process if there's content to chunk
            # Split the document into chunks
                chunks = text_splitter.split_text(content)
            for i, chunk in enumerate(chunks):
                chunk_metadata = {**metadata, "chunk_id": i + 1}
                langchain_documents.append(
                    LangChainDocument(page_content=chunk, metadata=chunk_metadata)
                )
    return langchain_documents

def extract_text_from_image(image_path: str) -> str:
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        return text
    except Exception as e:
        print(f"Error during OCR fir {image_path}: {e}")

def chunk_documents(documents: list[LangChainDocument], chunk_size=1000, chunk_overlap=200):
    """
    Splits loaded documents into smaller, overlapping chunks.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split {len(documents)} LangChain Documents into {len(chunks)} chunks.")
    return chunks

def index_documents_to_chroma(documents_to_index: list[LangChainDocument]):
    """
    Generates embeddings for the text chunks and stores them in ChromaDB.
    This function will re-create/update the ChromaDB collection.
    """
    if not documents_to_index:
        print("No documents provided for indexing to ChromaDB.")
        return

    embeddings = get_embedding_model()

    print(f"Indexing {len(documents_to_index)} documents into ChromaDB at: {CHROMA_PERSIST_DIRECTORY}")

    # Initialize ChromaDB with the embedding function
    # Note: Using `from_documents` will (by default) wipe and recreate the collection.
    # For incremental updates, you'd use db.add_documents().
    # For simplicity here, we're doing a full rebuild for now.
    db = Chroma.from_documents(
        documents_to_index,
        embeddings,
        persist_directory=CHROMA_PERSIST_DIRECTORY
    )
    db.persist()
    print(f"Successfully indexed {len(documents_to_index)} documents into ChromaDB.")
    return db

def rebuild_chroma_from_sqlite():
    """
    Rebuilds the entire ChromaDB from documents stored in the SQLite database.
    This is useful for ensuring consistency or adding a large batch.
    """
    print("--- Rebuilding ChromaDB from SQLite Documents ---")
    db_documents = get_all_documents_for_indexing()
    if not db_documents:
        print("No documents found in SQLite database to index. Please upload documents first.")
        return

    langchain_docs = []
    for doc in db_documents:
        # Reconstruct LangChain Document from DB data
        metadata = json.loads(doc.metadata_json)
        # Add a 'db_id' to link back to the SQLite entry if needed
        metadata['db_id'] = doc.id
        metadata['source'] = f"DB_ID:{doc.id} - {doc.filename}" # More descriptive source

        langchain_docs.append(
            LangChainDocument(
                page_content=doc.content,
                metadata=metadata
            )
        )

    # Chunk the documents loaded from SQLite
    print("Chunking documents retrieved from SQLite...")
    text_chunks = chunk_documents(langchain_docs)

    # Index into ChromaDB
    index_documents_to_chroma(text_chunks)
    print("--- ChromaDB Rebuild Complete ---")

# --- Initial migration from file system (Optional, run once) ---
def migrate_files_to_sqlite_and_index():
    """
    Utility to load existing files from KNOWLEDGE_BASE_DIR, store in SQLite,
    and then index them into ChromaDB. Run this ONLY ONCE if you have legacy files.
    """
    print("--- Migrating existing files to SQLite and indexing ---")
    from app.db_utils import store_document_in_db, init_db
    init_db() # Ensure DB is ready

    documents = []
    for root, _, files in os.walk(KNOWLEDGE_BASE_DIR):
        for file in files:
            file_path = os.path.join(root, file)
            content = None
            if file.endswith(".pdf"):
                print(f"Loading PDF from file system for migration: {file_path}")
                loader = PyPDFLoader(file_path)
                lc_docs = loader.load() # Load as LangChain Documents
                content = "\n".join([d.page_content for d in lc_docs]) # Concatenate for SQLite storage
                metadata = {"source_path": file_path, "type": "pdf"}
            elif file.endswith(".txt"):
                print(f"Loading TXT from file system for migration: {file_path}")
                with open(file_path, 'r', encoding="utf-8") as f:
                    content = f.read()
                metadata = {"source_path": file_path, "type": "txt"}
            else:
                print(f"Skipping unsupported file for migration: {file_path}")
                continue

            if content:
                print(f"Storing '{file}' in SQLite...")
                stored_doc = store_document_in_db(file, content, metadata)
                print(f"Stored document ID: {stored_doc.id}")
                # Add to a list for immediate indexing if needed
                documents.append(LangChainDocument(page_content=content, metadata={"source": f"DB_ID:{stored_doc.id} - {stored_doc.filename}", "db_id": stored_doc.id, "source_path": file_path, "type": metadata["type"]}))


    if documents:
        print("\n--- Indexing migrated documents into ChromaDB ---")
        text_chunks = chunk_documents(documents)
        index_documents_to_chroma(text_chunks)
    else:
        print("No files migrated from file system.")

    print("--- Migration and Indexing Complete ---")


if __name__ == "__main__":
    # --- IMPORTANT: Choose ONE of these to run ---
    # 1. To migrate existing files from 'knowledge_base_docs' to SQLite and then index them:
    #    This should generally be run ONCE if you have pre-existing files.
    # migrate_files_to_sqlite_and_index()

    # 2. To rebuild ChromaDB ONLY from documents ALREADY IN SQLite:
    #    Use this if you've added documents via the API and want to re-index everything.
    print("Attempting to rebuild Chroma KB from SQLite...")
    rebuild_chroma_from_sqlite()
    print("Chroma KB rebuild process completed.")
    
