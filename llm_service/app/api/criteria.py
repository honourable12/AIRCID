from typing import List
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
from app.security import role_required
from sqlalchemy.orm import Session
import json
import hashlib

router = APIRouter()
llm_service = LLMService()

def generate_input_hash(input_string: str) -> str:
    return hashlib.sha256(input_string.encode('utf-8')).hexdigest()

@router.post("/augment", response_model=CriteriaAugmentationResponse, summary="Augment clinical trial criteria",
            dependencies=[Depends(role_required(["researcher", "admin"]))])
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
            modified_by="LLM", 
            refinement_of_version_id=None 
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

@router.post("/versions/{version_id}/refine", response_model=CriteriaAugmentationResponse, summary="Refine an existing criteria version",
            dependencies=[Depends(role_required(["researcher", "admin"]))])
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
            llm_model_used="researcher Refined",
            version_number=next_version_number,
            modified_by="researcher", 
            refinement_of_version_id=version_id
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


@router.get("/versions/{version_id}", response_model=CriteriaVersionDetails, summary="Get a specific criteria version by ID",
            dependencies=[Depends(role_required(["researcher", "admin"]))])
async def get_criteria_version_by_id(
    version_id: int,
    db: Session = Depends(get_db)
):
    version_record = db.query(AugmentedCriteriaVersion).filter(AugmentedCriteriaVersion.id == version_id).first()
    if not version_record:
        raise HTTPException(status_code=404, detail="Criteria version not found.")

    llm_output_parsed = json.loads(version_record.llm_output_json)

    return CriteriaVersionDetails(
        version_id=version_record.id,
        version_number=version_record.version_number,
        original_input=version_record.original_input,
        llm_output=llm_output_parsed,
        llm_model_used=version_record.llm_model_used,
        version_timestamp=version_record.version_timestamp,
        modified_by=version_record.modified_by,
        refinement_of_version_id=version_record.refinement_of_version_id
    )

@router.get("/history/by_input_hash/{input_hash}", response_model=List[CriteriaVersionDetails], summary="Get all criteria versions for a given input",
            dependencies=[Depends(role_required(["researcher", "admin"]))]) 
async def get_criteria_history_by_input_hash(
    input_hash: str,
    db: Session = Depends(get_db)
):
    versions = db.query(AugmentedCriteriaVersion)\
                .filter(AugmentedCriteriaVersion.original_input_hash == input_hash)\
                .order_by(AugmentedCriteriaVersion.version_number)\
                .all()
    if not versions:
        raise HTTPException(status_code=404, detail="No criteria versions found for this input hash.")
    
    return [
        CriteriaVersionDetails(
            version_id=v.id,
            version_number=v.version_number,
            original_input=v.original_input,
            llm_output=json.loads(v.llm_output_json),
            llm_model_used=v.llm_model_used,
            version_timestamp=v.version_timestamp,
            modified_by=v.modified_by,
            refinement_of_version_id=v.refinement_of_version_id
        ) for v in versions
    ]

@router.get("/versions/latest", response_model=List[CriteriaVersionDetails], summary="Get the latest criteria version for each unique input",
            dependencies=[Depends(role_required(["researcher", "admin"]))])
async def get_latest_criteria_versions(
    db: Session = Depends(get_db)
):
    subquery = db.query(
        AugmentedCriteriaVersion.original_input_hash,
        db.func.max(AugmentedCriteriaVersion.version_number).label("max_version")
    ).group_by(AugmentedCriteriaVersion.original_input_hash).subquery()

    latest_versions = db.query(AugmentedCriteriaVersion)\
                        .join(
                            subquery,
                            (AugmentedCriteriaVersion.original_input_hash == subquery.c.original_input_hash) &
                            (AugmentedCriteriaVersion.version_number == subquery.c.max_version)
                        ).all()
    
    return [
        CriteriaVersionDetails(
            version_id=v.id,
            version_number=v.version_number,
            original_input=v.original_input,
            llm_output=json.loads(v.llm_output_json),
            llm_model_used=v.llm_model_used,
            version_timestamp=v.version_timestamp,
            modified_by=v.modified_by,
            refinement_of_version_id=v.refinement_of_version_id
        ) for v in latest_versions
    ]