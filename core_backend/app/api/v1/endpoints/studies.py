from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_async_session
from app.api.dependencies.auth import get_current_user, get_researcher_or_admin_user, get_admin_user
from app.models.study import Study, StudyCreate, StudyRead, StudyUpdate, StudyStatus
from app.models.user import User 
from app.models.role import Role 

router = APIRouter()

async def get_study_by_id(study_id: int, session: AsyncSession) -> Optional[Study]:
    """Helper to fetch study with creator info."""
    result = await session.execute(
        select(Study).where(Study.id == study_id).options(selectinload(Study.creator).selectinload(User.role))
    )
    return result.scalars().first()

@router.post("/", response_model=StudyRead, status_code=status.HTTP_201_CREATED, summary="Create a new study")
async def create_study(
    study_create: StudyCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user) # Only researchers or admins can create
):
    """
    Create a new research study.
    - Automatically assigns the creator to the current user.
    - Only users with 'researcher' or 'administrator' roles can create studies.
    """
    db_study = Study(**study_create.model_dump(), creator_id=current_user.id)
    session.add(db_study)
    await session.commit()
    await session.refresh(db_study)
    
    # Reload with creator details for response model
    db_study.creator_email = current_user.email
    return db_study

@router.get("/", response_model=List[StudyRead], summary="Get all studies")
async def read_studies(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Retrieve a list of all studies.
    - Administrators can see all studies.
    - Researchers can only see studies they have created.
    """
    query = select(Study).options(selectinload(Study.creator).selectinload(User.role))

    if current_user.role.name == "researcher":
        query = query.where(Study.creator_id == current_user.id)
    
    studies_query = await session.execute(query)
    studies = studies_query.scalars().all()

    # Manually populate creator_email for StudyRead schema
    for study in studies:
        study.creator_email = study.creator.email
    
    return studies

@router.get("/{study_id}", response_model=StudyRead, summary="Get a study by ID")
async def read_study(
    study_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Retrieve a single study by its ID.
    - Administrators can view any study.
    - Researchers can only view studies they have created.
    """
    db_study = await get_study_by_id(study_id, session)

    if not db_study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")

    if current_user.role.name == "researcher" and db_study.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this study.")
    
    db_study.creator_email = db_study.creator.email
    return db_study

@router.put("/{study_id}", response_model=StudyRead, summary="Update an existing study")
async def update_study(
    study_id: int,
    study_update: StudyUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Update an existing study by its ID.
    - Administrators can update any study.
    - Researchers can only update studies they have created.
    """
    db_study = await get_study_by_id(study_id, session)

    if not db_study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found.")

    if current_user.role.name == "researcher" and db_study.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this study.")

    update_data = study_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_study, key, value)

    session.add(db_study)
    await session.commit()
    await session.refresh(db_study)
    db_study.creator_email = db_study.creator.email
    return db_study

@router.delete("/{study_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a study")
async def delete_study(
    study_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user) # Researchers can delete their own, Admins can delete any
):
    """
    Delete a study by its ID.
    - Administrators can delete any study.
    - Researchers can only delete studies they have created.
    """
    db_study = await get_study_by_id(study_id, session)

    if not db_study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found.")

    if current_user.role.name == "researcher" and db_study.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this study.")
    
    await session.delete(db_study)
    await session.commit()
    return