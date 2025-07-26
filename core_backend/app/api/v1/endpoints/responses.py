from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional, Any

from app.core.database import get_async_session
from app.api.dependencies.auth import get_current_user, get_researcher_or_admin_user, get_admin_user
from app.models.response import Response, ResponseCreate, ResponseRead, ResponseUpdate
from app.models.participant import Participant # Needed to check participant/study ownership
from app.models.form import Form # Needed to validate form_id
from app.models.question import Question # Needed to validate question_id
from app.models.user import User # For type hinting current_user

router = APIRouter()

@router.post("/", response_model=ResponseRead, status_code=status.HTTP_201_CREATED, summary="Submit a participant's response to a question")
async def create_response(
    response_create: ResponseCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user # Researchers/Admins can record responses
):
    """
    Submit a response for a specific participant to a particular question within a form.
    - Researchers can submit responses for participants in studies they own.
    - Administrators can submit responses for any participant in any study.
    """
    # 1. Verify Participant exists and current user has access to its study
    participant_query = await session.execute(
        select(Participant).where(Participant.id == response_create.participant_id).options(selectinload(Participant.study))
    )
    participant = participant_query.scalars().first()
    if not participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    # TODO: Implement granular ownership check for participant's study
    # if current_user.role.name == "researcher" and participant.study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to record responses for this participant")

    # 2. Verify Form exists
    form_query = await session.execute(select(Form).where(Form.id == response_create.form_id))
    form = form_query.scalars().first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    # 3. Verify Question exists and belongs to the specified form
    question_query = await session.execute(
        select(Question).where(
            Question.id == response_create.question_id,
            Question.form_id == response_create.form_id
        )
    )
    question = question_query.scalars().first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found or does not belong to the specified form.")

    # Optional: Basic validation based on question_type could be added here
    # E.g., if question.question_type == "number", try converting response_create.answer_text to int/float

    db_response = Response(**response_create.model_dump())
    session.add(db_response)
    await session.commit()
    await session.refresh(db_response)
    return db_response

@router.get("/", response_model=List[ResponseRead], summary="Get all responses (Admin) or responses for studies researcher has access to")
async def read_responses(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user,
    participant_id: Optional[int] = None, # Optional filter
    form_id: Optional[int] = None,       # Optional filter
    question_id: Optional[int] = None    # Optional filter
):
    """
    Retrieve a list of all responses, optionally filtered by participant, form, or question ID.
    - Administrators can see all responses.
    - Researchers can see responses belonging to participants/forms/questions within studies they are authorized for.
    """
    query = select(Response)

    # Apply filters if provided
    if participant_id:
        query = query.where(Response.participant_id == participant_id)
    if form_id:
        query = query.where(Response.form_id == form_id)
    if question_id:
        query = query.where(Response.question_id == question_id)

    # TODO: Implement granular access control for researchers
    # This would involve joining with Participant -> Study and checking Study.creator_id
    if current_user.role.name == "administrator":
        pass # Admin can view all
    elif current_user.role.name == "researcher":
        # For now, researchers see all responses matching filters.
        # This needs to be refined to only show responses from studies they own.
        pass
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view responses")

    responses_query = await session.execute(query)
    responses = responses_query.scalars().all()
    return responses

@router.get("/{response_id}", response_model=ResponseRead, summary="Get a response by ID")
async def read_response(
    response_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user
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
            selectinload(Response.participant).selectinload(Participant.study),
            selectinload(Response.form),
            selectinload(Response.question)
        )
    )
    db_response = response_query.scalars().first()

    if not db_response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Response not found")

    # TODO: Implement granular ownership check for the response's parent study
    # if current_user.role.name == "researcher" and db_response.participant.study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this response")

    return db_response

@router.put("/{response_id}", response_model=ResponseRead, summary="Update an existing response")
async def update_response(
    response_id: int,
    response_update: ResponseUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user
):
    """
    Update an existing response by its ID.
    - Administrators can update any response.
    - Researchers can update responses within studies they own.
    """
    response_query = await session.execute(
        select(Response)
        .where(Response.id == response_id)
        .options(selectinload(Response.participant).selectinload(Participant.study))
    )
    db_response = response_query.scalars().first()

    if not db_response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Response not found")

    # TODO: Implement granular ownership check for the response's parent study
    # if current_user.role.name == "researcher" and db_response.participant.study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this response")

    update_data = response_update.model_dump(exclude_unset=True)
    # Ensure participant_id, form_id, question_id cannot be changed via update
    update_data.pop("participant_id", None)
    update_data.pop("form_id", None)
    update_data.pop("question_id", None)

    for key, value in update_data.items():
        setattr(db_response, key, value)

    session.add(db_response)
    await session.commit()
    await session.refresh(db_response)
    return db_response

@router.delete("/{response_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a response")
async def delete_response(
    response_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_admin_user # Only administrators can delete responses
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