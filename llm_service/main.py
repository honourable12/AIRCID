from fastapi import FastAPI
from app.api import criteria # Existing
from app.api import forms    # New

app = FastAPI(
    title="Intelligent Criteria Augmentation & Smart Form Generation API",
    description="An LLM-powered API to refine research criteria and generate structured JSON Schemas for forms.",
    version="1.0.0"
)

app.include_router(criteria.router, prefix="/criteria", tags=["Criteria Augmentation"])
app.include_router(forms.router, prefix="/forms", tags=["Smart Form Generation"]) 

@app.get("/")
async def root():
    return {"message": "Welcome to the Intelligent Criteria Augmentation & Smart Form Generation API! Visit /docs for API documentation."}