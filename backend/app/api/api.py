from fastapi import APIRouter
from app.api import auth, resumes, jobs, applications, admin

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(resumes.router)
api_router.include_router(jobs.router)
api_router.include_router(applications.router)
api_router.include_router(admin.router)
