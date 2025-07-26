# app/api/v1/endpoints/questions.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_async_session
from app.api.dependencies.auth import get_current_user, get_researcher_or_admin_user, get_admin_user

# Import the ORM models and Pydantic schemas from their correct locations
# DO NOT DEFINE ORM MODELS HERE. IMPORT THEM FROM app.models
from app.models.question import Question, QuestionCreate, QuestionRead, QuestionUpdate, QuestionType
from app.models.form import Form # Needed to check form existence
from app.models.user import User # For current_user type hint

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
    # Verify that the form exists
    form_query = await session.execute(select(Form).where(Form.id == question_create.form_id))
    form = form_query.scalars().first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    # TODO: Implement granular ownership check for the form's parent study
    # if current_user.role.name == "researcher":
    #     if form.study.creator_id != current_user.id: # Assuming form has a study relationship
    #         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to add questions to this form")

    db_question = Question(**question_create.model_dump())
    session.add(db_question)
    await session.commit()
    await session.refresh(db_question)
    return db_question

@router.get("/", response_model=List[QuestionRead], summary="Get all questions or filter by form ID")
async def read_questions(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user),
    form_id: Optional[int] = None
):
    """
    Retrieve a list of questions, optionally filtered by form ID.
    - Administrators can view all questions.
    - Researchers can only view questions for forms they have access to.
    """
    query = select(Question)
    if form_id:
        query = query.where(Question.form_id == form_id)

    # Eager load relationships if QuestionRead includes them
    query = query.options(selectinload(Question.form)) # Assuming QuestionRead might include Form details

    # TODO: Granular access check:
    # If current_user is a researcher, filter results based on studies they own
    if current_user.role.name == "researcher":
        # Example: Filter questions to only those from forms within studies created by the researcher
        # This would require linking forms to studies, and then filtering by study.creator_id
        # (e.g., query = query.join(Form).join(Study).where(Study.creator_id == current_user.id))
        pass # Placeholder for actual filtering logic
    elif current_user.role.name != "administrator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view questions")

    questions_query = await session.execute(query)
    questions = questions_query.scalars().all()
    return questions

@router.get("/{question_id}", response_model=QuestionRead, summary="Get a question by ID")
async def read_question(
    question_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Retrieve a single question by its ID.
    - Administrators can view any question.
    - Researchers can view questions for forms they have access to.
    """
    question_query = await session.execute(
        select(Question)
        .where(Question.id == question_id)
        .options(selectinload(Question.form)) # Eager load the related form
    )
    db_question = question_query.scalars().first()

    if not db_question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    # TODO: Implement granular ownership check for the question's parent form/study
    # if current_user.role.name == "researcher":
    #     if db_question.form.study.creator_id != current_user.id: # Assuming form and study relationships
    #         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this question")

    return db_question

@router.put("/{question_id}", response_model=QuestionRead, summary="Update an existing question")
async def update_question(
    question_id: int,
    question_update: QuestionUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Update an existing question by its ID.
    - Administrators can update any question.
    - Researchers can update questions for forms they have access to.
    """
    question_query = await session.execute(
        select(Question)
        .where(Question.id == question_id)
        .options(selectinload(Question.form))
    )
    db_question = question_query.scalars().first()

    if not db_question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    # TODO: Implement granular ownership check for the question's parent form/study
    # if current_user.role.name == "researcher":
    #     if db_question.form.study.creator_id != current_user.id: # Assuming form and study relationships
    #         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this question")

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
    current_user: User = Depends(get_admin_user) # Only administrators can delete questions directly
):
    """
    Delete a question by its ID. This action is restricted to 'administrator' roles.
    """
    question_query = await session.execute(select(Question).where(Question.id == question_id))
    db_question = question_query.scalars().first()

    if not db_question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    # TODO: Potentially allow researchers to delete questions for their studies,
    # but ensure cascade delete rules are respected
    # if current_user.role.name == "researcher":
    #     if db_question.form.study.creator_id != current_user.id:
    #         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this question")

    await session.delete(db_question)
    await session.commit()
    return