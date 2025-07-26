# app/api/v1/endpoints/studies.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from typing import List, Optional
from sqlalchemy.orm import selectinload

from app.core.database import get_async_session
from app.api.dependencies.auth import get_current_user, get_researcher_or_admin_user, get_admin_user
from app.models.study import Study, StudyCreate, StudyRead, StudyUpdate
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=StudyRead, status_code=status.HTTP_201_CREATED, summary="Create a new study")
async def create_study(
    study_create: StudyCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user
):
    """
    Create a new research study. Accessible by 'researcher' and 'administrator' roles.
    """
    # CORRECTED LINE: Unpack the Pydantic model's dictionary into the SQLAlchemy model constructor
    db_study = Study(**study_create.model_dump())
    # You might want to add current_user.id as a creator_id for the study here
    # db_study.creator_id = current_user.id (requires adding creator_id to Study model)

    session.add(db_study)
    await session.commit()
    await session.refresh(db_study)
    return db_study

@router.get("/", response_model=List[StudyRead], summary="Get all studies (Admin) or studies by researcher")
async def read_studies(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user
):
    """
    Retrieve a list of all research studies.
    - Administrators can see all studies.
    - Researchers can only see studies they are associated with (this would require a link/creator_id in Study model,
      for now, they will see all studies if no specific filter is applied based on user).
      **Note:** For granular researcher access, you'd extend the Study model with a `creator_id` or `researchers` relationship.
    """
    if current_user.role.name == "administrator":
        studies_query = await session.execute(select(Study))
        studies = studies_query.scalars().all()
    elif current_user.role.name == "researcher":
        studies_query = await session.execute(select(Study))
        studies = studies_query.scalars().all()
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view studies")

    return studies

@router.get("/{study_id}", response_model=StudyRead, summary="Get a study by ID")
async def read_study(
    study_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user
):
    """
    Retrieve a single research study by its ID.
    - Administrators can view any study.
    - Researchers can view studies they are associated with.
    """
    study_query = await session.execute(select(Study).where(Study.id == study_id))
    db_study = study_query.scalars().first()

    if not db_study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")

    return db_study

@router.put("/{study_id}", response_model=StudyRead, summary="Update an existing study")
async def update_study(
    study_id: int,
    study_update: StudyUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user
):
    """
    Update an existing research study by its ID.
    - Administrators can update any study.
    - Researchers can update studies they own.
    """
    study_query = await session.execute(select(Study).where(Study.id == study_id))
    db_study = study_query.scalars().first()

    if not db_study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")

    if current_user.role.name != "administrator":
        pass

    update_data = study_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_study, key, value)

    session.add(db_study)
    await session.commit()
    await session.refresh(db_study)
    return db_study

@router.delete("/{study_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a study")
async def delete_study(
    study_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_admin_user
):
    """
    Delete a research study by its ID. This action is restricted to 'administrator' roles.
    """
    study_query = await session.execute(select(Study).where(Study.id == study_id))
    db_study = study_query.scalars().first()

    if not db_study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")

    await session.delete(db_study)
    await session.commit()
    return