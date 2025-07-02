from fastapi import APIRouter, HTTPException
from app.models import QnARequest, QnAResponse
from app.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()

@router.post("/ask", response_model=QnAResponse)
async def ask_qna(request: QnARequest):
    """
    Answers a user's question by retrieving relevant context from the knowledge base
    and instructing the LLM to answer based only on that information (RAG).
    """
    try:
        response_data = llm_service.answer_question_with_rag(
            request.question,
            request.num_context_chunks
        )

        if "error" in response_data:
            raise HTTPException(status_code=500, detail=response_data["error"])

        return QnAResponse(
            answer=response_data["answer"],
            sources=response_data["sources"],
            retrieved_chunks=response_data.get("retrieved_chunks"),
            llm_raw_output=response_data.get("llm_raw_output")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")