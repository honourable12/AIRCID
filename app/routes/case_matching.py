from fastapi import APIRouter
from app.services.case_matching_service import match_case

router = APIRouter()

@router.post("/case-matching")
def predict_case(data: dict):
    """
    API endpoint for real-time case matching.
    """
    result = match_case(data)
    return result