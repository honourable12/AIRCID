from fastapi import FastAPI
from app.api import criteria
from app.api import forms
from app.api import text
from app.api import qna
from app.api import documents 
from app.db_utils import init_db

app = FastAPI(
    title="Intelligent LLM Applications",
    description="A collection of LLM-powered API endpoints for criteria augmentation, form generation, text summarization, contextual Q&A, and document management.",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    init_db()

app.include_router(criteria.router, prefix="/criteria", tags=["Criteria Augmentation"])
app.include_router(forms.router, prefix="/forms", tags=["Smart Form Generation"])
app.include_router(text.router, prefix="/text", tags=["Automated Report & Note Summarization"])
app.include_router(qna.router, prefix="/qna", tags=["Contextual Q&A (RAG)"])
app.include_router(documents.router, prefix="/documents", tags=["Document Management"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Intelligent LLM Applications API! Visit /docs for API documentation."}
