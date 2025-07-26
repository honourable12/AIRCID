# app/api/v1/endpoints/responses.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_async_session
from app.api.dependencies.auth import get_current_user, get_admin_user, get_researcher_or_admin_user
from app.models.response import Response, ResponseCreate, ResponseRead, ResponseUpdate
from app.models.question import Question # To verify question existence
from app.models.participant import Participant # To verify participant existence
from app.models.user import User # For current_user type hint

router = APIRouter()

@router.post("/", response_model=ResponseRead, status_code=status.HTTP_201_CREATED, summary="Submit a participant's response to a question")
async def create_response(
    response_create: ResponseCreate,
    session: AsyncSession = Depends(get_async_session),
    # Participant responses usually don't require user authentication unless tied to a specific logged-in user
    # If the participant is authenticated via a different mechanism, adjust this.
    # For now, allowing any user to submit, but linking to a specific participant_id
    current_user: Optional[User] = Depends(get_current_user) # Optional: if responses can be tied to a logged-in user
):
    """
    Submit a new response for a specific question by a specific participant.
    """
    # Verify question exists
    question_query = await session.execute(select(Question).where(Question.id == response_create.question_id))
    question = question_query.scalars().first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    # Verify participant exists
    participant_query = await session.execute(select(Participant).where(Participant.id == response_create.participant_id))
    participant = participant_query.scalars().first()
    if not participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
    
    # Optional: Associate response with current_user if provided and linking participants to users
    # if current_user and participant.user_id != current_user.id:
    #    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Participant does not belong to current user")

    db_response = Response(**response_create.model_dump())
    session.add(db_response)
    await session.commit()
    # Eager load relationships for the response model if ResponseRead includes them
    await session.refresh(db_response, attribute_names=["question", "participant"])
    return db_response


@router.get("/", response_model=List[ResponseRead], summary="Get all responses (Admin/Researcher) or responses for specific forms/participants")
async def read_responses(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user), # Only researchers/admins can read responses generally
    question_id: Optional[int] = None,
    participant_id: Optional[int] = None
):
    """
    Retrieve a list of responses, optionally filtered by question_id or participant_id.
    - Administrators can see all responses.
    - Researchers can see responses within studies they are authorized for.
    """
    query = select(Response)

    # Apply filters
    if question_id:
        query = query.where(Response.question_id == question_id)
    if participant_id:
        query = query.where(Response.participant_id == participant_id)

    # Eager load relationships if ResponseRead includes them
    query = query.options(
        selectinload(Response.question),
        selectinload(Response.participant).selectinload(Participant.user) # Eager load participant's user
    )

    # TODO: Implement granular authorization based on user roles and study ownership
    if current_user.role.name == "researcher":
        # Example: Filter responses to only those from studies created by the researcher
        # This would require linking responses back to studies, e.g., via question -> form -> study
        pass # Placeholder for actual filtering logic
    elif current_user.role.name != "administrator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view responses")

    responses_query = await session.execute(query)
    responses = responses_query.scalars().all()
    return responses

@router.get("/{response_id}", response_model=ResponseRead, summary="Get a response by ID")
async def read_response(
    response_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Retrieve a single response by its ID.
    - Administrators can view any response.
    - Researchers can view responses within studies they are authorized for.
    """
    response_query = await session.execute(
        select(Response)
        .where(Response.id == response_id)
        .options(
            selectinload(Response.question),
            selectinload(Response.participant).selectinload(Participant.user)
        )
    )
    db_response = response_query.scalars().first()

    if not db_response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Response not found")

    # TODO: Implement granular authorization based on user roles and study ownership
    # if current_user.role.name == "researcher" and not user_has_access_to_response_study(current_user, db_response):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this response")

    return db_response

@router.put("/{response_id}", response_model=ResponseRead, summary="Update an existing response")
async def update_response(
    response_id: int,
    response_update: ResponseUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user) # Only researchers/admins can update responses
):
    """
    Update an existing response by its ID.
    - Administrators can update any response.
    - Researchers can update responses within studies they are authorized for.
    """
    response_query = await session.execute(
        select(Response)
        .where(Response.id == response_id)
        .options(
            selectinload(Response.question),
            selectinload(Response.participant).selectinload(Participant.user)
        )
    )
    db_response = response_query.scalars().first()

    if not db_response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Response not found")

    # TODO: Implement granular authorization based on user roles and study ownership
    # if current_user.role.name == "researcher" and not user_has_access_to_response_study(current_user, db_response):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this response")

    update_data = response_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_response, key, value)

    session.add(db_response)
    await session.commit()
    await session.refresh(db_response, attribute_names=["question", "participant"]) # Refresh with relationships
    return db_response

@router.delete("/{response_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a response")
async def delete_response(
    response_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user) # Only administrators can delete responses
):
    """
    Delete a response by its ID. This action is restricted to 'administrator' roles.
    """
    response_query = await session.execute(select(Response).where(Response.id == response_id))
    db_response = response_query.scalars().first()

    if not db_response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Response not found")

    await session.delete(db_response)
    await session.commit()
    return