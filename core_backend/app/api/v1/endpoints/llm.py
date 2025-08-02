# app/api/v1/endpoints/llm.py
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Header, Path, Body, File, UploadFile, Form as FastAPIForm
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import json

from app.api.dependencies.auth import get_researcher_or_admin_user, get_current_user
from app.models.user import User

router = APIRouter()

# --- Pydantic Schemas for LLM Service Proxy ---

# Text Summarization API Schemas
class SummarizationRequest(BaseModel):
    text_content: str = Field(..., description="The text to be summarized.")
    summary_context: str = Field("briefing", description="The context for the summary.")
    target_length: str = Field("1 paragraph", description="The desired length of the summary.")

class SummarizationResponse(BaseModel):
    summary: str

# Documents API Schemas
class DocumentUploadResponse(BaseModel):
    document_id: str
    status: str

class DocumentRefinedOutput(BaseModel):
    title: str
    type: str
    properties: Dict[str, Any]

class DocumentRefineRequest(BaseModel):
    refined_output: DocumentRefinedOutput

# Form/Criteria Augmentation API Schemas
class FormAugmentRequest(BaseModel):
    study_criteria: str
    target_number: int = Field(default=5, description="The desired number of augmented criteria.")

class FormRefineRequest(BaseModel):
    refined_output: Dict[str, Any]

# --- Helper Function to Proxy Requests ---
async def proxy_request_to_llm_service(
    endpoint: str, 
    method: str, 
    data: Optional[Union[dict, str, bytes]] = None, 
    files: Optional[Dict[str, Any]] = None,
    llm_service_token: str = Header(..., description="The LLM service token from the client's auth response")
) -> Dict[str, Any]:
    """
    A generic function to forward requests to the LLM service.
    This function assumes the client has stored the llm_service_token
    from the login response and is passing it in a custom header.
    """
    llm_service_url = os.environ.get("LLM_SERVICE_URL", "http://llm_service_host:port")
    async with httpx.AsyncClient() as client:
        try:
            headers = {"Authorization": f"Bearer {llm_service_token}"}
            # Remove Content-Type header when sending files, httpx handles it
            if files:
                del headers["Content-Type"]
            
            # Decide on the request parameters based on method and data type
            if method == "POST":
                response = await client.post(f"{llm_service_url}{endpoint}", json=data, files=files, headers=headers)
            elif method == "GET":
                response = await client.get(f"{llm_service_url}{endpoint}", headers=headers)
            elif method == "DELETE":
                response = await client.delete(f"{llm_service_url}{endpoint}", headers=headers)
            else:
                raise HTTPException(status_code=500, detail="Unsupported HTTP method")

            response.raise_for_status()
            # The LLM service might return 204 No Content for a successful delete
            if response.status_code == status.HTTP_204_NO_CONTENT:
                return {}
            return response.json()
        except httpx.HTTPStatusError as e:
            # Re-raise the error with the LLM service's detail
            raise HTTPException(
                status_code=e.response.status_code, 
                detail=f"LLM Service Error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500, 
                detail=f"An error occurred while connecting to the LLM service: {e}"
            )

# --- LLM Service Proxy Endpoints ---

@router.post("/text/summarize", response_model=SummarizationResponse, summary="Summarize a block of text using the LLM service")
async def summarize_text(
    request_body: SummarizationRequest, 
    current_user: User = Depends(get_current_user),
    llm_service_token: str = Header(..., description="The LLM service token")
):
    """
    Forwards a summarization request to the LLM microservice.
    """
    llm_endpoint = "/api/v1/text/summarize"
    response_data = await proxy_request_to_llm_service(
        endpoint=llm_endpoint,
        method="POST",
        data=request_body.model_dump(),
        llm_service_token=llm_service_token
    )
    return SummarizationResponse(summary=response_data.get("summary"))

# Documents API Endpoints
@router.post("/documents/upload", status_code=status.HTTP_201_CREATED, summary="Upload a document for processing and indexing")
async def upload_document(
    current_user: User = Depends(get_researcher_or_admin_user),
    llm_service_token: str = Header(..., description="The LLM service token"),
    file: UploadFile = File(...)
):
    """
    Uploads a document to the LLM service. Note: This endpoint is set up to handle
    a multipart/form-data upload, which is a common way to send files.
    """
    llm_endpoint = "/api/v1/documents/upload"
    files = {'file': (file.filename, file.file, file.content_type)}
    response_data = await proxy_request_to_llm_service(
        endpoint=llm_endpoint,
        method="POST",
        files=files,
        llm_service_token=llm_service_token
    )
    return response_data

@router.post("/documents/versions/{version_id}/refine", summary="Refine a document version")
async def refine_document_version(
    request_body: DocumentRefineRequest,
    version_id: str = Path(..., description="The ID of the document version to refine."),
    current_user: User = Depends(get_researcher_or_admin_user),
    llm_service_token: str = Header(..., description="The LLM service token")
):
    """
    Forwards a request to refine an existing document version.
    """
    llm_endpoint = f"/api/v1/documents/versions/{version_id}/refine"
    response_data = await proxy_request_to_llm_service(
        endpoint=llm_endpoint,
        method="POST",
        data=request_body.model_dump_json(),
        llm_service_token=llm_service_token
    )
    return response_data

