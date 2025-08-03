# app/api/v1/endpoints/questions.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_async_session
from app.api.dependencies.auth import get_current_user, get_researcher_or_admin_user, get_admin_user

from app.models.question import Question, QuestionCreate, QuestionRead, QuestionUpdate, QuestionType
from app.models.form import Form # Needed to check form existence
from app.models.user import User # For current_user type hint
from app.models.study import Study # Needed for study ownership check

router = APIRouter()

@router.post("/", response_model=QuestionRead, status_code=status.HTTP_201_CREATED, summary="Create a new question for a form")
async def create_question(
    question_create: QuestionCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Create a new question associated with a specific form.
    - Researchers can create questions for forms within studies they own.
    - Administrators can create questions for any form.
    """
    # Verify that the form exists and get its associated study creator
    form_query = await session.execute(
        select(Form)
        .where(Form.id == question_create.form_id)
        .options(selectinload(Form.study))
    )
    db_form = form_query.scalars().first()

    if not db_form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    # Check for ownership or admin role
    if current_user.role.name == "researcher" and db_form.study.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create questions for this form's study"
        )

    # Create the new question instance
    db_question = Question(
        form_id=question_create.form_id,
        question_text=question_create.question_text,
        question_type=question_create.question_type,
        options=question_create.options,
        is_required=question_create.is_required
    )
    session.add(db_question)
    await session.commit()
    await session.refresh(db_question)
    return db_question

@router.get("/{question_id}", response_model=QuestionRead, summary="Get a question by ID")
async def get_question(
    question_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve a single question by its ID.
    - Accessible to any authenticated user.
    """
    result = await session.execute(
        select(Question).where(Question.id == question_id)
    )
    question = result.scalars().first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question

@router.get("/", response_model=List[QuestionRead], summary="Get all questions for a form")
async def get_all_questions(
    form_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all questions for a specific form.
    - Accessible to any authenticated user.
    """
    # Corrected the query to remove the invalid selectinload on a column.
    result = await session.execute(
        select(Question).where(Question.form_id == form_id)
    )
    questions = result.scalars().all()
    return questions

@router.put("/{question_id}", response_model=QuestionRead, summary="Update a question")
async def update_question(
    question_id: int,
    question_update: QuestionUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Update an existing question.
    - Only administrators or researchers who own the parent study can update a question.
    """
    question_query = await session.execute(
        select(Question)
        .where(Question.id == question_id)
        .options(selectinload(Question.form).selectinload(Form.study)) # Eagerly load form and study
    )
    db_question = question_query.scalars().first()

    if not db_question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    # Check for ownership or admin role
    if current_user.role.name == "researcher" and db_question.form.study.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this question")

    update_data = question_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_question, key, value)

    session.add(db_question)
    await session.commit()
    await session.refresh(db_question)
    return db_question

@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a question")
async def delete_question(
    question_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Delete a question by its ID. This action is restricted to 'administrator' roles
    or researchers who own the parent study.
    """
    question_query = await session.execute(
        select(Question)
        .where(Question.id == question_id)
        .options(selectinload(Question.form).selectinload(Form.study))
    )
    db_question = question_query.scalars().first()

    if not db_question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    # Allow researchers to delete questions for their studies, or allow administrators
    if current_user.role.name == "researcher" and db_question.form.study.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this question")

    await session.delete(db_question)
    await session.commit()
    return {"message": "Question deleted successfully."}