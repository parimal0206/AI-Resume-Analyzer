from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resumes = relationship("Resume", back_populates="owner", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user")
    saved_jobs = relationship("SavedJob", back_populates="user")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    parsed_data = Column(String)  # JSON stored as text
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="resumes")
    analysis = relationship("Analysis", back_populates="resume", uselist=False)

class Analysis(Base):
    __tablename__ = "analysis"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), unique=True, nullable=False)
    ats_score = Column(Integer)
    report_data = Column(String)  # JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume", back_populates="analysis")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    description = Column(String, nullable=False)
    location = Column(String)
    salary_range = Column(String)
    required_skills = Column(String)  # JSON
    experience_level = Column(String)
    embedding = Column(String)  # Vector data (or path to blob)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    status = Column(String, default="saved") # saved, applied, interview, offer, rejected
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="applications")

class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)

    user = relationship("User", back_populates="saved_jobs")