@router.get("/documents/versions/{version_id}", summary="Get a specific document version by ID")
async def get_document_version(
    version_id: str = Path(..., description="The ID of the document version."),
    current_user: User = Depends(get_researcher_or_admin_user),
    llm_service_token: str = Header(..., description="The LLM service token")
):
    """
    Forwards a request to get the details of a specific document version.
    """
    llm_endpoint = f"/api/v1/documents/versions/{version_id}"
    response_data = await proxy_request_to_llm_service(
        endpoint=llm_endpoint,
        method="GET",
        llm_service_token=llm_service_token
    )
    return response_data

@router.get("/documents/history/by_input_hash/{input_hash}", summary="Get all document versions for a given input hash")
async def get_document_history(
    input_hash: str = Path(..., description="The hash of the document input."),
    current_user: User = Depends(get_researcher_or_admin_user),
    llm_service_token: str = Header(..., description="The LLM service token")
):
    """
    Forwards a request to get a list of all versions for a given document input hash.
    """
    llm_endpoint = f"/api/v1/documents/history/by_input_hash/{input_hash}"
    response_data = await proxy_request_to_llm_service(
        endpoint=llm_endpoint,
        method="GET",
        llm_service_token=llm_service_token
    )
    return response_data

@router.get("/documents/versions/latest", summary="Get the latest document version for each unique input")
async def get_latest_document_versions(
    current_user: User = Depends(get_researcher_or_admin_user),
    llm_service_token: str = Header(..., description="The LLM service token")
):
    """
    Forwards a request to get a list of the latest versions for each unique document input.
    """
    llm_endpoint = "/api/v1/documents/versions/latest"
    response_data = await proxy_request_to_llm_service(
        endpoint=llm_endpoint,
        method="GET",
        llm_service_token=llm_service_token
    )
    return response_data

# Criteria Augmentation API Endpoints
@router.post("/forms/versions/{version_id}/augment", summary="Augment an existing form version with additional criteria")
async def augment_form_version(
    request_body: FormAugmentRequest,
    version_id: str = Path(..., description="The ID of the form version to augment."),
    current_user: User = Depends(get_researcher_or_admin_user),
    llm_service_token: str = Header(..., description="The LLM service token")
):
    """
    Forwards a request to augment an existing form version with additional criteria.
    """
    llm_endpoint = f"/api/v1/forms/versions/{version_id}/augment"
    response_data = await proxy_request_to_llm_service(
        endpoint=llm_endpoint,
        method="POST",
        data=request_body.model_dump(),
        llm_service_token=llm_service_token
    )
    return response_data

@router.post("/forms/versions/{version_id}/refine", summary="Refine an existing form version")
async def refine_form_version(
    request_body: FormRefineRequest,
    version_id: str = Path(..., description="The ID of the form version to refine."),
    current_user: User = Depends(get_researcher_or_admin_user),
    llm_service_token: str = Header(..., description="The LLM service token")
):
    """
    Forwards a request to refine an existing form version.
    """
    llm_endpoint = f"/api/v1/forms/versions/{version_id}/refine"
    response_data = await proxy_request_to_llm_service(
        endpoint=llm_endpoint,
        method="POST",
        data=request_body.model_dump(),
        llm_service_token=llm_service_token
    )
    return response_data

@router.get("/forms/versions/{version_id}", summary="Get a specific form version by ID")
async def get_form_version(
    version_id: str = Path(..., description="The ID of the form version."),
    current_user: User = Depends(get_researcher_or_admin_user),
    llm_service_token: str = Header(..., description="The LLM service token")
):
    """
    Forwards a request to get the details of a specific form version.
    """
    llm_endpoint = f"/api/v1/forms/versions/{version_id}"
    response_data = await proxy_request_to_llm_service(
        endpoint=llm_endpoint,
        method="GET",
        llm_service_token=llm_service_token
    )
    return response_data

@router.get("/forms/history/by_input_hash/{input_hash}", summary="Get all form versions for a given input hash")
async def get_form_history(
    input_hash: str = Path(..., description="The hash of the form input."),
    current_user: User = Depends(get_researcher_or_admin_user),
    llm_service_token: str = Header(..., description="The LLM service token")
):
    """
    Forwards a request to get a list of all versions for a given form input hash.
    """
    llm_endpoint = f"/api/v1/forms/history/by_input_hash/{input_hash}"
    response_data = await proxy_request_to_llm_service(
        endpoint=llm_endpoint,
        method="GET",
        llm_service_token=llm_service_token
    )
    return response_data

@router.get("/forms/versions/latest", summary="Get the latest form version for each unique input")
async def get_latest_form_versions(
    current_user: User = Depends(get_researcher_or_admin_user),
    llm_service_token: str = Header(..., description="The LLM service token")
):
    """
    Forwards a request to get a list of the latest versions for each unique form input.
    """
    llm_endpoint = "/api/v1/forms/versions/latest"
    response_data = await proxy_request_to_llm_service(
        endpoint=llm_endpoint,
        method="GET",
        llm_service_token=llm_service_token
    )
    return response_data
