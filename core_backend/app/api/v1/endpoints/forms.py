# app/api/v1/endpoints/forms.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload # For eagerly loading relationships
from typing import List, Optional

from app.core.database import get_async_session
from app.api.dependencies.auth import get_current_user, get_researcher_or_admin_user, get_admin_user
from app.models.form import Form, FormCreate, FormRead, FormUpdate
from app.models.study import Study # Needed to check study ownership for authorization
from app.models.user import User # For type hinting current_user

router = APIRouter()

@router.post("/", response_model=FormRead, status_code=status.HTTP_201_CREATED, summary="Create a new form for a study")
async def create_form(
    form_create: FormCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user # Only researchers/admins can create forms
):
    """
    Create a new form associated with a specific study.
    - Researchers can create forms for studies they own (if study has a creator_id).
    - Administrators can create forms for any study.
    """
    # Verify the study exists and current user has access to it
    study_query = await session.execute(select(Study).where(Study.id == form_create.study_id))
    study = study_query.scalars().first()

    if not study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")

    # TODO: Implement granular ownership check if Study model gets a creator_id
    # For now, if current_user is researcher, and study has creator_id, check if current_user.id == study.creator_id
    # If current_user.role.name == "researcher" and study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create form for this study")

    db_form = Form(**form_create.model_dump())
    session.add(db_form)
    await session.commit()
    await session.refresh(db_form)
    return db_form

@router.get("/", response_model=List[FormRead], summary="Get all forms (Admin) or forms for studies researcher has access to")
async def read_forms(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user
):
    """
    Retrieve a list of all forms.
    - Administrators can see all forms.
    - Researchers can see forms belonging to studies they are authorized for.
    """
    if current_user.role.name == "administrator":
        forms_query = await session.execute(select(Form))
        forms = forms_query.scalars().all()
    elif current_user.role.name == "researcher":
        # TODO: Implement filtering for researcher's owned studies if Study has creator_id
        # For now, researchers see all forms due to lack of study ownership linkage
        forms_query = await session.execute(select(Form))
        forms = forms_query.scalars().all()
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view forms")

    return forms

@router.get("/{form_id}", response_model=FormRead, summary="Get a form by ID")
async def read_form(
    form_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user
):
    """
    Retrieve a single form by its ID.
    - Administrators can view any form.
    - Researchers can view forms within studies they are authorized for.
    """
    # Load form with its study to check ownership if needed
    form_query = await session.execute(
        select(Form).where(Form.id == form_id).options(selectinload(Form.study))
    )
    db_form = form_query.scalars().first()

    if not db_form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    # TODO: Implement granular ownership check for the form's parent study
    # if current_user.role.name == "researcher" and db_form.study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this form")

    return db_form

@router.put("/{form_id}", response_model=FormRead, summary="Update an existing form")
async def update_form(
    form_id: int,
    form_update: FormUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user
):
    """
    Update an existing form by its ID.
    - Administrators can update any form.
    - Researchers can update forms within studies they own.
    """
    form_query = await session.execute(
        select(Form).where(Form.id == form_id).options(selectinload(Form.study))
    )
    db_form = form_query.scalars().first()

    if not db_form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    # TODO: Implement granular ownership check for the form's parent study
    # if current_user.role.name == "researcher" and db_form.study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this form")

    update_data = form_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_form, key, value)

    session.add(db_form)
    await session.commit()
    await session.refresh(db_form)
    return db_form

@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a form")
async def delete_form(
    form_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_admin_user # Only administrators can delete forms
):
    """
    Delete a form by its ID. This action is restricted to 'administrator' roles.
    """
    form_query = await session.execute(select(Form).where(Form.id == form_id))
    db_form = form_query.scalars().first()

    if not db_form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    await session.delete(db_form)
    await session.commit()
    return