import json
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Job, Application, SavedJob

router = APIRouter(tags=["Applications & Tracking"])


@router.post("/jobs/{job_id}/save")
async def save_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Check if job exists
    job_res = await db.execute(select(Job).where(Job.id == job_id))
    if not job_res.scalars().first():
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if already saved
    existing = await db.execute(
        select(SavedJob).where(SavedJob.job_id == job_id, SavedJob.user_id == current_user.id)
    )
    if existing.scalars().first():
        return {"message": "Job already saved"}

    saved = SavedJob(user_id=current_user.id, job_id=job_id)
    db.add(saved)
    await db.commit()
    return {"message": "Job saved successfully"}


@router.delete("/jobs/{job_id}/unsave")
async def unsave_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    await db.execute(
        delete(SavedJob).where(SavedJob.job_id == job_id, SavedJob.user_id == current_user.id)
    )
    await db.commit()
    return {"message": "Job removed from saved"}


@router.get("/saved-jobs")
async def list_saved_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(
        select(Job).join(SavedJob).where(SavedJob.user_id == current_user.id)
    )
    jobs = result.scalars().all()
    return [{
        "id": j.id,
        "title": j.title,
        "company": j.company,
        "location": j.location,
        "salary_range": j.salary_range
    } for j in jobs]


@router.post("/applications")
async def create_application(
    job_id: int,
    status: str = "applied",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Check if job exists
    job_res = await db.execute(select(Job).where(Job.id == job_id))
    if not job_res.scalars().first():
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if already exists
    existing = await db.execute(
        select(Application).where(Application.job_id == job_id, Application.user_id == current_user.id)
    )
    app = existing.scalars().first()
    if app:
        app.status = status
    else:
        app = Application(user_id=current_user.id, job_id=job_id, status=status)
        db.add(app)

    await db.commit()
    await db.refresh(app)
    return app


@router.get("/applications")
async def list_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(
        select(Application, Job).join(Job).where(Application.user_id == current_user.id)
    )
    rows = result.all()
    output = []
    for app, job in rows:
        output.append({
            "id": app.id,
            "job_id": job.id,
            "title": job.title,
            "company": job.company,
            "status": app.status,
            "updated_at": app.updated_at
        })
    return output


@router.patch("/applications/{application_id}")
async def update_application_status(
    application_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(
        select(Application).where(Application.id == application_id, Application.user_id == current_user.id)
    )
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = status
    await db.commit()
    await db.refresh(app)
    return app
