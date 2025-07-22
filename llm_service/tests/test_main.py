import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from main import app
from app.db_utils import Base, get_db
from app.security import get_current_user, User
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="module")
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def db_session_override(monkeypatch):
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    monkeypatch.setattr("app.db_utils.get_db", override_get_db)
    yield


@pytest.fixture
def override_auth():
    async def mock_get_current_user():
        return User(id="testuser", username="testuser", roles=["researcher", "admin"])

    app.dependency_overrides[get_current_user] = mock_get_current_user
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_read_root(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "LLM Microservice is running!"}


@pytest.mark.asyncio
@patch('app.api.criteria.llm_service')
async def test_criteria_augment(mock_llm_service, client: AsyncClient, db_session_override, override_auth):
    mock_llm_service.augment_criteria.return_value = '{"clearer_wording": "Test wording", "suggested_rules": [{"description": "Rule 1", "structured_format": "IF X THEN Y"}]}'
    mock_llm_service.langchain_llm.model_name = "test_model"
    test_input = {"researcher_input": "Find studies on patient experience."}
    response = await client.post("/criteria/augment", json=test_input)
    assert response.status_code == 200
    assert response.json()["clearer_wording"] == "Test wording"


@pytest.mark.asyncio
@patch('app.api.forms.llm_service')
async def test_forms_generate(mock_llm_service, client: AsyncClient, db_session_override, override_auth):
    mock_llm_service.generate_form.return_value = '{"$schema": "http://json-schema.org/draft-07/schema#", "title": "Test Form", "type": "object", "properties": {"name": {"type": "string"}}}'
    mock_llm_service.langchain_llm.model_name = "test_model"
    test_input = {"study_objectives": "Collect user names."}
    response = await client.post("/forms/generate", json=test_input)
    assert response.status_code == 200
    assert response.json()["json_schema"]["title"] == "Test Form"


@pytest.mark.asyncio
@patch('app.api.text.llm_service')
async def test_text_summarize(mock_llm_service, client: AsyncClient, override_auth):
    mock_llm_service.summarize_text.return_value = {"summary": "This is a concise summary."}
    test_input = {"text_content": "A long document.", "summary_context": "general"}
    response = await client.post("/text/summarize", json=test_input)
    assert response.status_code == 200
    assert response.json()["summary"] == "This is a concise summary."


@pytest.mark.asyncio
@patch('app.api.documents.llm_service.vectorstore.add_documents')
async def test_document_upload(mock_add_documents, client: AsyncClient, db_session_override, override_auth):
    mock_add_documents.return_value = None
    dummy_content = b"This is a test document."
    files = {"file": ("test_doc.txt", dummy_content, "text/plain")}
    response = await client.post("/documents/upload", files=files)
    assert response.status_code == 200
    assert "Document uploaded and indexed successfully" in response.json()["message"]


@pytest.mark.asyncio
@patch('app.api.qna.llm_service')
async def test_qna_ask(mock_llm_service, client: AsyncClient, override_auth):
    mock_llm_service.answer_question_with_rag = AsyncMock(return_value={
        "answer": "The fox is quick.",
        "sources": ["DB_ID:1 - test.txt"],
        "retrieved_chunks": ["The quick brown fox jumps over the lazy dog."]
    })
    test_input = {"question": "What is the fox like?"}
    response = await client.post("/qna/ask", json=test_input)
    assert response.status_code == 200
    assert response.json()["answer"] == "The fox is quick."