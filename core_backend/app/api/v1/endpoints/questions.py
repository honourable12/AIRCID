# app/api/v1/endpoints/questions.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_async_session
# Ensure these are correctly imported for use with Depends()
from app.api.dependencies.auth import get_current_user, get_researcher_or_admin_user, get_admin_user
from app.models.question import Question, QuestionCreate, QuestionRead, QuestionUpdate
from app.models.form import Form # Needed to check form/study ownership for authorization
from app.models.user import User # For type hinting current_user

router = APIRouter()

@router.post("/", response_model=QuestionRead, status_code=status.HTTP_201_CREATED, summary="Create a new question for a form")
async def create_question(
    question_create: QuestionCreate,
    session: AsyncSession = Depends(get_async_session),
    # FIX: Use Depends() for dependency injection
    current_user: User = Depends(get_researcher_or_admin_user) # Only researchers/admins can create questions
):
    """
    Create a new question associated with a specific form.
    - Researchers can create questions for forms within studies they own.
    - Administrators can create questions for any form.
    """
    # Verify the form exists and current user has access to its parent study
    form_query = await session.execute(
        select(Form).where(Form.id == question_create.form_id).options(selectinload(Form.study))
    )
    form = form_query.scalars().first()

    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    # TODO: Implement granular ownership check for the form's parent study
    # if current_user.role.name == "researcher" and form.study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create question for this form")

    db_question = Question(**question_create.model_dump())
    session.add(db_question)
    await session.commit()
    await session.refresh(db_question)
    return db_question

@router.get("/", response_model=List[QuestionRead], summary="Get all questions (Admin) or questions for forms researcher has access to")
async def read_questions(
    session: AsyncSession = Depends(get_async_session),
    # FIX: Use Depends() for dependency injection
    current_user: User = Depends(get_researcher_or_admin_user),
    form_id: Optional[int] = None # Optional filter by form_id
):
    """
    Retrieve a list of all questions, optionally filtered by form ID.
    - Administrators can see all questions.
    - Researchers can see questions belonging to forms within studies they are authorized for.
    """
    query = select(Question)
    if form_id:
        # If filtering by form_id, first check access to that specific form/study
        form_query = await session.execute(
            select(Form).where(Form.id == form_id).options(selectinload(Form.study))
        )
        form = form_query.scalars().first()
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found for filtering")

        # TODO: Granular access check:
        # if current_user.role.name == "researcher" and form.study.creator_id != current_user.id:
        #    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view questions for this form")

        query = query.where(Question.form_id == form_id)

    # Global authorization for listing all questions
    if current_user.role.name == "administrator":
        pass # Admin can view all
    elif current_user.role.name == "researcher":
        # TODO: Implement filtering based on studies researcher has access to
        pass # For now, researchers see all if no form_id filter.
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view questions")

    questions_query = await session.execute(query)
    questions = questions_query.scalars().all()
    return questions

@router.get("/{question_id}", response_model=QuestionRead, summary="Get a question by ID")
async def read_question(
    question_id: int,
    session: AsyncSession = Depends(get_async_session),
    # FIX: Use Depends() for dependency injection
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Retrieve a single question by its ID.
    - Administrators can view any question.
    - Researchers can view questions belonging to forms within studies they are authorized for.
    """
    question_query = await session.execute(
        select(Question).where(Question.id == question_id).options(selectinload(Question.form).selectinload(Form.study))
    )
    db_question = question_query.scalars().first()

    if not db_question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    # TODO: Implement granular ownership check for the question's parent form/study
    # if current_user.role.name == "researcher" and db_question.form.study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this question")

    return db_question

@router.put("/{question_id}", response_model=QuestionRead, summary="Update an existing question")
async def update_question(
    question_id: int,
    question_update: QuestionUpdate,
    session: AsyncSession = Depends(get_async_session),
    # FIX: Use Depends() for dependency injection
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Update an existing question by its ID.
    - Administrators can update any question.
    - Researchers can update questions within forms they own.
    """
    question_query = await session.execute(
        select(Question).where(Question.id == question_id).options(selectinload(Question.form).selectinload(Form.study))
    )
    db_question = question_query.scalars().first()

    if not db_question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    # TODO: Implement granular ownership check for the question's parent form/study
    # if current_user.role.name == "researcher" and db_question.form.study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this question")

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
    # FIX: Use Depends() for dependency injection
    current_user: User = Depends(get_admin_user) # Only administrators can delete questions
):
    """
    Delete a question by its ID. This action is restricted to 'administrator' roles.
    """
    question_query = await session.execute(select(Question).where(Question.id == question_id))
    db_question = question_query.scalars().first()

    if not db_question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    await session.delete(db_question)
    await session.commit()
    return