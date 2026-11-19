import json
import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.models import Job
from app.services.embeddings import embedding_service
from app.services.parser import FLAT_SKILLS


class JobRecommender:
    # Weights for hybrid scoring
    SEMANTIC_WEIGHT = 0.50
    SKILL_WEIGHT = 0.35
    EXPERIENCE_WEIGHT = 0.15

    EXPERIENCE_LEVELS = {
        "Junior": 0,
        "Entry": 0,
        "Mid": 1,
        "Senior": 2,
        "Staff": 3,
        "Principal": 3,
        "Lead": 3
    }

    def __init__(self, db: Session):
        self.db = db

    def _get_user_profile_embedding(self, resume_data: Dict[str, Any]) -> np.ndarray:
        """Create embedding from resume skills, experience, and summary."""
        skills = resume_data.get("skills", [])
        years = resume_data.get("years_of_experience", 0)
        sections = resume_data.get("sections", {})

        profile_text = " ".join([
            " ".join(skills),
            sections.get("summary", ""),
            sections.get("experience", "")[:500],
            f"{years} years experience"
        ])

        return embedding_service.encode(profile_text)

    def _calculate_skill_match(self, resume_skills: List[str], job_skills: List[str]) -> Dict[str, Any]:
        """Calculate skill overlap with Jaccard and weighted scoring."""
        if not resume_skills or not job_skills:
            return {"score": 0.0, "matched": [], "missing": job_skills, "jaccard": 0.0}

        resume_set = set(s.lower() for s in resume_skills)
        job_set = set(s.lower() for s in job_skills)

        matched = list(resume_set & job_set)
        missing = list(job_set - resume_set)

        # Jaccard similarity
        union = resume_set | job_set
        jaccard = len(matched) / len(union) if union else 0.0

        # Weighted score: prioritize rare/specialized skills
        # For now, use Jaccard as base
        score = jaccard

        return {
            "score": round(score, 3),
            "matched": [FLAT_SKILLS.get(m, m) for m in matched],
            "missing": [FLAT_SKILLS.get(m, m) for m in missing],
            "jaccard": round(jaccard, 3),
            "match_percentage": round(len(matched) / len(job_set) * 100, 1) if job_set else 0
        }

    def _calculate_experience_fit(self, resume_years: int, job_level: str) -> float:
        """Calculate experience level compatibility."""
        job_level_num = self.EXPERIENCE_LEVELS.get(job_level, 1)

        # Map years to level
        if resume_years < 1:
            resume_level = 0
        elif resume_years < 3:
            resume_level = 1
        elif resume_years < 6:
            resume_level = 2
        else:
            resume_level = 3

        diff = abs(resume_level - job_level_num)
        # Perfect match = 1.0, 1 level off = 0.7, 2 levels = 0.4, 3 levels = 0.1
        fit_scores = {0: 1.0, 1: 0.7, 2: 0.4, 3: 0.1}
        return fit_scores.get(diff, 0.0)

    def _get_job_embedding(self, job: Job) -> np.ndarray:
        """Load precomputed embedding from job record."""
        if job.embedding:
            try:
                return np.array(json.loads(job.embedding), dtype=np.float32)
            except Exception:
                pass
        # Fallback: compute on the fly
        text = f"{job.title} {' '.join(json.loads(job.required_skills) if job.required_skills else [])} {job.description[:500]}"
        return embedding_service.encode(text)

    def recommend(
        self,
        resume_data: Dict[str, Any],
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        sort_by: str = "match"
    ) -> List[Dict[str, Any]]:
        """
        Get job recommendations for a resume.

        Args:
            resume_data: Parsed resume data
            limit: Number of results to return
            filters: Dict with keys: location, job_type, remote_type, experience_level, salary_min, keyword
            sort_by: 'match', 'newest', 'salary'
        """
        # Build query with filters
        query = self.db.query(Job)

        if filters:
            if filters.get("location"):
                query = query.filter(Job.location.ilike(f"%{filters['location']}%"))
            if filters.get("job_type"):
                query = query.filter(Job.job_type == filters["job_type"])
            if filters.get("remote_type"):
                query = query.filter(Job.remote_type == filters["remote_type"])
            if filters.get("experience_level"):
                query = query.filter(Job.experience_level == filters["experience_level"])
            if filters.get("keyword"):
                kw = f"%{filters['keyword']}%"
                query = query.filter(or_(Job.title.ilike(kw), Job.description.ilike(kw), Job.company.ilike(kw)))

        # Get candidate jobs (limit to reasonable number for scoring)
        candidate_jobs = query.limit(200).all()

        if not candidate_jobs:
            return []

        # Compute user profile embedding
        user_emb = self._get_user_profile_embedding(resume_data)
        resume_skills = resume_data.get("skills", [])
        resume_years = resume_data.get("years_of_experience", 0)

        # Score all candidates
        results = []
        job_embeddings = np.array([self._get_job_embedding(job) for job in candidate_jobs])

        # Batch semantic similarity
        semantic_scores = embedding_service.batch_similarity(user_emb, job_embeddings)

        for idx, job in enumerate(candidate_jobs):
            job_skills = json.loads(job.required_skills) if job.required_skills else []

            # Skill match
            skill_result = self._calculate_skill_match(resume_skills, job_skills)

            # Experience fit
            exp_fit = self._calculate_experience_fit(resume_years, job.experience_level)

            # Hybrid score
            hybrid_score = (
                self.SEMANTIC_WEIGHT * semantic_scores[idx] +
                self.SKILL_WEIGHT * skill_result["score"] +
                self.EXPERIENCE_WEIGHT * exp_fit
            )

            match_pct = round(hybrid_score * 100, 1)

            results.append({
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "salary_range": job.salary_range,
                "experience_level": job.experience_level,
                "job_type": job.job_type,
                "remote_type": job.remote_type,
                "match_percentage": match_pct,
                "semantic_score": round(float(semantic_scores[idx]) * 100, 1),
                "skill_match": skill_result,
                "experience_fit": round(exp_fit * 100, 1),
                "why_recommended": self._generate_reason(job, skill_result, semantic_scores[idx], exp_fit)
            })

        # Sort
        if sort_by == "match":
            results.sort(key=lambda x: x["match_percentage"], reverse=True)
        elif sort_by == "newest":
            results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        elif sort_by == "salary":
            # Parse salary for sorting (simplified)
            def parse_salary(s):
                try:
                    return int(''.join(filter(str.isdigit, s.split("-")[-1])))
                except:
                    return 0
            results.sort(key=lambda x: parse_salary(x["salary_range"]), reverse=True)

        return results[:limit]

    def _generate_reason(
        self,
        job: Job,
        skill_result: Dict,
        semantic_score: float,
        exp_fit: float
    ) -> str:
        """Generate human-readable recommendation reason."""
        reasons = []

        if skill_result["match_percentage"] >= 70:
            reasons.append(f"Strong skill alignment ({skill_result['match_percentage']}% match)")
        elif skill_result["match_percentage"] >= 40:
            reasons.append(f"Good skill overlap ({skill_result['match_percentage']}% match)")

        if semantic_score >= 0.7:
            reasons.append("Highly relevant experience and background")
        elif semantic_score >= 0.5:
            reasons.append("Relevant professional background")

        if exp_fit >= 0.7:
            reasons.append("Experience level matches well")
        elif exp_fit >= 0.4:
            reasons.append("Experience level is compatible")

        if not reasons:
            reasons.append("Potential match based on overall profile")

        return ". ".join(reasons) + "."

    def get_job_detail(self, job_id: int) -> Optional[Dict[str, Any]]:
        """Get full job details by ID."""
        job = self.db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return None

        return {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "description": job.description,
            "location": job.location,
            "salary_range": job.salary_range,
            "required_skills": json.loads(job.required_skills) if job.required_skills else [],
            "experience_level": job.experience_level,
            "job_type": job.job_type,
            "remote_type": job.remote_type,
            "created_at": job.created_at.isoformat() if job.created_at else None
        }


def get_recommender(db: Session) -> JobRecommender:
    return JobRecommender(db)