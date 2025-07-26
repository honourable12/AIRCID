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
# from app.models.study import Study # If linking participants to studies and checking access

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
    - Can be anonymous (no user_id provided).
    - Can be linked to an existing user if `user_id` is provided and a researcher/admin is creating it.
    - Researchers can create participants for studies they own. Administrators can create any.
    """
    if participant_create.user_id:
        # If user_id is provided, verify it's a valid user
        user_query = await session.execute(select(User).where(User.id == participant_create.user_id))
        user = user_query.scalars().first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User specified for participant not found")
        
        # If current_user is a researcher, ensure they have rights to link this user as participant
        # (e.g., within a study they manage)
        # TODO: Implement granular authorization if linking participants to specific studies/users by researchers.
        if current_user and current_user.role.name == "researcher":
            # Example: Check if current_user can create participants linked to this user_id/study
            pass # Placeholder for actual authorization logic

    db_participant = Participant(**participant_create.model_dump())
    session.add(db_participant)
    await session.commit()
    # Eager load relationships if ParticipantRead includes them (e.g., 'user')
    await session.refresh(db_participant, attribute_names=["user"])
    return db_participant


@router.get("/", response_model=List[ParticipantRead], summary="Get all participants (Admin) or those researcher has access to")
async def read_participants(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user), # Only researchers/admins can list participants
    user_id: Optional[int] = None # Optional filter by user_id
):
    """
    Retrieve a list of participants, optionally filtered by user ID.
    - Administrators can see all participants.
    - Researchers can see participants linked to studies they are authorized for.
    """
    query = select(Participant)
    if user_id:
        query = query.where(Participant.user_id == user_id)

    # Eager load relationships if ParticipantRead includes them
    query = query.options(selectinload(Participant.user))

    # TODO: Implement granular authorization based on user roles and study ownership
    if current_user.role.name == "researcher":
        # Example: Filter participants to only those from studies created by the researcher
        # This would require linking participants to studies and then filtering
        pass # Placeholder for actual filtering logic
    elif current_user.role.name != "administrator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view participants")

    participants_query = await session.execute(query)
    participants = participants_query.scalars().all()
    return participants

@router.get("/{participant_id}", response_model=ParticipantRead, summary="Get a participant by ID")
async def read_participant(
    participant_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Retrieve a single participant by its ID.
    - Administrators can view any participant.
    - Researchers can view participants linked to studies they are authorized for.
    """
    participant_query = await session.execute(
        select(Participant)
        .where(Participant.id == participant_id)
        .options(selectinload(Participant.user)) # Eager load the related user
    )
    db_participant = participant_query.scalars().first()

    if not db_participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    # TODO: Implement granular authorization based on user roles and study ownership
    # if current_user.role.name == "researcher" and not user_has_access_to_participant_study(current_user, db_participant):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this participant")

    return db_participant

@router.put("/{participant_id}", response_model=ParticipantRead, summary="Update an existing participant")
async def update_participant(
    participant_id: int,
    participant_update: ParticipantUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    """
    Update an existing participant by its ID.
    - Administrators can update any participant.
    - Researchers can update participants within studies they are authorized for.
    """
    participant_query = await session.execute(
        select(Participant)
        .where(Participant.id == participant_id)
        .options(selectinload(Participant.user))
    )
    db_participant = participant_query.scalars().first()

    if not db_participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
    
    # If updating user_id, perform checks similar to create_participant
    if participant_update.user_id is not None and participant_update.user_id != db_participant.user_id:
        user_query = await session.execute(select(User).where(User.id == participant_update.user_id))
        new_user = user_query.scalars().first()
        if not new_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="New user specified for participant not found")
        # TODO: Add authorization check for current_user to link to new_user

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