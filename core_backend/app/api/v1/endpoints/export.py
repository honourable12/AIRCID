# app/api/v1/endpoints/export.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_async_session
from app.models.study import Study # Example model to export
from app.models.user import User # For current_user type hint and authorization
from app.api.dependencies.auth import get_current_user, get_admin_user # Your dependencies for authenticated user
from starlette.responses import StreamingResponse
import pandas as pd
import io

router = APIRouter(prefix="/export", tags=["Data Export"])

@router.get("/studies/csv", summary="Export all studies data as CSV",
             description="Exports all research studies data in CSV format. Requires administrator access.")
async def export_studies_csv(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user) # Only administrators can export all studies
):
    """
    Exports all studies data to a CSV file.
    """
    # Fetch data from the database
    result = await session.execute(select(Study))
    studies = result.scalars().all()

    if not studies:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No studies found to export.")

    # Convert SQLAlchemy ORM objects to a list of dictionaries
    data_for_df = []
    for study in studies:
        data_for_df.append({
            "id": study.id,
            "title": study.title,
            "description": study.description,
            "creator_id": study.user_id, # Assuming 'user_id' is the creator_id in Study model
            "created_at": study.created_at,
            "updated_at": study.updated_at,
            # Add any other fields you want to include in the export
        })

    # Create a Pandas DataFrame
    df = pd.DataFrame(data_for_df)

    # Prepare CSV content in an in-memory text buffer
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0) # Rewind to the beginning of the buffer

    # Return as StreamingResponse
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=studies.csv"}
    )

@router.get("/studies/parquet", summary="Export all studies data as Parquet",
             description="Exports all research studies data in Parquet format. Requires administrator access.")
async def export_studies_parquet(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user) # Only administrators can export all studies
):
    """
    Exports all studies data to a Parquet file.
    """
    # Fetch data from the database
    result = await session.execute(select(Study))
    studies = result.scalars().all()

    if not studies:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No studies found to export.")

    # Convert SQLAlchemy ORM objects to a list of dictionaries
    data_for_df = []
    for study in studies:
        data_for_df.append({
            "id": study.id,
            "title": study.title,
            "description": study.description,
            "creator_id": study.user_id, # Assuming 'user_id' is the creator_id in Study model
            "created_at": study.created_at,
            "updated_at": study.updated_at,
            # Add any other fields you want to include in the export
        })
    df = pd.DataFrame(data_for_df)

    # Prepare Parquet content in an in-memory bytes buffer
    output = io.BytesIO()
    df.to_parquet(output, index=False)
    output.seek(0) # Rewind to the beginning of the buffer

    # Return as StreamingResponse
    return StreamingResponse(
        output,
        media_type="application/octet-stream", # Standard media type for binary data
        headers={"Content-Disposition": "attachment; filename=studies.parquet"}
    )

# You can add more export endpoints here (e.g., for forms, questions, responses)
# and add more granular authorization (e.g., researcher can export their own studies' data)