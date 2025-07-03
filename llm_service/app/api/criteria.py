from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from app.llm_service import LLMService
from app.models import (
    CriteriaAugmentationRequest,
    CriteriaAugmentationResponse,
    CriteriaVersionDetails,
    CriteriaRefinementRequest
)
from app.db_utils import get_db, AugmentedCriteriaVersion
from sqlalchemy.orm import Session
import json
import hashlib

router = APIRouter()
llm_service = LLMService()

def generate_input_hash(input_string: str) -> str:
    return hashlib.sha256(input_string.encode('utf-8')).hexdigest()

@router.post("/augment", response_model=CriteriaAugmentationResponse)
async def augment_criteria(
    request: CriteriaAugmentationRequest,
    db: Session = Depends(get_db)
):
    """
    Receives researcher's natural language descriptions of study criteria
    and uses LLMs to suggest clearer wording and structured rule templates.
    This function now also versions the generated output.
    """
    try:
        llm_response_json_str = llm_service.augment_criteria(request.researcher_input)
        llm_output_parsed = json.loads(llm_response_json_str)
        input_hash = generate_input_hash(request.researcher_input)

        latest_version_query = db.query(AugmentedCriteriaVersion)\
                                .filter(AugmentedCriteriaVersion.original_input_hash == input_hash)\
                                .order_by(AugmentedCriteriaVersion.version_number.desc())\
                                .first()
        next_version_number = 1
        if latest_version_query:
            next_version_number = latest_version_query.version_number + 1

        new_version = AugmentedCriteriaVersion(
            original_input=request.researcher_input,
            original_input_hash=input_hash,
            llm_output_json=llm_response_json_str,
            llm_model_used=llm_service.langchain_llm.model_name,
            version_number=next_version_number,
            modified_by="LLM", # Set to LLM for initial generation
            refinement_of_version_id=None # Not a refinement of a previous version
        )
        db.add(new_version)
        db.commit()
        db.refresh(new_version)

        return CriteriaAugmentationResponse(
            clearer_wording=llm_output_parsed.get("clearer_wording", "N/A"),
            suggested_rules=llm_output_parsed.get("suggested_rules", []),
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
            status_code=500, detail="LLM response was not a valid JSON. Check LLM output format."
        )
    except Exception as e:
        print(f"Error during criteria augmentation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@router.post("/versions/{version_id}/refine", response_model=CriteriaAugmentationResponse)
async def refine_criteria_version(
    version_id: int,
    request: CriteriaRefinementRequest,
    db: Session = Depends(get_db)
):
    base_version = db.query(AugmentedCriteriaVersion).filter(AugmentedCriteriaVersion.id == version_id).first()
    if not base_version:
        raise HTTPException(status_code=404, detail="Base criteria version not found for refinement.")

    try:
        refined_output_json_str = json.dumps(request.refined_output)
        original_input = base_version.original_input
        original_input_hash = base_version.original_input_hash

        latest_version_query = db.query(AugmentedCriteriaVersion)\
                                .filter(AugmentedCriteriaVersion.original_input_hash == original_input_hash)\
                                .order_by(AugmentedCriteriaVersion.version_number.desc())\
                                .first()
        next_version_number = 1
        if latest_version_query:
            next_version_number = latest_version_query.version_number + 1

        new_refined_version = AugmentedCriteriaVersion(
            original_input=original_input,
            original_input_hash=original_input_hash,
            llm_output_json=refined_output_json_str,
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

        return CriteriaAugmentationResponse(
            clearer_wording=refined_output_parsed.get("clearer_wording", "N/A"),
            suggested_rules=refined_output_parsed.get("suggested_rules", []),
            version_id=new_refined_version.id,
            version_number=new_refined_version.version_number,
            original_input_hash=new_refined_version.original_input_hash,
            llm_model_used=new_refined_version.llm_model_used,
            version_timestamp=new_refined_version.version_timestamp,
            modified_by=new_refined_version.modified_by,
            refinement_of_version_id=new_refined_version.refinement_of_version_id
        )
    except Exception as e:
        print(f"Error during criteria refinement: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

# TODO (Ensure GET endpoints like /versions/{version_id}, /history/by_input_hash/{input_hash}, /versions/latest
# are updated to correctly return the 'modified_by' and 'refinement_of_version_id' fields from the database.)