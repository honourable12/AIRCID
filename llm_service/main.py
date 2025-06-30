from fastapi import FastAPI
from app.api import criteria

app = FastAPI(
    title="Intelligent Criteria Augmentation API",
    description="An LLM-powered API to refine research criteria and suggest structured rules.",
    version="1.0.0"
)

app.include_router(criteria.router, prefix="/criteria", tags=["Criteria Augmentation"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Intelligent Criteria Augmentation API! Visit /docs for API documentation."}