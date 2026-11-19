#!/usr/bin/env python3
"""
Database seeding script - creates 200+ realistic job records with precomputed embeddings.
Run this after migrations: python -m scripts.seed_db
"""
import sys
import os
import json
import random
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.database import sync_engine, SyncSessionLocal
from app.models.models import Base, Job
from app.services.embeddings import EmbeddingService

# Extended job data - 200 jobs across multiple categories
JOB_TEMPLATES = [
    # Software Engineering - Senior
    {
        "title_templates": [
            "Senior Software Engineer", "Staff Software Engineer", "Principal Software Engineer",
            "Lead Software Engineer", "Software Architect", "Engineering Manager"
        ],
        "companies": ["TechCorp Inc", "InnovateLabs", "ScaleSystems", "DataDriven Co", "CloudNative Inc"],
        "skills_pool": ["Python", "Java", "Go", "C++", "System Design", "Microservices", "Kubernetes", "AWS", "Distributed Systems"],
        "locations": ["San Francisco, CA", "Seattle, WA", "New York, NY", "Austin, TX", "Remote"],
        "salary_ranges": ["$150,000 - $250,000", "$180,000 - $300,000", "$200,000 - $350,000"],
        "experience_levels": ["Senior", "Staff", "Principal"],
        "job_types": ["Full-time"],
        "remote_types": ["Hybrid", "Remote", "Onsite"],
        "base_description": "We are looking for an experienced engineer to lead complex technical initiatives. You will architect scalable systems, mentor team members, and drive technical excellence. Strong background in {skills} required."
    },
    # Software Engineering - Mid
    {
        "title_templates": ["Software Engineer", "Backend Engineer", "Full Stack Engineer", "Application Developer"],
        "companies": ["StartupXYZ", "GrowthTech", "ProductFlow", "DevVelocity", "CodeCraft Inc"],
        "skills_pool": ["React", "Node.js", "Python", "PostgreSQL", "Docker", "AWS", "TypeScript", "REST API", "Git"],
        "locations": ["Remote", "San Francisco, CA", "New York, NY", "Chicago, IL", "Denver, CO"],
        "salary_ranges": ["$100,000 - $150,000", "$110,000 - $160,000", "$120,000 - $170,000"],
        "experience_levels": ["Mid"],
        "job_types": ["Full-time"],
        "remote_types": ["Remote", "Hybrid", "Onsite"],
        "base_description": "Join our engineering team building {product}. You will develop features end-to-end using {skills}. We value clean code, testing, and collaborative problem solving."
    },
    # Frontend
    {
        "title_templates": ["Frontend Engineer", "Frontend Developer", "UI Engineer", "React Developer"],
        "companies": ["PixelPerfect Labs", "DesignSystems Co", "WebCraft Studios", "Interface Inc", "UXEngineers"],
        "skills_pool": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Vue", "Svelte", "CSS", "HTML", "Jest", "Cypress"],
        "locations": ["Remote", "New York, NY", "Los Angeles, CA", "Seattle, WA", "Austin, TX"],
        "salary_ranges": ["$100,000 - $150,000", "$110,000 - $160,000", "$120,000 - $170,000"],
        "experience_levels": ["Junior", "Mid", "Senior"],
        "job_types": ["Full-time"],
        "remote_types": ["Remote", "Hybrid"],
        "base_description": "Build beautiful, performant user interfaces using {skills}. Collaborate with designers and backend engineers to deliver exceptional user experiences. Strong focus on accessibility and performance."
    },
    # Data Science / ML
    {
        "title_templates": ["Data Scientist", "Machine Learning Engineer", "ML Engineer", "Applied Scientist", "Research Scientist"],
        "companies": ["DataFlow AI", "Insight Analytics", "PredictiveModels Inc", "AILabs", "DeepLearning Co"],
        "skills_pool": ["Python", "TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "SQL", "MLOps", "NLP", "Computer Vision", "Statistics"],
        "locations": ["San Francisco, CA", "Seattle, WA", "Boston, MA", "New York, NY", "Remote"],
        "salary_ranges": ["$120,000 - $180,000", "$140,000 - $200,000", "$150,000 - $220,000"],
        "experience_levels": ["Mid", "Senior"],
        "job_types": ["Full-time"],
        "remote_types": ["Hybrid", "Remote", "Onsite"],
        "base_description": "Develop and deploy machine learning models to solve real-world problems. Work with large-scale data using {skills}. Experience with model deployment, monitoring, and MLOps practices required."
    },
    # DevOps / Platform
    {
        "title_templates": ["DevOps Engineer", "Platform Engineer", "Site Reliability Engineer", "Cloud Engineer", "Infrastructure Engineer"],
        "companies": ["CloudScale Systems", "InfraOps Co", "ReliabilityFirst", "PlatformBuilders", "CloudNative Inc"],
        "skills_pool": ["AWS", "Terraform", "Kubernetes", "Docker", "Prometheus", "Grafana", "CI/CD", "Linux", "Python", "Helm", "ArgoCD"],
        "locations": ["Austin, TX", "Remote", "San Francisco, CA", "Seattle, WA", "Denver, CO"],
        "salary_ranges": ["$120,000 - $180,000", "$130,000 - $190,000", "$140,000 - $200,000"],
        "experience_levels": ["Mid", "Senior"],
        "job_types": ["Full-time"],
        "remote_types": ["Remote", "Hybrid", "Onsite"],
        "base_description": "Build and maintain scalable, reliable infrastructure. Automate deployment pipelines and implement observability using {skills}. On-call rotation and incident response experience required."
    },
    # Mobile
    {
        "title_templates": ["Mobile Engineer", "iOS Engineer", "Android Engineer", "React Native Developer", "Flutter Developer"],
        "companies": ["AppVentures", "MobileFirst Labs", "AppStudio", "CrossPlatform Co", "NativeApps Inc"],
        "skills_pool": ["Swift", "SwiftUI", "Kotlin", "Jetpack Compose", "React Native", "Flutter", "Dart", "iOS", "Android", "CI/CD"],
        "locations": ["Remote", "San Francisco, CA", "Los Angeles, CA", "New York, NY", "Austin, TX"],
        "salary_ranges": ["$110,000 - $160,000", "$120,000 - $170,000", "$130,000 - $180,000"],
        "experience_levels": ["Mid", "Senior"],
        "job_types": ["Full-time"],
        "remote_types": ["Remote", "Hybrid", "Onsite"],
        "base_description": "Develop high-quality mobile applications using {skills}. Work on app architecture, performance optimization, and App Store/Play Store deployment. Experience with native and cross-platform frameworks valued."
    },
    # Security
    {
        "title_templates": ["Security Engineer", "Application Security Engineer", "Cloud Security Engineer", "Penetration Tester"],
        "companies": ["SecureNet", "CyberShield", "InfoSec Labs", "ThreatGuard", "VulnResearch"],
        "skills_pool": ["Penetration Testing", "Vulnerability Assessment", "Security Auditing", "AWS Security", "Kubernetes Security", "Python", "Go", "Incident Response", "Compliance"],
        "locations": ["Washington, DC", "Remote", "San Francisco, CA", "New York, NY", "Boston, MA"],
        "salary_ranges": ["$130,000 - $200,000", "$140,000 - $220,000", "$150,000 - $250,000"],
        "experience_levels": ["Mid", "Senior"],
        "job_types": ["Full-time"],
        "remote_types": ["Hybrid", "Remote", "Onsite"],
        "base_description": "Secure our systems and applications against threats. Conduct security assessments, implement controls, and respond to incidents using {skills}. Relevant certifications (CISSP, OSCP, etc.) are a plus."
    },
    # Product & Design
    {
        "title_templates": ["Product Designer", "UX Designer", "UI Designer", "Product Manager", "Senior Product Manager"],
        "companies": ["DesignFirst Studio", "ProductLed Co", "UserCentric Inc", "ExperienceLab", "DesignOps"],
        "skills_pool": ["Figma", "UI Design", "UX Design", "Wireframing", "Prototyping", "User Research", "Design Systems", "Product Strategy", "Roadmapping", "Analytics"],
        "locations": ["Remote", "San Francisco, CA", "New York, NY", "Los Angeles, CA", "Seattle, WA"],
        "salary_ranges": ["$100,000 - $150,000", "$120,000 - $180,000", "$140,000 - $200,000"],
        "experience_levels": ["Mid", "Senior"],
        "job_types": ["Full-time"],
        "remote_types": ["Remote", "Hybrid", "Onsite"],
        "base_description": "Shape product experience through user-centered design. Lead design process from research to delivery using {skills}. Collaborate with cross-functional teams to define product strategy."
    },
    # Finance
    {
        "title_templates": ["Financial Analyst", "Quantitative Analyst", "Investment Analyst", "Risk Analyst", "FP&A Analyst"],
        "companies": ["FinTech Solutions", "CapitalMarkets Inc", "WealthManagement Co", "RiskMetrics", "QuantFund"],
        "skills_pool": ["Python", "SQL", "Excel", "Financial Modeling", "Valuation", "Risk Management", "Portfolio Management", "Bloomberg", "Tableau"],
        "locations": ["New York, NY", "Chicago, IL", "Boston, MA", "San Francisco, CA", "Remote"],
        "salary_ranges": ["$90,000 - $140,000", "$110,000 - $160,000", "$120,000 - $180,000"],
        "experience_levels": ["Junior", "Mid", "Senior"],
        "job_types": ["Full-time"],
        "remote_types": ["Hybrid", "Onsite", "Remote"],
        "base_description": "Analyze financial data and build models to support investment decisions. Expertise in {skills} required. Experience with large datasets and regulatory reporting preferred."
    },
    # Marketing
    {
        "title_templates": ["Marketing Manager", "Growth Marketer", "Performance Marketing Manager", "Content Marketing Manager", "SEO Specialist"],
        "companies": ["GrowthMarketing Co", "BrandBuilders", "DigitalStrategy Inc", "AcquisitionLab", "ConversionCo"],
        "skills_pool": ["SEO", "SEM", "Google Analytics", "Google Ads", "Content Marketing", "Social Media", "Email Marketing", "HubSpot", "Salesforce", "A/B Testing"],
        "locations": ["Remote", "New York, NY", "San Francisco, CA", "Los Angeles, CA", "Austin, TX"],
        "salary_ranges": ["$80,000 - $130,000", "$90,000 - $140,000", "$100,000 - $150,000"],
        "experience_levels": ["Junior", "Mid", "Senior"],
        "job_types": ["Full-time"],
        "remote_types": ["Remote", "Hybrid", "Onsite"],
        "base_description": "Drive customer acquisition and growth through data-driven marketing. Manage campaigns and optimize funnel using {skills}. Experience with B2B/B2C marketing and analytics platforms required."
    }
]

PRODUCT_NAMES = [
    "a next-gen analytics platform", "an AI-powered developer tool", "a real-time collaboration suite",
    "a cloud cost optimization platform", "a customer data platform", "an automated testing framework",
    "a distributed tracing system", "a feature flagging service", "a developer productivity dashboard"
]


def generate_jobs(count: int = 220) -> list:
    """Generate N realistic job records."""
    jobs = []
    random.seed(42)  # Reproducible

    for i in range(count):
        template = random.choice(JOB_TEMPLATES)
        title = random.choice(template["title_templates"])
        company = random.choice(template["companies"])

        # Pick 8-12 skills from pool
        k = random.randint(8, 12)
        selected_skills = random.sample(template["skills_pool"], min(k, len(template["skills_pool"])))

        location = random.choice(template["locations"])
        salary = random.choice(template["salary_ranges"])
        exp_level = random.choice(template["experience_levels"])
        job_type = random.choice(template["job_types"])
        remote_type = random.choice(template["remote_types"])

        product = random.choice(PRODUCT_NAMES)
        description = template["base_description"].format(
            skills=", ".join(selected_skills[:6]),
            product=product
        )

        # Add some variation
        extra_details = [
            f"\n\nWe offer competitive compensation, equity, and comprehensive benefits.",
            f"\n\nOur team values diversity, continuous learning, and work-life balance.",
            f"\n\nYou'll work with cutting-edge technology and have autonomy to make architectural decisions.",
            f"\n\nJoin a fast-growing company backed by top-tier investors."
        ]
        description += random.choice(extra_details)

        jobs.append({
            "title": title,
            "company": company,
            "description": description,
            "location": location,
            "salary_range": salary,
            "required_skills": selected_skills,
            "experience_level": exp_level,
            "job_type": job_type,
            "remote_type": remote_type
        })

    return jobs


def main():
    print("Creating tables...")
    Base.metadata.create_all(bind=sync_engine)

    print("Loading embedding model...")
    embedder = EmbeddingService()

    print("Generating job data...")
    jobs_data = generate_jobs(220)

    session = SyncSessionLocal()
    try:
        # Clear existing jobs
        session.query(Job).delete()
        session.commit()

        print(f"Inserting {len(jobs_data)} jobs with embeddings...")
        for i, job_data in enumerate(jobs_data):
            # Create embedding text: title + skills + description summary
            embed_text = f"{job_data['title']} {' '.join(job_data['required_skills'])} {job_data['description'][:500]}"
            embedding = embedder.encode(embed_text)

            job = Job(
                title=job_data["title"],
                company=job_data["company"],
                description=job_data["description"],
                location=job_data["location"],
                salary_range=job_data["salary_range"],
                required_skills=json.dumps(job_data["required_skills"]),
                experience_level=job_data["experience_level"],
                embedding=json.dumps(embedding.tolist())
            )
            session.add(job)

            if (i + 1) % 50 == 0:
                session.commit()
                print(f"  Inserted {i + 1} jobs...")

        session.commit()
        print(f"Done! Inserted {len(jobs_data)} jobs.")

    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()