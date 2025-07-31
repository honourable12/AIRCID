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

@router.post("/", response_model=StudyRead, status_code=status.HTTP_201_CREATED)
async def create_study(
    study_create: StudyCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    new_study = Study(
        title=study_create.title,
        description=study_create.description,
        creator_id=current_user.id,
        status=StudyStatus.PENDING  # not a string!
    )

    session.add(new_study)
    await session.commit()
    await session.refresh(new_study)
    await session.refresh(new_study, attribute_names=["creator"])
    new_study.creator_email = new_study.creator.email
    return new_study

@router.get("/", response_model=List[StudyRead], summary="Retrieve all studies")
async def read_studies(
    session: AsyncSession = Depends(get_async_session)
):
    """
    Retrieve a list of all studies.
    """
    result = await session.execute(
        select(Study).options(selectinload(Study.creator).selectinload(User.role))
    )
    studies = result.scalars().all()
    # Populate creator_email for the response model
    for study in studies:
        study.creator_email = study.creator.email
    return studies

@router.get("/{study_id}", response_model=StudyRead, summary="Retrieve a study by ID")
async def read_study(study_id: int, session: AsyncSession = Depends(get_async_session)):
    """
    Retrieve a single study by its ID.
    """
    db_study = await get_study_by_id(study_id, session)
    if not db_study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found.")
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

    # ✅ Safely handle the status value (normalize case and validate)
    if "status" in update_data:
        if isinstance(update_data["status"], str):
            try:
                update_data["status"] = StudyStatus(update_data["status"].lower())
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid status value: {update_data['status']}. "
                        f"Allowed: {[s.value for s in StudyStatus]}"
                )

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