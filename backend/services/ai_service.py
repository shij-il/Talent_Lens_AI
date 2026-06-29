"""
AI Service: PDF text extraction, basic NER, skill matching, and resume scoring.
Uses lightweight regex-based NER for the base version (no heavy model downloads needed).
Sentence Transformers used for semantic matching (lazy-loaded).
"""
import re
import io
import math
from typing import List, Tuple, Optional
from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams

# Common tech skills dictionary for matching
KNOWN_SKILLS = [
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "php", "ruby",
    "react", "vue", "angular", "nextjs", "nodejs", "express", "fastapi", "django", "flask",
    "mongodb", "postgresql", "mysql", "redis", "sqlite", "elasticsearch",
    "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ci/cd", "github actions",
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch",
    "pandas", "numpy", "scikit-learn", "matplotlib", "seaborn",
    "html", "css", "tailwind", "bootstrap", "sass",
    "git", "linux", "bash", "rest api", "graphql", "microservices",
    "agile", "scrum", "jira", "figma", "postman",
    "sql", "nosql", "data analysis", "data science", "artificial intelligence",
    "spring boot", "hibernate", "maven", "gradle",
    "selenium", "pytest", "jest", "mocha",
]


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract raw text from PDF bytes."""
    try:
        output = io.StringIO()
        with io.BytesIO(pdf_bytes) as pdf_file:
            extract_text_to_fp(pdf_file, output, laparams=LAParams())
        return output.getvalue()
    except Exception as e:
        return ""


def extract_name(text: str) -> str:
    """Heuristic: first non-empty line that looks like a name."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    for line in lines[:5]:
        # Name lines: 2-4 words, only letters and spaces
        if re.match(r"^[A-Za-z][a-zA-Z\s]{2,40}$", line) and len(line.split()) in [2, 3, 4]:
            return line
    return "Unknown"


def extract_email(text: str) -> Optional[str]:
    match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    match = re.search(
        r"(\+?\d{1,3}[\s\-]?)?(\(?\d{3}\)?[\s\-]?)?\d{3}[\s\-]?\d{4}", text
    )
    return match.group(0).strip() if match else None


def extract_experience_years(text: str) -> float:
    """Parse mentions of years of experience."""
    text_lower = text.lower()
    # Patterns like "5 years", "3+ years", "2-4 years experience"
    patterns = [
        r"(\d+)\+?\s*years?\s+of\s+experience",
        r"(\d+)\+?\s*years?\s+experience",
        r"experience\s+of\s+(\d+)\+?\s*years?",
    ]
    for p in patterns:
        m = re.search(p, text_lower)
        if m:
            return float(m.group(1))

    # Count job entries heuristically by years mentioned near company names
    year_mentions = re.findall(r"\b(20\d{2})\b", text)
    if len(year_mentions) >= 2:
        years = sorted([int(y) for y in year_mentions])
        span = years[-1] - years[0]
        return min(float(span), 20.0)  # cap at 20

    return 0.0


def detect_skills(text: str, required_skills: List[str]) -> List[str]:
    """Return list of skills found in resume text."""
    text_lower = text.lower()
    found = set()

    # Match against known skills
    for skill in KNOWN_SKILLS:
        if re.search(r"\b" + re.escape(skill) + r"\b", text_lower):
            found.add(skill)

    # Also match required skills even if not in KNOWN_SKILLS
    for skill in required_skills:
        if re.search(r"\b" + re.escape(skill.lower()) + r"\b", text_lower):
            found.add(skill.lower())

    return sorted(list(found))


def compute_skills_score(detected_skills: List[str], required_skills: List[str]) -> float:
    """Score 0–100 based on how many required skills are present."""
    if not required_skills:
        return 50.0
    required_lower = [s.lower() for s in required_skills]
    detected_lower = [s.lower() for s in detected_skills]
    matched = sum(1 for s in required_lower if s in detected_lower)
    return round((matched / len(required_lower)) * 100, 2)


def compute_experience_score(candidate_years: float, min_years: int) -> float:
    """Score 0–100 based on experience relative to minimum required."""
    if min_years == 0:
        # No requirement — any experience is good
        return min(100.0, 50.0 + candidate_years * 5)
    ratio = candidate_years / min_years
    score = min(ratio * 100, 100.0)
    return round(score, 2)


def compute_semantic_score(resume_text: str, job_description: str) -> float:
    """
    Lightweight semantic score using word overlap (TF-IDF-style Jaccard similarity).
    In production upgrade to SentenceTransformers.
    """
    def tokenize(t):
        return set(re.findall(r"\b[a-z]{3,}\b", t.lower()))

    resume_tokens = tokenize(resume_text)
    job_tokens = tokenize(job_description)

    if not job_tokens:
        return 50.0

    intersection = resume_tokens & job_tokens
    union = resume_tokens | job_tokens
    jaccard = len(intersection) / len(union) if union else 0

    # Scale: jaccard 0.3 ~ good match → map to 0–100
    score = min(jaccard * 300, 100.0)
    return round(score, 2)


def compute_final_score(skills_score: float, experience_score: float, semantic_score: float) -> float:
    """Weighted composite score per spec: 40% skills, 25% experience, 35% semantic."""
    final = (skills_score * 0.40) + (experience_score * 0.25) + (semantic_score * 0.35)
    return round(final, 2)


def analyze_resume(pdf_bytes: bytes, job: dict) -> dict:
    """Full pipeline: extract → NER → skills → score → rank data."""
    text = extract_text_from_pdf(pdf_bytes)

    name = extract_name(text)
    email = extract_email(text)
    phone = extract_phone(text)
    experience_years = extract_experience_years(text)
    skills_detected = detect_skills(text, job.get("required_skills", []))

    skills_score = compute_skills_score(skills_detected, job.get("required_skills", []))
    experience_score = compute_experience_score(experience_years, job.get("min_experience_years", 0))
    semantic_score = compute_semantic_score(text, job.get("description", ""))
    final_score = compute_final_score(skills_score, experience_score, semantic_score)

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "experience_years": experience_years,
        "skills_detected": skills_detected,
        "skills_score": skills_score,
        "experience_score": experience_score,
        "semantic_score": semantic_score,
        "final_score": final_score,
    }
