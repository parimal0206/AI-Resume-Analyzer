# AI-Powered Resume Analyzer & Job Recommendation System

A production-quality full-stack web application that helps job seekers optimize their resumes, find matching jobs, and track applications — all powered by AI.

## 🎯 Features

- **Resume Parsing**: Extract structured data from PDF/DOCX (skills, experience, education, projects, certifications)
- **AI Analysis**: ATS scoring (0-100), section-wise breakdown, weak phrase detection, quantified bullet rewrites via Claude
- **Job Recommendations**: Hybrid matching (semantic + skill overlap + experience fit) across 200+ curated jobs
- **JD Matcher**: Paste any job description to see match score, keyword gaps, and tailored suggestions
- **Skill Gap Report**: Aggregated missing skills ranked by market demand with learning resources
- **Application Tracker**: Save jobs, track pipeline (Saved → Applied → Interview → Offer → Rejected)
- **Admin Panel**: User/job management, analytics, bulk import
- **Modern UI**: Dark/light mode, responsive, accessible, charts, and visualizations

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend (React 18 + Vite + Tailwind)"
        UI[UI Components]
        Pages[Pages: Dashboard, Upload, Analysis, Jobs, Match, Skill Gap, Applications]
        Store[Auth Store + React Query]
        Charts[Recharts: Gauge, Bar Charts]
    end

    subgraph "Backend (FastAPI + Python 3.11)"
        API[REST API /api/v1]
        Auth[JWT Auth]
        Parser[Resume Parser: pdfplumber, python-docx]
        Analyzer[ATS Scoring Engine]
        Recommender[Job Recommender: Hybrid Scoring]
        Embeddings[Sentence Transformers: all-MiniLM-L6-v2]
        LLM[Claude API Integration]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL / SQLite)]
        Skills[Skills Taxonomy JSON 500+]
        Jobs[Seed Jobs 200+ with Embeddings]
    end

    UI --> API
    Pages --> Store
    Store --> API
    API --> Auth
    API --> Parser
    API --> Analyzer
    API --> Recommender
    API --> LLM
    Parser --> Skills
    Analyzer --> LLM
    Recommender --> Embeddings
    Recommender --> Jobs
    API --> DB
    Embeddings --> Jobs
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (recommended)
- Or: Python 3.11+, Node 20+, PostgreSQL 16+

### With Docker (Recommended)

```bash
# 1. Clone and navigate
cd ai-resume-analyser

# 2. Copy environment template
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY for AI features

# 3. Start all services
docker-compose up -d --build

# 4. Seed database with jobs (first run only)
docker-compose exec backend python -m scripts.seed_db

# 5. Open application
# Frontend: http://localhost
# Backend API: http://localhost:8000/api/v1/docs
```

### Without Docker (Local Development)

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_md

# Copy env and configure
cp ../.env.example .env
# Edit .env with your settings

# Run migrations
alembic upgrade head

# Seed database
python -m scripts.seed_db

# Start server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# Opens at http://localhost:5173
```

---

## 🔧 Configuration

### Environment Variables (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | `development` or `production` | `development` |
| `SECRET_KEY` | JWT signing key (change in prod!) | `supersecret...` |
| `DATABASE_URL` | Async DB URL | `sqlite+aiosqlite:///./app.db` |
| `ANTHROPIC_API_KEY` | Claude API key for AI features | *optional* |
| `CLAUDE_MODEL` | Model to use | `claude-3-5-sonnet-20241022` |
| `EMBEDDING_MODEL` | Sentence transformer model | `all-MiniLM-L6-v2` |
| `POSTGRES_*` | PostgreSQL credentials (Docker) | See docker-compose |

### Database

- **Development**: SQLite (`sqlite+aiosqlite:///./app.db`) — zero config
- **Production**: PostgreSQL — set `DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db`

### AI Features

The application works **fully offline** without an Anthropic API key:
- Resume parsing, ATS scoring, job matching all work via rule-based engines
- With `ANTHROPIC_API_KEY`: Enhanced summaries, bullet rewrites, contextual advice

---

## 📡 API Overview

