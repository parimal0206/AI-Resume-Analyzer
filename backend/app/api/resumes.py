import os
import uuid
import json
from typing import List, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user
from app.models.models import User, Resume, Analysis
from app.services.parser import ResumeParser
from app.services.analyzer import ResumeAnalyzer

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    # 1. Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".docx", ".doc", ".txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, DOCX, or TXT."
        )

    # 2. Read contents and validate size
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size limit of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # 3. Save to disk safely
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    # 4. Parse resume contents
    try:
        parsed_data = ResumeParser.parse(file_path)
    except Exception as e:
        parsed_data = {"raw_text": "", "skills": [], "sections": {}}

    # 5. Create Resume DB Record
    resume = Resume(
        user_id=current_user.id,
        title=file.filename,
        file_path=file_path,
        parsed_data=json.dumps(parsed_data)
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    # 6. Auto-generate initial analysis
    try:
        analysis_result = ResumeAnalyzer.analyze(parsed_data)
        analysis = Analysis(
            resume_id=resume.id,
            ats_score=analysis_result["overall_ats_score"],
            report_data=json.dumps(analysis_result)
        )
        db.add(analysis)
        await db.commit()
    except Exception:
        pass

    return {
        "id": resume.id,
        "title": resume.title,
        "created_at": resume.created_at,
        "parsed_data": parsed_data
    }


@router.get("")
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    output = []
    for r in resumes:
        # Check if analysis exists
        analysis_res = await db.execute(select(Analysis).where(Analysis.resume_id == r.id))
        analysis = analysis_res.scalars().first()
        output.append({
            "id": r.id,
            "title": r.title,
            "created_at": r.created_at,
            "ats_score": analysis.ats_score if analysis else None
        })
    return output


@router.get("/{resume_id}")
async def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return {
        "id": resume.id,
        "title": resume.title,
        "created_at": resume.created_at,
        "parsed_data": json.loads(resume.parsed_data) if resume.parsed_data else {}
    }


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Remove file from disk
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except OSError:
            pass

    # Delete related analysis
    analysis_res = await db.execute(select(Analysis).where(Analysis.resume_id == resume.id))
    analysis = analysis_res.scalars().first()
    if analysis:
        await db.delete(analysis)

    await db.delete(resume)
    await db.commit()
    return {"message": "Resume deleted successfully"}


@router.post("/{resume_id}/analyze")
async def trigger_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    parsed_data = json.loads(resume.parsed_data) if resume.parsed_data else {}
    analysis_result = ResumeAnalyzer.analyze(parsed_data)

    # Check if analysis record exists, update or create
    analysis_res = await db.execute(select(Analysis).where(Analysis.resume_id == resume.id))
    analysis = analysis_res.scalars().first()

    if analysis:
        analysis.ats_score = analysis_result["overall_ats_score"]
        analysis.report_data = json.dumps(analysis_result)
    else:
        analysis = Analysis(
            resume_id=resume.id,
            ats_score=analysis_result["overall_ats_score"],
            report_data=json.dumps(analysis_result)
        )
        db.add(analysis)

    await db.commit()
    return analysis_result


@router.get("/{resume_id}/analysis")
async def get_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    analysis_res = await db.execute(select(Analysis).where(Analysis.resume_id == resume.id))
    analysis = analysis_res.scalars().first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found. Run analysis first.")

    return json.loads(analysis.report_data)
