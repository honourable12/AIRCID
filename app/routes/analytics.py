from fastapi import APIRouter
from app.services.preprocessing import clean_data

router = APIRouter()

@router.post("/clean-data")
def clean_patient_data(data: dict):
    """
    Endpoint for cleaning and standardizing patient data.
    """
    cleaned_data = clean_data(data)
    return {"cleaned_data": cleaned_data}