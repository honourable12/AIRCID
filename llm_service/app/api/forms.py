from typing import List
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
from app.security import role_required

router = APIRouter()
llm_service = LLMService()

def generate_input_hash(input_string: str) -> str:
    return hashlib.sha256(input_string.encode('utf-8')).hexdigest()

@router.post("/generate", response_model=FormGenerationResponse, summary="Generate a preliminary JSON form schema",
            dependencies=[Depends(role_required(["researcher", "admin"]))])
async def generate_form(
    request: FormGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    Based on study objectives or selected criteria, generates preliminary JSON schema
    definitions for dynamic data collection forms.
    This function now also versions the generated output.
    Requires a 'researcher' or 'admin' role 
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

@router.post("/versions/{version_id}/refine", response_model=FormGenerationResponse, summary="Refine an existing form version",
            dependencies=[Depends(role_required(["researcher", "admin"]))])
async def refine_form_version(
    version_id: int,
    request: FormRefinementRequest,
    db: Session = Depends(get_db)
):

    base_version = db.query(GeneratedFormVersion).filter(GeneratedFormVersion.id == version_id).first()
    if not base_version:
        raise HTTPException(status_code=404, detail="Base form version not found for refinement.")

    try:
        refined_output_json_str = json.dumps(request.refined_output)
        original_input = base_version.original_input
        original_input_hash = base_version.original_input_hash

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

@router.get("/versions/{version_id}", response_model=FormVersionDetails, summary="Get a specific form version by ID",
            dependencies=[Depends(role_required(["researcher", "admin"]))]) 
async def get_form_version_by_id(
    version_id: int,
    db: Session = Depends(get_db)
):
    version_record = db.query(GeneratedFormVersion).filter(GeneratedFormVersion.id == version_id).first()
    if not version_record:
        raise HTTPException(status_code=404, detail="Form version not found.")

    llm_output_parsed = json.loads(version_record.llm_output_json_schema)

    return FormVersionDetails(
        version_id=version_record.id,
        version_number=version_record.version_number,
        original_input=version_record.original_input,
        llm_output_json_schema=llm_output_parsed,
        llm_model_used=version_record.llm_model_used,
        version_timestamp=version_record.version_timestamp,
        modified_by=version_record.modified_by,
        refinement_of_version_id=version_record.refinement_of_version_id
    )

@router.get("/history/by_input_hash/{input_hash}", response_model=List[FormVersionDetails], summary="Get all form versions for a given input",
            dependencies=[Depends(role_required(["researcher", "admin"]))]) 
async def get_form_history_by_input_hash(
    input_hash: str,
    db: Session = Depends(get_db)
):
    versions = db.query(GeneratedFormVersion)\
                .filter(GeneratedFormVersion.original_input_hash == input_hash)\
                .order_by(GeneratedFormVersion.version_number)\
                .all()
    if not versions:
        raise HTTPException(status_code=404, detail="No form versions found for this input hash.")
    
    return [
        FormVersionDetails(
            version_id=v.id,
            version_number=v.version_number,
            original_input=v.original_input,
            llm_output_json_schema=json.loads(v.llm_output_json_schema),
            llm_model_used=v.llm_model_used,
            version_timestamp=v.version_timestamp,
            modified_by=v.modified_by,
            refinement_of_version_id=v.refinement_of_version_id
        ) for v in versions
    ]

@router.get("/versions/latest", response_model=List[FormVersionDetails], summary="Get the latest form version for each unique input",
            dependencies=[Depends(role_required(["researcher", "admin"]))])
async def get_latest_form_versions(
    db: Session = Depends(get_db)
):
    subquery = db.query(
        GeneratedFormVersion.original_input_hash,
        db.func.max(GeneratedFormVersion.version_number).label("max_version")
    ).group_by(GeneratedFormVersion.original_input_hash).subquery()

    latest_versions = db.query(GeneratedFormVersion)\
                        .join(
                            subquery,
                            (GeneratedFormVersion.original_input_hash == subquery.c.original_input_hash) &
                            (GeneratedFormVersion.version_number == subquery.c.max_version)
                        ).all()
    
    return [
        FormVersionDetails(
            version_id=v.id,
            version_number=v.version_number,
            original_input=v.original_input,
            llm_output_json_schema=json.loads(v.llm_output_json_schema),
            llm_model_used=v.llm_model_used,
            version_timestamp=v.version_timestamp,
            modified_by=v.modified_by,
            refinement_of_version_id=v.refinement_of_version_id
        ) for v in latest_versions
    ]
    