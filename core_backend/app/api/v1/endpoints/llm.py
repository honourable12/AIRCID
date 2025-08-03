# app/api/v1/endpoints/llm.py
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Header, Path, Body, File, UploadFile, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

# Import the corrected dependency functions from auth.py
from app.api.dependencies.auth import get_researcher_or_admin_user, get_llm_service_token
from app.models.user import User

router = APIRouter()

# Assuming the LLM service URL is set as an environment variable
# or a constant in your config.
LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "http://localhost:8001/api/v1")

# We define a dependency to get the LLM service token
# This function is responsible for making a request to the LLM service's /token endpoint
# to get a valid JWT.
async def get_llm_token(current_user: User = Depends(get_researcher_or_admin_user)):
    """
    Dependency that retrieves a JWT from the LLM microservice for the current user.
    """
    token = await get_llm_service_token(current_user)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not retrieve a token from the LLM service."
        )
    return token

# A proxy function to forward requests to the LLM microservice
async def proxy_request_to_llm_service(
    method: str,
    endpoint: str,
    token: str,
    request: Request,
    payload: Optional[dict] = None,
    files: Optional[Dict] = None
):
    """
    Generic proxy function to forward requests to the LLM microservice.
    """
    headers = dict(request.headers)

    # CRITICAL FIX: Safely remove 'Content-Type' as httpx will set it correctly,
    # especially for multipart/form-data.
    headers.pop("Content-Type", None)

    # Authorization header is set with the new LLM service token
    headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient() as client:
        url = f"{LLM_SERVICE_URL}{endpoint}"

        try:
            # Dynamically handle requests with or without files/JSON payload
            if files:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    data=payload,  # Payload is passed as data for multipart
                    files=files,
                    timeout=30.0  # Set a timeout for the request
                )
            else:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )

            response.raise_for_status()

            # If the response is a 204, return a simple success message
            if response.status_code == status.HTTP_204_NO_CONTENT:
                return {"message": "Success"}

            return response.json()

        except httpx.HTTPStatusError as exc:
            # Re-raise the exception with details from the LLM service
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"LLM Service Error: {exc.response.text}"
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to the LLM service: {exc}"
            )


# --- Pydantic Schemas for LLM Service Proxy ---
# (These schemas are kept for clarity and can be used for request validation)
class SummarizationRequest(BaseModel):
    text_content: str = Field(..., description="The text to be summarized.")
    summary_context: str = Field("briefing", description="The context for the summary.")
    target_length: str = Field("1 paragraph", description="The desired length of the summary.")

# Form/Criteria Augmentation API Schemas
class FormAugmentRequest(BaseModel):
    study_criteria: str
    target_number: int = Field(default=5, description="The desired number of augmented criteria.")

class DocumentRefineRequest(BaseModel):
    refined_output: Dict[str, Any]

class FormRefineRequest(BaseModel):
    refined_output: Dict[str, Any]

# --- Documents Endpoints (Proxying to LLM Microservice) ---
@router.post("/documents/upload", summary="Upload a document to the LLM microservice")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    token: str = Depends(get_llm_token)
):
    """
    Upload a document (PDF, TXT, or image) for processing and indexing in the LLM service.
    """
    files = {'file': (file.filename, file.file, file.content_type)}

    response_data = await proxy_request_to_llm_service(
        method="POST",
        endpoint="/documents/upload",
        token=token,
        request=request,
        files=files
    )
    return response_data

@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a document from the LLM microservice")
async def delete_document(
    request: Request,
    document_id: str = Path(..., description="The ID of the document to delete."),
    token: str = Depends(get_llm_token)
):
    """
    Delete a document from the LLM microservice by its ID.
    """
    await proxy_request_to_llm_service(
        method="DELETE",
        endpoint=f"/documents/{document_id}",
        token=token,
        request=request
    )
    return

# --- Form Generation Endpoints (Proxying to LLM Microservice) ---
@router.post("/forms/generate-schema", summary="Generate a form schema using the LLM microservice")
async def generate_form_schema(
    request: Request,
    payload: dict = Body(..., description="The natural language description for the form schema."),
    token: str = Depends(get_llm_token)
):
    """
    Generate a form schema (JSON object) based on a natural language description.
    """
    response_data = await proxy_request_to_llm_service(
        method="POST",
        endpoint="/forms/generate-schema",
        token=token,
        request=request,
        payload=payload
    )
    return response_data

@router.post("/forms/refine-schema/{version_id}", summary="Refine an existing form schema using the LLM microservice")
async def refine_form_schema(
    request: Request,
    version_id: int = Path(..., description="The version ID of the form schema to refine."),
    payload: dict = Body(..., description="The new natural language description or JSON for refinement."),
    token: str = Depends(get_llm_token)
):
    """
    Refine an existing form schema with a new natural language description.
    """
    response_data = await proxy_request_to_llm_service(
        method="POST",
        endpoint=f"/forms/refine-schema/{version_id}",
        token=token,
        request=request,
        payload=payload
    )
    return response_data

# --- Other LLM Endpoints ---
@router.post("/text/summarize", summary="Summarize a block of text using the LLM microservice")
async def summarize_text(
    request: Request,
    payload: SummarizationRequest = Body(..., description="The text and context for summarization."),
    token: str = Depends(get_llm_token)
):
    """
    Summarize a long block of text.
    """
    response_data = await proxy_request_to_llm_service(
        method="POST",
        endpoint="/text/summarize",
        token=token,
        request=request,
        payload=payload.model_dump()
    )
    return response_data

@router.post("/criteria/augment", summary="Augment study criteria using the LLM microservice")
async def augment_criteria(
    request: Request,
    payload: FormAugmentRequest = Body(..., description="The study criteria and target number for augmentation."),
    token: str = Depends(get_llm_token)
):
    """
    Augment study criteria to generate additional relevant criteria.
    """
    response_data = await proxy_request_to_llm_service(
        method="POST",
        endpoint="/criteria/augment",
        token=token,
        request=request,
        payload=payload.model_dump()
    )
    return response_data
