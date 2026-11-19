import json
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Resume, Job, Application

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


async def verify_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required."
        )
    return current_user


@router.get("/stats")
async def get_admin_stats(
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    users_count = await db.scalar(select(func.count(User.id)))
    resumes_count = await db.scalar(select(func.count(Resume.id)))
    jobs_count = await db.scalar(select(func.count(Job.id)))
    applications_count = await db.scalar(select(func.count(Application.id)))

    return {
        "users_count": users_count or 0,
        "resumes_count": resumes_count or 0,
        "jobs_count": jobs_count or 0,
        "applications_count": applications_count or 0
    }


@router.get("/jobs")
async def admin_list_jobs(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(Job).offset(skip).limit(limit))
    jobs = result.scalars().all()
    return [{
        "id": j.id,
        "title": j.title,
        "company": j.company,
        "location": j.location,
        "salary_range": j.salary_range,
        "experience_level": j.experience_level
    } for j in jobs]


@router.post("/jobs", status_code=status.HTTP_201_CREATED)
async def admin_create_job(
    job_in: dict,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    from app.services.embeddings import embedding_service
    skills = job_in.get("required_skills", [])
    embed_text = f"{job_in.get('title', '')} {' '.join(skills)} {job_in.get('description', '')[:500]}"
    embedding = embedding_service.encode(embed_text)

    job = Job(
        title=job_in.get("title"),
        company=job_in.get("company"),
        description=job_in.get("description"),
        location=job_in.get("location"),
        salary_range=job_in.get("salary_range"),
        experience_level=job_in.get("experience_level", "Mid"),
        required_skills=json.dumps(skills),
        embedding=json.dumps(embedding.tolist())
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return {"id": job.id, "message": "Job created successfully"}


@router.delete("/jobs/{job_id}")
async def admin_delete_job(
    job_id: int,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.delete(job)
    await db.commit()
    return {"message": "Job deleted successfully"}
