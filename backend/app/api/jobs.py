import json
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db, SyncSessionLocal
from app.api.auth import get_current_user
from app.models.models import User, Resume, Job, Application, SavedJob
from app.services.recommender import JobRecommender
from app.services.embeddings import embedding_service

router = APIRouter(tags=["Jobs & Recommendations"])


@router.get("/jobs")
async def list_jobs(
    skip: int = 0,
    limit: int = 50,
    location: Optional[str] = None,
    experience_level: Optional[str] = None,
    keyword: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
) -> Any:
    # Build query
    query = select(Job)
    if location:
        query = query.where(Job.location.ilike(f"%{location}%"))
    if experience_level:
        query = query.where(Job.experience_level == experience_level)
    if keyword:
        kw = f"%{keyword}%"
        from sqlalchemy import or_
        query = query.where(or_(Job.title.ilike(kw), Job.company.ilike(kw), Job.description.ilike(kw)))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    jobs = result.scalars().all()

    output = []
    for j in jobs:
        output.append({
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "salary_range": j.salary_range,
            "experience_level": j.experience_level,
            "required_skills": json.loads(j.required_skills) if j.required_skills else []
        })
    return output


@router.get("/jobs/{job_id}")
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "description": job.description,
        "location": job.location,
        "salary_range": job.salary_range,
        "experience_level": job.experience_level,
        "required_skills": json.loads(job.required_skills) if job.required_skills else [],
        "created_at": job.created_at
    }


@router.get("/resumes/{resume_id}/recommendations")
async def get_recommendations(
    resume_id: int,
    limit: int = 15,
    location: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # 1. Fetch resume
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    parsed_data = json.loads(resume.parsed_data) if resume.parsed_data else {}

    # 2. Use sync recommender (recommender needs sync session for embedding processing for now)
    sync_db = SyncSessionLocal()
    try:
        recommender = JobRecommender(sync_db)
        filters = {"location": location} if location else None
        recommendations = recommender.recommend(parsed_data, limit=limit, filters=filters)
        return recommendations
    finally:
        sync_db.close()


@router.post("/match")
async def match_resume_to_jd(
    resume_id: int,
    jd_text: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Analyze how well a specific resume matches a pasted job description."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    parsed_data = json.loads(resume.parsed_data) if resume.parsed_data else {}
    resume_skills = set(s.lower() for s in parsed_data.get("skills", []))

    # Basic NLP on JD to extract skills (using same taxonomy)
    from app.services.parser import ResumeParser
    jd_skills = set(s.lower() for s in ResumeParser.extract_skills(jd_text))

    matched = resume_skills & jd_skills
    missing = jd_skills - resume_skills

    # Semantic similarity
    resume_emb = embedding_service.encode(parsed_data.get("raw_text", "")[:1000])
    jd_emb = embedding_service.encode(jd_text[:1000])
    similarity = embedding_service.similarity(resume_emb, jd_emb)

    match_score = (0.6 * similarity + 0.4 * (len(matched) / len(jd_skills) if jd_skills else 0.5)) * 100

    return {
        "match_score": round(match_score, 1),
        "semantic_similarity": round(similarity * 100, 1),
        "matched_skills": sorted(list(matched)),
        "missing_skills": sorted(list(missing)),
        "recommendation": "Great match!" if match_score > 80 else "Good match" if match_score > 60 else "Skill gap detected"
    }


@router.get("/skills/gap/{resume_id}")
async def get_skill_gap_report(
    resume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Aggregates missing skills across the top recommendations for a resume."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    parsed_data = json.loads(resume.parsed_data) if resume.parsed_data else {}

    sync_db = SyncSessionLocal()
    try:
        recommender = JobRecommender(sync_db)
        recs = recommender.recommend(parsed_data, limit=10)

        # Aggregate missing skills
        gap_counts = {}
        for r in recs:
            for skill in r["skill_match"]["missing"]:
                gap_counts[skill] = gap_counts.get(skill, 0) + 1

        # Sort by frequency
        sorted_gaps = sorted(gap_counts.items(), key=lambda x: x[1], reverse=True)

        report = []
        for skill, count in sorted_gaps[:12]:
            report.append({
                "skill": skill,
                "demand_frequency": count,
                "importance": "High" if count >= 5 else "Medium",
                "suggested_resources": [
                    {"name": f"Mastering {skill} on Coursera", "type": "Paid", "link": "https://coursera.org"},
                    {"name": f"{skill} Documentation", "type": "Free", "link": "#"}
                ]
            })

        return report
    finally:
        sync_db.close()
