import pytest
from unittest.mock import patch, MagicMock
from app.db_utils import Document
import os # For cleaning up test artifacts

# Ensure environment variables are loaded for tests (especially GROQ_API_KEY)
from dotenv import load_dotenv
load_dotenv(".env") # Load from project root .env

# Clean up ChromaDB and SQLite for a clean test environment (optional, but good for consistent tests)
@pytest.fixture(autouse=True)
def cleanup_test_dbs():
    chroma_path = "chroma_db"
    sqlite_path = "documents.db"

    if os.path.exists(chroma_path):
        import shutil
        shutil.rmtree(chroma_path)
    if os.path.exists(sqlite_path):
        os.remove(sqlite_path)

    # Re-initialize DB after cleanup
    from app.db_utils import init_db
    init_db()
    yield # Run the test
    # Clean up again after test if desired
    if os.path.exists(chroma_path):
        import shutil
        shutil.rmtree(chroma_path)
    if os.path.exists(sqlite_path):
        os.remove(sqlite_path)


@pytest.mark.asyncio
async def test_read_root(client):
    """Test the root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    assert "Welcome to the Intelligent LLM Applications API!" in response.json()["message"]

@pytest.mark.asyncio
@patch('app.llm_service.LLMService.client') # Mock the Groq client
async def test_criteria_augment(mock_groq_client, client):
    """Test the /criteria/augment endpoint."""
    mock_groq_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content='{"clearer_wording": "Test wording", "suggested_rules": [{"description": "Rule 1", "structured_format": "IF X THEN Y"}] }'))]
    )
    test_input = {"researcher_input": "Find studies on patient experience."}
    response = await client.post("/criteria/augment", json=test_input)
    assert response.status_code == 200
    assert response.json()["clearer_wording"] == "Test wording"
    assert response.json()["suggested_rules"][0]["description"] == "Rule 1"

@pytest.mark.asyncio
@patch('app.llm_service.LLMService.client') # Mock the Groq client
async def test_forms_generate(mock_groq_client, client):
    """Test the /forms/generate endpoint."""
    mock_groq_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content='{"$schema": "http://json-schema.org/draft-07/schema#", "title": "Test Form", "type": "object", "properties": {"name": {"type": "string"}}}'))]
    )
    test_input = {"study_objectives": "Collect user names."}
    response = await client.post("/forms/generate", json=test_input)
    assert response.status_code == 200
    assert response.json()["json_schema"]["title"] == "Test Form"
    assert "name" in response.json()["json_schema"]["properties"]

@pytest.mark.asyncio
@patch('app.llm_service.LLMService.client') # Mock the Groq client
async def test_text_summarize(mock_groq_client, client):
    """Test the /text/summarize endpoint."""
    mock_groq_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content='This is a concise summary.'))]
    )
    test_input = {"text_content": "A very long document that needs to be summarized for testing purposes.", "summary_context": "general"}
    response = await client.post("/text/summarize", json=test_input)
    assert response.status_code == 200
    assert response.json()["summary"] == "This is a concise summary."

@pytest.mark.asyncio
async def test_document_upload_and_list(client, db_session):
    """Test document upload and listing."""
    # Create a dummy text file content
    dummy_text_content = b"This is a test document for upload."
    dummy_file = ("test_doc.txt", dummy_text_content, "text/plain")

    # Mock the embedding and ChromaDB addition for isolation and speed
    with patch('utils.kb_builder.get_embedding_model'), \
         patch('utils.kb_builder.Chroma') as mock_chroma:

        # Mock the add_documents method on the mock Chroma instance
        mock_chroma_instance = MagicMock()
        mock_chroma.return_value = mock_chroma_instance # What Chroma.from_documents returns
        mock_chroma_instance.add_documents.return_value = None # What add_documents returns


        response = await client.post("/documents/upload", files={"file": dummy_file})
        assert response.status_code == 200
        assert "Document uploaded and indexed successfully" in response.json()["message"]
        doc_id = response.json()["document_id"]
        assert doc_id is not None

        # Verify it's in the DB
        doc_in_db = db_session.query(Document).filter(Document.id == doc_id).first()
        assert doc_in_db is not None
        assert doc_in_db.filename == "test_doc.txt"
        assert doc_in_db.content == dummy_text_content.decode('utf-8')

        # Test listing documents
        list_response = await client.get("/documents/list")
        assert list_response.status_code == 200
        assert any(d['id'] == doc_id for d in list_response.json())

        # Verify ChromaDB add_documents was called
        # Adjust based on how many chunks are expected from dummy_text_content
        # For a small text, it's likely 1 chunk.
        assert mock_chroma_instance.add_documents.call_count == 1
        # Check that it was called with a list of LangChain Documents
        args, _ = mock_chroma_instance.add_documents.call_args
        assert isinstance(args[0], list) and len(args[0]) > 0
        assert "This is a test document" in args[0][0].page_content # Check content of the chunk

@pytest.mark.asyncio
@patch('app.llm_service.LLMService.vectorstore') # Mock the Chroma vectorstore
@patch('app.llm_service.LLMService.client') # Mock the Groq client
async def test_qna_ask(mock_groq_client, mock_vectorstore, client):
    """Test the /qna/ask endpoint."""
    # Mock retrieved documents from ChromaDB
    mock_doc1 = MagicMock()
    mock_doc1.page_content = "The quick brown fox is very agile."
    mock_doc1.metadata = {"source": "DB_ID:1 - fox_info.txt"}
    mock_doc2 = MagicMock()
    mock_doc2.page_content = "The lazy dog was sleeping under a tree."
    mock_doc2.metadata = {"source": "DB_ID:2 - dog_habits.pdf", "page": 5}

    mock_vectorstore.similarity_search_with_score.return_value = [
        (mock_doc1, 0.9),
        (mock_doc2, 0.8)
    ]

    # Mock LLM response
    mock_groq_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content='The fox is agile and the dog is lazy.'))]
    )

    test_input = {"question": "What is known about the fox and the dog?"}
    response = await client.post("/qna/ask", json=test_input)

    assert response.status_code == 200
    assert response.json()["answer"] == "The fox is agile and the dog is lazy."
    assert "DB_ID:1 - fox_info.txt" in response.json()["sources"]
    assert "DB_ID:2 - dog_habits.pdf (Page 5)" in response.json()["sources"]
    assert "The quick brown fox is very agile." in response.json()["retrieved_chunks"]