# app/api/v1/endpoints/forms.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_async_session
from app.api.dependencies.auth import get_current_user, get_researcher_or_admin_user
from app.models.form import Form, FormCreate, FormRead, FormUpdate
from app.models.study import Study # Needed to check if study exists
from app.models.user import User # Needed for type hinting in dependencies
from app.api.dependencies import auth # Import auth module for get_password_hash if needed for other endpoints or user creation.

router = APIRouter()

@router.post("/", response_model=FormRead, status_code=status.HTTP_201_CREATED, summary="Create a new form for a study")
async def create_form(
    form_create: FormCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Create a new form associated with a study.
    - Only users with 'researcher' or 'administrator' roles can create forms.
    """
    # Check if the study exists
    study_query = await session.execute(select(Study).where(Study.id == form_create.study_id))
    study = study_query.scalars().first()
    if not study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")

    db_form = Form(
        **form_create.model_dump(),
        creator_id=current_user.id
    )
    session.add(db_form)
    await session.commit()
    await session.refresh(db_form)

    # Eagerly load creator, study, and questions for the response model
    form_with_relations = await session.execute(
        select(Form)
        .where(Form.id == db_form.id)
        .options(
            selectinload(Form.creator),
            selectinload(Form.study),
            selectinload(Form.questions) # Load questions if FormRead includes them
        )
    )
    return form_with_relations.scalars().first()

@router.get("/by_study/{study_id}", response_model=List[FormRead], summary="Get forms for a specific study")
async def get_forms_by_study(
    study_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Retrieve all forms associated with a specific study ID.
    - Accessible by 'researcher' or 'administrator' roles.
    """
    # Check if the study exists
    study_query = await session.execute(select(Study).where(Study.id == study_id))
    study = study_query.scalars().first()
    if not study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")

    result = await session.execute(
        select(Form)
        .where(Form.study_id == study_id)
        .options(
            selectinload(Form.creator),
            selectinload(Form.study),
            selectinload(Form.questions)
        )
    )
    forms = result.scalars().all()
    return forms

@router.get("/{form_id}", response_model=FormRead, summary="Get a form by ID")
async def get_form_by_id(
    form_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Retrieve a single form by its ID.
    - Accessible by 'researcher' or 'administrator' roles.
    """
    result = await session.execute(
        select(Form)
        .where(Form.id == form_id)
        .options(
            selectinload(Form.creator),
            selectinload(Form.study),
            selectinload(Form.questions)
        )
    )
    form = result.scalars().first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    return form

@router.put("/{form_id}", response_model=FormRead, summary="Update a form by ID")
async def update_form(
    form_id: int,
    form_update: FormUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Update an existing form by its ID.
    - Only users with 'researcher' or 'administrator' roles can update forms.
    """
    result = await session.execute(
        select(Form)
        .where(Form.id == form_id)
        .options(
            selectinload(Form.creator),
            selectinload(Form.study),
            selectinload(Form.questions)
        )
    )
    db_form = result.scalars().first()
    if not db_form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    update_data = form_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_form, key, value)

    session.add(db_form)
    await session.commit()
    await session.refresh(db_form)
    return db_form

@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a form by ID")
async def delete_form(
    form_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Delete a form by its ID.
    - Only users with 'researcher' or 'administrator' roles can delete forms.
    """
    result = await session.execute(select(Form).where(Form.id == form_id))
    db_form = result.scalars().first()
    if not db_form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    
    await session.delete(db_form)
    await session.commit()
    return