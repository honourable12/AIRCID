from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_async_session
from app.api.dependencies.auth import get_current_user, get_researcher_or_admin_user, get_admin_user
from app.models.participant import Participant, ParticipantCreate, ParticipantRead, ParticipantUpdate
from app.models.study import Study 
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=ParticipantRead, status_code=status.HTTP_201_CREATED, summary="Enroll a new participant in a study")
async def create_participant(
    participant_create: ParticipantCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user 
):
    """
    Enroll a new participant in a specific study.
    - Researchers can enroll participants in studies they own (if study has a creator_id).
    - Administrators can enroll participants in any study.
    """
    # Verify the study exists and current user has access to it
    study_query = await session.execute(select(Study).where(Study.id == participant_create.study_id))
    study = study_query.scalars().first()

    if not study:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")

    # TODO: Implement granular ownership check if Study model gets a creator_id
    # if current_user.role.name == "researcher" and study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to enroll participants for this study")

    db_participant = Participant(**participant_create.model_dump())
    session.add(db_participant)
    await session.commit()
    await session.refresh(db_participant)
    return db_participant

@router.get("/", response_model=List[ParticipantRead], summary="Get all participants (Admin) or participants for studies researcher has access to")
async def read_participants(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user,
    study_id: Optional[int] = None # Optional filter by study_id
):
    """
    Retrieve a list of all participants, optionally filtered by study ID.
    - Administrators can see all participants.
    - Researchers can see participants belonging to studies they are authorized for.
    """
    query = select(Participant)
    if study_id:
        # If filtering by study_id, first check access to that specific study
        study_query = await session.execute(select(Study).where(Study.id == study_id))
        study = study_query.scalars().first()
        if not study:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found for filtering")

        # TODO: Granular access check:
        # if current_user.role.name == "researcher" and study.creator_id != current_user.id:
        #    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view participants for this study")

        query = query.where(Participant.study_id == study_id)

    # Global authorization for listing all participants
    if current_user.role.name == "administrator":
        pass # Admin can view all
    elif current_user.role.name == "researcher":
        # TODO: Implement filtering based on studies researcher has access to
        pass # For now, researchers see all if no study_id filter.
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view participants")

    participants_query = await session.execute(query)
    participants = participants_query.scalars().all()
    return participants

@router.get("/{participant_id}", response_model=ParticipantRead, summary="Get a participant by ID")
async def read_participant(
    participant_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user
):
    """
    Retrieve a single participant by their ID.
    - Administrators can view any participant.
    - Researchers can view participants within studies they are authorized for.
    """
    participant_query = await session.execute(
        select(Participant).where(Participant.id == participant_id).options(selectinload(Participant.study))
    )
    db_participant = participant_query.scalars().first()

    if not db_participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    # TODO: Implement granular ownership check for the participant's parent study
    # if current_user.role.name == "researcher" and db_participant.study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this participant")

    return db_participant

@router.put("/{participant_id}", response_model=ParticipantRead, summary="Update an existing participant")
async def update_participant(
    participant_id: int,
    participant_update: ParticipantUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_researcher_or_admin_user
):
    """
    Update an existing participant by their ID.
    - Administrators can update any participant.
    - Researchers can update participants within studies they own.
    """
    participant_query = await session.execute(
        select(Participant).where(Participant.id == participant_id).options(selectinload(Participant.study))
    )
    db_participant = participant_query.scalars().first()

    if not db_participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    # TODO: Implement granular ownership check for the participant's parent study
    # if current_user.role.name == "researcher" and db_participant.study.creator_id != current_user.id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this participant")

    update_data = participant_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_participant, key, value)

    session.add(db_participant)
    await session.commit()
    await session.refresh(db_participant)
    return db_participant

@router.delete("/{participant_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a participant")
async def delete_participant(
    participant_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = get_admin_user # Only administrators can delete participants
):
    """
    Delete a participant by their ID. This action is restricted to 'administrator' roles.
    """
    participant_query = await session.execute(select(Participant).where(Participant.id == participant_id))
    db_participant = participant_query.scalars().first()

    if not db_participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    await session.delete(db_participant)
    await session.commit()
    return