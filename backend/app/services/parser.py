import os
import re
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

# Safe imports for document parsing
try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    from docx import Document
except ImportError:
    Document = None

SKILLS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "skills_taxonomy.json")

def load_skills_taxonomy() -> Dict[str, List[str]]:
    if os.path.exists(SKILLS_PATH):
        with open(SKILLS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

SKILLS_DB = load_skills_taxonomy()

# Precompile a flat list of skills with lowercased keys for fast matching
FLAT_SKILLS = {}
for category, skills in SKILLS_DB.items():
    for skill in skills:
        FLAT_SKILLS[skill.lower()] = skill

COMMON_ACTION_VERBS = [
    "built", "created", "designed", "developed", "engineered", "implemented", "launched",
    "led", "managed", "orchestrated", "architected", "optimized", "spearheaded", "transformed",
    "delivered", "reduced", "increased", "generated", "improved", "streamlined", "automated"
]

WEAK_ACTION_VERBS = [
    "worked on", "helped with", "assisted", "responsible for", "handled", "participated in",
    "attempted", "utilized", "did", "tasked with", "involved in"
]


class ResumeParser:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        text = ""
        if pdfplumber:
            try:
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
            except Exception as e:
                text = ""

        # Fallback to simple binary decode if pdfplumber fails or is missing
        if not text.strip():
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                for page in reader.pages:
                    t = page.extract_text()
                    if t:
                        text += t + "\n"
            except Exception:
                pass
        return text

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        text = ""
        if Document:
            try:
                doc = Document(file_path)
                for para in doc.paragraphs:
                    text += para.text + "\n"
                for table in doc.tables:
                    for row in table.rows:
                        for cell in row.cells:
                            text += cell.text + " "
                        text += "\n"
            except Exception:
                pass
        return text

    @classmethod
    def extract_text(cls, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return cls.extract_text_from_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            return cls.extract_text_from_docx(file_path)
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        return ""

    @staticmethod
    def extract_email(text: str) -> Optional[str]:
        match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        return match.group(0) if match else None

    @staticmethod
    def extract_phone(text: str) -> Optional[str]:
        match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
        return match.group(0) if match else None

    @staticmethod
    def extract_links(text: str) -> Dict[str, Optional[str]]:
        linkedin = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+", text, re.IGNORECASE)
        github = re.search(r"(?:https?://)?(?:www\.)?github\.com/[\w-]+", text, re.IGNORECASE)
        portfolio = re.search(r"(?:https?://)?(?:www\.)?[a-zA-Z0-9-]+\.(?:io|dev|me|tech|app)(?:/[\w-]+)?", text, re.IGNORECASE)

        return {
            "linkedin": linkedin.group(0) if linkedin else None,
            "github": github.group(0) if github else None,
            "portfolio": portfolio.group(0) if portfolio else None
        }

    @staticmethod
    def extract_name(text: str) -> Optional[str]:
        # Typically the candidate's name is in the first 3 lines
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:3]:
            # Simple heuristic: 2 to 4 words, alphabetic, no special characters/emails
            if 1 < len(line.split()) <= 4 and re.match(r"^[A-Za-z\s\.-]+$", line):
                # Ensure it's not a heading like "Curriculum Vitae" or "Resume"
                if line.lower() not in ["resume", "curriculum vitae", "cv", "profile", "contact"]:
                    return line
        return None

    @staticmethod
    def extract_skills(text: str) -> List[str]:
        found_skills = set()
        lowered_text = " " + text.lower() + " "

        # Word boundary search for skills
        for skill_lower, canonical_name in FLAT_SKILLS.items():
            pattern = r"(?<!\w)" + re.escape(skill_lower) + r"(?!\w)"
            if re.search(pattern, lowered_text):
                found_skills.add(canonical_name)

        return sorted(list(found_skills))

    @staticmethod
    def extract_sections(text: str) -> Dict[str, str]:
        section_headers = {
            "education": [r"education", r"academic background", r"qualifications"],
            "experience": [r"experience", r"work experience", r"employment history", r"professional experience"],
            "skills": [r"skills", r"technical skills", r"technologies", r"core competencies"],
            "projects": [r"projects", r"personal projects", r"key projects"],
            "certifications": [r"certifications", r"licenses", r"courses", r"certificates"],
            "summary": [r"summary", r"professional summary", r"about me", r"objective"]
        }

        sections = {k: "" for k in section_headers}
        lines = text.split("\n")
        current_section = "summary"

        for line in lines:
            clean_line = line.strip().lower()
            detected_header = None

            # Check if this line is likely a header (short, matches section keyword)
            if len(clean_line.split()) <= 4:
                for sec, patterns in section_headers.items():
                    if any(re.match(rf"^{p}:?$", clean_line) for p in patterns):
                        detected_header = sec
                        break

            if detected_header:
                current_section = detected_header
            else:
                sections[current_section] += line + "\n"

        return sections

    @staticmethod
    def estimate_years_of_experience(text: str) -> int:
        current_year = datetime.now().year
        # Look for 4 digit years from 1980 up to current year
        years = [int(y) for y in re.findall(r"\b(19[89]\d|20[0-2]\d)\b", text)]
        if not years:
            return 0
        min_year = min(years)
        max_year = max(years)
        # Cap at current year
        max_year = min(max_year, current_year)
        diff = max_year - min_year
        return min(max(diff, 0), 40)

    @classmethod
    def parse(cls, file_path: str) -> Dict[str, Any]:
        raw_text = cls.extract_text(file_path)
        sections = cls.extract_sections(raw_text)
        skills = cls.extract_skills(raw_text)

        return {
            "name": cls.extract_name(raw_text),
            "email": cls.extract_email(raw_text),
            "phone": cls.extract_phone(raw_text),
            "links": cls.extract_links(raw_text),
            "skills": skills,
            "years_of_experience": cls.estimate_years_of_experience(raw_text),
            "sections": sections,
            "raw_text": raw_text,
            "word_count": len(raw_text.split())
        }
