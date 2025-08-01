# app/api/v1/endpoints/export.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_async_session
from app.models.study import Study # Example model to export
from app.models.user import User # For current_user type hint and authorization
from app.api.dependencies.auth import get_current_user, get_researcher_or_admin_user # Your dependencies for authenticated user
from starlette.responses import StreamingResponse
import pandas as pd
import io

router = APIRouter(prefix="/export", tags=["Data Export"])

@router.get("/studies/csv", summary="Export all studies data as CSV",
             description="Exports all research studies data in CSV format. Requires administrator access.")
async def export_studies_csv(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user) # Only administrators can export all studies
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
    current_user: User = Depends(get_researcher_or_admin_user) # Only administrators can export all studies
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

# Export forms for a specific study (researcher or admin)
@router.get("/studies/{study_id}/forms/csv", summary="Export forms for a study as CSV")
async def export_forms_csv(
    study_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    # Check study ownership if not admin
    study = await session.get(Study, study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    if not current_user.is_admin and study.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to export this study's forms")

    # Fetch forms
    from app.models.form import Form
    result = await session.execute(select(Form).where(Form.study_id == study_id))
    forms = result.scalars().all()
    if not forms:
        raise HTTPException(status_code=404, detail="No forms found for this study")

    data_for_df = [form.__dict__ for form in forms]
    df = pd.DataFrame(data_for_df)
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=study_{study_id}_forms.csv"}
    )

# Export questions for a specific form (researcher or admin)
@router.get("/forms/{form_id}/questions/csv", summary="Export questions for a form as CSV")
async def export_questions_csv(
    form_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    from app.models.form import Form
    from app.models.question import Question
    form = await session.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    # Check study ownership if not admin
    study = await session.get(Study, form.study_id)
    if not current_user.is_admin and study.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to export this form's questions")

    result = await session.execute(select(Question).where(Question.form_id == form_id))
    questions = result.scalars().all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this form")

    data_for_df = [q.__dict__ for q in questions]
    df = pd.DataFrame(data_for_df)
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=form_{form_id}_questions.csv"}
    )

# Export responses for a specific study (researcher or admin)
@router.get("/studies/{study_id}/responses/csv", summary="Export responses for a study as CSV")
async def export_responses_csv(
    study_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_researcher_or_admin_user)
):
    from app.models.response import Response as StudyResponse
    study = await session.get(Study, study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    if not current_user.is_admin and study.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to export this study's responses")

    result = await session.execute(select(StudyResponse).where(StudyResponse.study_id == study_id))
    responses = result.scalars().all()
    if not responses:
        raise HTTPException(status_code=404, detail="No responses found for this study")

    data_for_df = [r.__dict__ for r in responses]
    df = pd.DataFrame(data_for_df)
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=study_{study_id}_responses.csv"}
    )

#TODO You can add more export endpoints here (e.g., for forms, questions, responses)
#TODO and add more granular authorization (e.g., researcher can export their own studies' data)