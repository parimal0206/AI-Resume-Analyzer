import pytest
import os
from fastapi.testclient import TestClient
from app.main import app
from app.services.parser import ResumeParser
from app.services.analyzer import ResumeAnalyzer

client = TestClient(app)

SAMPLE_TEXT = """
Jane Doe
jane.doe@example.com | +1-555-0199
github.com/janedoe | linkedin.com/in/janedoe

SUMMARY
Experienced software developer with a strong background in Python and React.

EXPERIENCE
Software Engineer at Tech Corp (2020 - Present)
- Developed REST APIs in Python and FastAPI, increasing throughput by 40%.
- Managed database migrations and optimized queries.

EDUCATION
B.S. Computer Science, Stanford University, 2020
"""


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_parser_extraction():
    # Test text parsing helpers directly
    email = ResumeParser.extract_email(SAMPLE_TEXT)
    assert email == "jane.doe@example.com"

    phone = ResumeParser.extract_phone(SAMPLE_TEXT)
    assert phone == "+1-555-0199"

    name = ResumeParser.extract_name(SAMPLE_TEXT)
    assert name == "Jane Doe"

    skills = ResumeParser.extract_skills(SAMPLE_TEXT)
    assert "Python" in skills
    assert "React" in skills
    assert "FastAPI" in skills


def test_analyzer_scoring():
    parsed_data = {
        "raw_text": SAMPLE_TEXT,
        "skills": ["Python", "React", "FastAPI"],
        "years_of_experience": 3,
        "sections": {
            "summary": "Experienced software developer...",
            "experience": "Developed REST APIs in Python and FastAPI, increasing throughput by 40%.",
            "education": "B.S. Computer Science, Stanford University",
            "skills": "Python, React, FastAPI"
        },
        "word_count": 150
    }

    analysis = ResumeAnalyzer.analyze(parsed_data)
    assert "overall_ats_score" in analysis
    assert 0 <= analysis["overall_ats_score"] <= 100
    assert "section_scores" in analysis
    assert "strengths" in analysis
    assert "weaknesses" in analysis


def test_auth_registration_and_login():
    # Register test user
    payload = {
        "email": "testuser@example.com",
        "password": "securepassword123",
        "full_name": "Test User"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code in [201, 400] # 400 if already registered from previous run

    # Login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser@example.com", "password": "securepassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
