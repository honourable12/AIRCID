from fastapi import FastAPI
from app.api import criteria
from app.api import forms
from app.api import text

app = FastAPI(
    title="Intelligent LLM Applications",
    description="A collection of LLM-powered API endpoints for criteria augmentation, form generation, and text summarization.",
    version="1.0.0"
)

app.include_router(criteria.router, prefix="/criteria", tags=["Criteria Augmentation"])
app.include_router(forms.router, prefix="/forms", tags=["Smart Form Generation"])
app.include_router(text.router, prefix="/text", tags=["Automated Report & Note Summarization"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Intelligent LLM Applications API! Visit /docs for API documentation."}