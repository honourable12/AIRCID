from fastapi import APIRouter, HTTPException
from app.models import FormGenerateRequest, FormGenerateResponse
from app.llm_service import LLMService
import json

router = APIRouter()
llm_service = LLMService()

@router.post("/generate", response_model=FormGenerateResponse)
async def generate_form_schema_endpoint(request: FormGenerateRequest):
    """
    Generates a valid JSON Schema for a data collection form based on study objectives
    and optional additional context using an LLM.
    """
    try:
        llm_output = llm_service.generate_json_schema(
            request.study_objectives,
            request.additional_context
        )

        if "error" in llm_output:
            raise HTTPException(status_code=500, detail=llm_output["error"])

        return FormGenerateResponse(
            json_schema=llm_output["json_schema"],
            llm_raw_output=llm_output.get("llm_raw_output")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    