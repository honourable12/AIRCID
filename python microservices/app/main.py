from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict
import time
from datetime import datetime

from app.models import Patient, StudyCriteria, MatchResult
from app.services.matching_service import MatchingService
from app.services.nlp_service import NLPService
from app.config import settings

# Initialize FastAPI app
app = FastAPI(
    title="AI Case Matching Service",
    description="AI-powered patient case matching for neurosurgical research studies",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
matching_service = MatchingService()
nlp_service = NLPService()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "AI Case Matching Service",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "matching_service": "operational",
            "nlp_service": "operational"
        },
        "timestamp": datetime.now().isoformat()
    }


@app.post("/match-patient", response_model=MatchResult)
async def match_patient(
    patient: Patient,
    study_criteria: StudyCriteria
) -> MatchResult:
    """
    Match a patient against study criteria using AI
    
    Args:
        patient: Patient data to evaluate
        study_criteria: Study criteria to match against
        
    Returns:
        MatchResult: Detailed matching results with confidence scores
    """
    start_time = time.time()
    
    try:
        # Perform AI-based matching
        match_result = await matching_service.match_patient(patient, study_criteria)
        
        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)
        match_result.processing_time_ms = processing_time
        
        return match_result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during patient matching: {str(e)}"
        )


@app.post("/match-multiple-patients", response_model=List[Dict[str, str]])
async def match_multiple_patients(
    patients: List[Patient],
    study_criteria: StudyCriteria
) -> List[Dict[str, str]]:
    """
    Match multiple patients against study criteria using Pandas/NumPy for filtering.
    Returns a list of dicts: {patient_id, reason}
    """
    try:
        results = matching_service.match_patients_with_pandas(patients, study_criteria)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during batch patient matching: {str(e)}"
        )


@app.post("/validate-criteria")
async def validate_criteria(study_criteria: StudyCriteria):
    """
    Validate study criteria for syntax and logic
    
    Args:
        study_criteria: Study criteria to validate
        
    Returns:
        dict: Validation results
    """
    try:
        validation_result = await matching_service.validate_criteria(study_criteria)
        return validation_result
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Criteria validation error: {str(e)}"
        )


@app.post("/extract-clinical-info")
async def extract_clinical_info(
    clinical_notes: List[str],
    extraction_fields: List[str]
):
    """
    Extract structured information from clinical notes using NLP
    
    Args:
        clinical_notes: List of clinical notes to process
        extraction_fields: Fields to extract (e.g., ['diagnosis', 'medications', 'symptoms'])
        
    Returns:
        dict: Extracted structured information
    """
    try:
        extracted_info = await nlp_service.extract_clinical_information(
            clinical_notes, extraction_fields
        )
        return extracted_info
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during clinical information extraction: {str(e)}"
        )


@app.get("/supported-criteria-types")
async def get_supported_criteria_types():
    """
    Get list of supported criteria types for study definition
    
    Returns:
        dict: Supported criteria types and their descriptions
    """
    return {
        "criteria_types": [
            {
                "type": "age_range",
                "description": "Age-based inclusion/exclusion criteria",
                "operators": ["==", ">=", "<=", ">", "<", "between"]
            },
            {
                "type": "gender",
                "description": "Gender-based criteria",
                "operators": ["==", "!=", "in"]
            },
            {
                "type": "diagnosis",
                "description": "Diagnosis-based criteria",
                "operators": ["==", "contains", "in", "not_in"]
            },
            {
                "type": "lab_value",
                "description": "Laboratory value criteria",
                "operators": ["==", ">=", "<=", ">", "<", "between", "abnormal"]
            },
            {
                "type": "vital_sign",
                "description": "Vital sign criteria",
                "operators": ["==", ">=", "<=", ">", "<", "between", "abnormal"]
            },
            {
                "type": "medication",
                "description": "Medication-based criteria",
                "operators": ["==", "contains", "in", "not_in"]
            },
            {
                "type": "procedure",
                "description": "Procedure-based criteria",
                "operators": ["==", "contains", "in", "not_in"]
            },
            {
                "type": "imaging_finding",
                "description": "Imaging finding criteria",
                "operators": ["==", "contains", "in", "not_in"]
            },
            {
                "type": "clinical_note",
                "description": "Clinical note content criteria (NLP-based)",
                "operators": ["contains", "contains_keywords", "sentiment"]
            },
            {
                "type": "custom_rule",
                "description": "Custom rule-based criteria",
                "operators": ["custom"]
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 