from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from app.llm_service import LLMService
from app.models import (
    FormGenerationRequest,
    FormGenerationResponse,
    FormVersionDetails,
    FormRefinementRequest
)
from app.db_utils import get_db, GeneratedFormVersion
from sqlalchemy.orm import Session
import json
import hashlib

router = APIRouter()
llm_service = LLMService()

def generate_input_hash(input_string: str) -> str:
    return hashlib.sha256(input_string.encode('utf-8')).hexdigest()

@router.post("/generate", response_model=FormGenerationResponse)
async def generate_form(
    request: FormGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    Based on study objectives or selected criteria, generates preliminary JSON schema
    definitions for dynamic data collection forms.
    This function now also versions the generated output.
    """
    try:
        llm_response_json_str = llm_service.generate_form(request.study_objectives)
        llm_output_parsed = json.loads(llm_response_json_str)
        input_hash = generate_input_hash(request.study_objectives)

        latest_version_query = db.query(GeneratedFormVersion)\
                                .filter(GeneratedFormVersion.original_input_hash == input_hash)\
                                .order_by(GeneratedFormVersion.version_number.desc())\
                                .first()
        next_version_number = 1
        if latest_version_query:
            next_version_number = latest_version_query.version_number + 1

        new_version = GeneratedFormVersion(
            original_input=request.study_objectives,
            original_input_hash=input_hash,
            llm_output_json_schema=llm_response_json_str,
            llm_model_used=llm_service.langchain_llm.model_name,
            version_number=next_version_number,
            modified_by="LLM", 
            refinement_of_version_id=None 
        )
        db.add(new_version)
        db.commit()
        db.refresh(new_version)

        return FormGenerationResponse(
            json_schema=llm_output_parsed,
            version_id=new_version.id,
            version_number=new_version.version_number,
            original_input_hash=new_version.original_input_hash,
            llm_model_used=new_version.llm_model_used,
            version_timestamp=new_version.version_timestamp,
            modified_by=new_version.modified_by,
            refinement_of_version_id=new_version.refinement_of_version_id
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, detail="LLM response was not a valid JSON schema. Check LLM output format."
        )
    except Exception as e:
        print(f"Error during form generation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@router.post("/versions/{version_id}/refine", response_model=FormGenerationResponse)
async def refine_form_version(
    version_id: int,
    request: FormRefinementRequest,
    db: Session = Depends(get_db)
):

    base_version = db.query(GeneratedFormVersion).filter(GeneratedFormVersion.id == version_id).first()
    if not base_version:
        raise HTTPException(status_code=404, detail="Base form version not found for refinement.")

    try:
        # Ensure the refined_output is valid JSON (it's already a dict from Pydantic)
        refined_output_json_str = json.dumps(request.refined_output)

        # Use the original input and its hash from the base version
        original_input = base_version.original_input
        original_input_hash = base_version.original_input_hash

        # Determine the next version number for this specific input hash
        latest_version_query = db.query(GeneratedFormVersion)\
                                .filter(GeneratedFormVersion.original_input_hash == original_input_hash)\
                                .order_by(GeneratedFormVersion.version_number.desc())\
                                .first()
        next_version_number = 1
        if latest_version_query:
            next_version_number = latest_version_query.version_number + 1

        new_refined_version = GeneratedFormVersion(
            original_input=original_input,
            original_input_hash=original_input_hash,
            llm_output_json_schema=refined_output_json_str,
            llm_model_used="Human Refined", # Indicate it's human modified
            version_number=next_version_number,
            modified_by="Human", # Set to Human for refinement
            refinement_of_version_id=version_id # Link back to the base version
        )
        db.add(new_refined_version)
        db.commit()
        db.refresh(new_refined_version)

        # Parse the refined output to match the response model structure
        refined_output_parsed = json.loads(refined_output_json_str)

        return FormGenerationResponse(
            json_schema=refined_output_parsed,
            version_id=new_refined_version.id,
            version_number=new_refined_version.version_number,
            original_input_hash=new_refined_version.original_input_hash,
            llm_model_used=new_refined_version.llm_model_used,
            version_timestamp=new_refined_version.version_timestamp,
            modified_by=new_refined_version.modified_by,
            refinement_of_version_id=new_refined_version.refinement_of_version_id
        )
    except Exception as e:
        print(f"Error during form refinement: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

# TODO (Ensure  GET endpoints like /versions/{version_id}, /history/by_input_hash/{input_hash}, /versions/latest
# are updated to correctly return the 'modified_by' and 'refinement_of_version_id' fields from the database.)