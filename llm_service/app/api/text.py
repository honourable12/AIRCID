from fastapi import APIRouter, HTTPException
from app.models import TextSummarizeRequest, TextSummarizeResponse
from app.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()

@router.post("/summarize", response_model=TextSummarizeResponse)
async def summarize_text_endpoint(request: TextSummarizeRequest):
    """
    Accepts a long block of text and generates a concise summary using an LLM,
    tailoring the summary based on the provided context.
    """
    try:
        llm_output = llm_service.summarize_text(
            request.text_content,
            request.summary_context.value, 
            request.target_length
        )

        if "error" in llm_output.get("summary", ""):
            raise HTTPException(status_code=500, detail=llm_output["summary"])

        return TextSummarizeResponse(
            summary=llm_output["summary"],
            llm_raw_output=llm_output.get("llm_raw_output")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")