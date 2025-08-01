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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found.")

    new_form = Form(
        study_id=form_create.study_id,
        user_id=current_user.id, # Assign the current user as the creator
        title=form_create.title,
        description=form_create.description
    )
    session.add(new_form)
    await session.commit()
    await session.refresh(new_form)
    # Eagerly load the questions for the response
    new_form.questions # This will trigger the lazy load now that the session is active.
    return new_form

@router.get("/by_study/{study_id}", response_model=List[FormRead], summary="Get all forms for a specific study")
async def get_forms_by_study(
    study_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all forms associated with a given study ID.
    """
    # Check if the study exists first
    study_exists = await session.scalar(select(Study.id).where(Study.id == study_id))
    if not study_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found.")

    # Eagerly load the `questions` relationship to prevent MissingGreenlet errors.
    # This ensures that when the FormRead model is validated, the `form.questions`
    # attribute is already populated within the active session context.
    result = await session.execute(
        select(Form)
        .where(Form.study_id == study_id)
        .options(selectinload(Form.questions))
    )
    forms = result.scalars().all()

    # The validation will now succeed because `form.questions` is pre-loaded.
    return [FormRead.model_validate(form, from_attributes=True) for form in forms]


@router.get("/{form_id}", response_model=FormRead, summary="Get a single form by ID")
async def get_form(
    form_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve a single form by its ID.
    """
    # Also eagerly load questions here to avoid the same error
    result = await session.execute(
        select(Form)
        .where(Form.id == form_id)
        .options(selectinload(Form.questions))
    )
    db_form = result.scalars().first()
    if not db_form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    return db_form

@router.put("/{form_id}", response_model=FormRead, summary="Update an existing form")
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
        .options(selectinload(Form.created_by_user)) # Load creator to check permissions
    )
    db_form = result.scalars().first()

    if not db_form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    # Check for authorization. Creator must be current user or user must be admin.
    if current_user.role.name == "researcher" and db_form.created_by_user.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this form.")

    update_data = form_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_form, key, value)

    session.add(db_form)
    await session.commit()
    await session.refresh(db_form)
    
    # Eagerly load the questions for the response
    result_refreshed = await session.execute(
        select(Form)
        .where(Form.id == form_id)
        .options(selectinload(Form.questions))
    )
    db_form_refreshed = result_refreshed.scalars().first()
    
    return db_form_refreshed

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

    # Check authorization based on the user's role
    if current_user.role.name == "researcher" and db_form.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this form.")

    await session.delete(db_form)
    await session.commit()
    return None
