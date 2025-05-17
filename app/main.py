from fastapi import FastAPI
from app.routes import case_matching

app = FastAPI(
    title="AI-Enhanced Research Data Integration",
    description="Microservices for case matching and analytics",
    version="1.0.0"
)


# Include the case matching router
app.include_router(case_matching.router, prefix="/api", tags=["Case Matching"])

@app.get("/")
def root():
    return {"message": "AI Case Matching API is running"}