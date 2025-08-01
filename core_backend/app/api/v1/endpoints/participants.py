# app/api/v1/endpoints/participants.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_async_session
from app.api.dependencies.auth import get_current_user, get_researcher_or_admin_user, get_admin_user
from app.models.participant import Participant, ParticipantCreate, ParticipantRead, ParticipantUpdate
from app.models.user import User # For current_user type hint, should be ORM User
from app.models.study import Study # If linking participants to studies and checking access

router = APIRouter()

@router.post("/", response_model=ParticipantRead, status_code=status.HTTP_201_CREATED, summary="Register a new participant (anonymous or linked to user)")
async def create_participant(
    participant_create: ParticipantCreate,
    session: AsyncSession = Depends(get_async_session),
    # Participants can be registered anonymously or by an authenticated user (e.g., researcher)
    # If a researcher is registering, they would provide a user_id for the participant (if the participant is a user)
    # or the participant could be entirely anonymous (user_id=None).
    current_user: Optional[User] = Depends(get_researcher_or_admin_user) # Optional: if researcher/admin creates participants
):
    """
    Register a new participant.
    - Only users with 'researcher' or 'administrator' roles can register participants.
    - An anonymous participant can be created by a logged-in researcher/admin.
    - A participant linked to an existing user can also be created.
    """
    # Check if the study exists
    study_query = await session.execute(select(Study).where(Study.id == participant_create.study_id))
    study_exists = study_query.scalars().first()
    if not study_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")

    # If a user ID is provided, ensure the user exists
    if participant_create.user_id:
        user_query = await session.execute(select(User).where(User.id == participant_create.user_id))
        user_exists = user_query.scalars().first()
        if not user_exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db_participant = Participant(**participant_create.model_dump())
    session.add(db_participant)
    await session.commit()
    await session.refresh(db_participant)
    
    # After creating and refreshing, load the relationships to be included in the response
    # The `select` statement now includes `selectinload` for both the `user` and `study` relationships
    result = await session.execute(
        select(Participant)
        .where(Participant.id == db_participant.id)
        .options(
            selectinload(Participant.user),
            selectinload(Participant.study),
        )
    )
    loaded_participant = result.scalars().first()

    return loaded_participant

@router.get("/", response_model=List[ParticipantRead], summary="Get all participants")
async def get_all_participants(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Retrieve a list of all participants.
    - This is restricted to 'researcher' or 'administrator' roles.
    """
    # Load participants and their associated user and study relationships
    result = await session.execute(
        select(Participant).options(selectinload(Participant.user), selectinload(Participant.study))
    )
    participants = result.scalars().all()
    return participants

@router.get("/{participant_id}", response_model=ParticipantRead, summary="Get a participant by ID")
async def get_participant(
    participant_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Retrieve a single participant by their ID.
    - This is restricted to 'researcher' or 'administrator' roles.
    """
    # Load participant with associated user and study relationships
    result = await session.execute(
        select(Participant)
        .where(Participant.id == participant_id)
        .options(selectinload(Participant.user), selectinload(Participant.study))
    )
    db_participant = result.scalars().first()
    if not db_participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
    return db_participant

@router.put("/{participant_id}", response_model=ParticipantRead, summary="Update a participant")
async def update_participant(
    participant_id: int,
    participant_update: ParticipantUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user) # Only administrators can update participants, for now.
):
    """
    Update an existing participant by its ID.
    - This action is restricted to 'administrator' roles.
    """
    # Fetch the participant to update, eagerly loading related data
    result = await session.execute(
        select(Participant)
        .where(Participant.id == participant_id)
        .options(selectinload(Participant.user), selectinload(Participant.study))
    )
    db_participant = result.scalars().first()

    if not db_participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    # TODO: Implement granular authorization based on user roles and study ownership
    # if current_user.role.name == "researcher" and not user_has_access_to_participant_study(current_user, db_participant):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this participant")

    update_data = participant_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_participant, key, value)

    session.add(db_participant)
    await session.commit()
    await session.refresh(db_participant, attribute_names=["user"]) # Refresh with relationships
    return db_participant

@router.delete("/{participant_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a participant")
async def delete_participant(
    participant_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user) # Only administrators can delete participants
):
    """
    Delete a participant by its ID. This action is restricted to 'administrator' roles.
    """
    participant_query = await session.execute(select(Participant).where(Participant.id == participant_id))
    db_participant = participant_query.scalars().first()

    if not db_participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
    
    await session.delete(db_participant)
    await session.commit()
    return

