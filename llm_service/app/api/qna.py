from fastapi import APIRouter, HTTPException
from app.models import QnARequest, QnAResponse, ChatHistoryItem
from app.llm_service import LLMService
from typing import List, Dict, Any

router = APIRouter()
llm_service = LLMService() # This will initialize the LLMService and load ChromaDB

@router.post("/ask", response_model=QnAResponse)
async def ask_qna(request: QnARequest):
    """
    Answers a user's question by retrieving relevant context from the knowledge base
    and instructing the LLM to answer based only on that information (RAG).
    Handles chat history summarization for long conversations.
    """
    chat_history_dicts = []
    if request.chat_history:
        for item in request.chat_history:
            chat_history_dicts.append({"role": item.role, "content": item.content})

    try:
        response_data = await llm_service.answer_question_with_rag(
            request.question,
            request.num_context_chunks,
            chat_history=chat_history_dicts
        )

        if "error" in response_data:
            raise HTTPException(status_code=500, detail=response_data["error"])

        return QnAResponse(
            answer=response_data["answer"],
            sources=response_data["sources"],
            retrieved_chunks=response_data.get("retrieved_chunks"),
            llm_raw_output=response_data.get("llm_raw_output"),
            history_summarized=response_data.get("history_summarized", False) # Pass the status
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")