Base URL: `/api/v1`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login (returns JWT) |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/resumes/upload` | Upload PDF/DOCX (multipart) |
| GET | `/resumes` | List user's resumes |
| GET | `/resumes/{id}` | Get parsed resume data |
| DELETE | `/resumes/{id}` | Delete resume |
| POST | `/resumes/{id}/analyze` | Run AI analysis |
| GET | `/resumes/{id}/analysis` | Get analysis report |

### Jobs & Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jobs` | List jobs (filters: location, level, keyword) |
| GET | `/jobs/{id}` | Get job details |
| GET | `/resumes/{id}/recommendations` | Get matched jobs |
| POST | `/match` | Match resume to pasted JD |
| GET | `/skills/gap/{resume_id}` | Skill gap report |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/jobs/{id}/save` | Save job |
| DELETE | `/jobs/{id}/unsave` | Unsave job |
| GET | `/saved-jobs` | List saved jobs |
| POST | `/applications` | Create application |
| GET | `/applications` | List applications |
| PATCH | `/applications/{id}` | Update status |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Platform statistics |
| GET | `/admin/jobs` | List all jobs |
| POST | `/admin/jobs` | Create job |
| DELETE | `/admin/jobs/{id}` | Delete job |

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest app/tests/ -v
```

### Frontend Tests

```bash
cd frontend
npm test  # Requires vitest setup
```

---

## 📦 Project Structure

```
ai-resume-analyser/
├── backend/
│   ├── app/
│   │   ├── api/           # Route handlers (auth, resumes, jobs, admin)
│   │   ├── core/          # Config, DB, security
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic (parser, analyzer, recommender, embeddings)
│   │   ├── tests/         # Pytest unit/integration tests
│   │   └── main.py        # FastAPI entrypoint
│   ├── data/              # skills_taxonomy.json, seed_jobs.json, sample_resume.txt
│   ├── scripts/           # seed_db.py
│   ├── migrations/        # Alembic migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # UI (Button, Card, Badge, Charts)
│   │   ├── pages/         # Routed pages (Dashboard, Upload, Analysis, Jobs, etc.)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # Axios API client
│   │   ├── store/         # Auth context + React Query
│   │   ├── lib/           # Utilities
│   │   ├── App.tsx        # Router + protected routes
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🌐 Deployment

### Backend (Render / Railway / Fly.io)

1. Push backend folder as a separate service
2. Set environment variables from `.env.example`
3. Use PostgreSQL addon
4. Run migrations: `alembic upgrade head`
5. Seed jobs: `python -m scripts.seed_db`
6. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel / Netlify / Cloudflare Pages)

1. Connect frontend folder
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend-url/api/v1`
5. Deploy

### Docker (Any VPS / Cloud Run / ECS)

```bash
# On server
docker-compose -f docker-compose.yml up -d --build
docker-compose exec backend python -m scripts.seed_db
```

---

## 🔮 Future Improvements

- [ ] **Real-time job scraping** via Adzuna/JSearch/RemoteOK adapters
- [ ] **Cover letter generator** from matched JD + resume
- [ ] **Interview prep** — behavioral/technical questions based on job
- [ ] **Multi-language support** (spaCy models for other languages)
- [ ] **Vector database** (Pinecone/Weaviate) for 10k+ job scale
- [ ] **Team features** — recruiter view, shared candidate pools
- [ ] **Mobile app** (React Native / Expo)
- [ ] **Analytics dashboard** — conversion funnels, source tracking

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pytest` (backend) / `npm test` (frontend)
5. Submit a PR

---

## 📸 Screenshots

*(Add screenshots here after running the app)*

| Dashboard | Analysis Report | Job Matches | JD Matcher |
|-----------|-----------------|-------------|------------|
| ![Dashboard](docs/dashboard.png) | ![Analysis](docs/analysis.png) | ![Jobs](docs/jobs.png) | ![Match](docs/match.png) |

---

## 🙏 Acknowledgments

- **Anthropic Claude** for AI-powered resume feedback
- **Sentence Transformers** for semantic embeddings
- **spaCy** for NLP entity extraction
- **FastAPI** for the excellent Python framework
- **React + Tailwind** for the modern frontend stack