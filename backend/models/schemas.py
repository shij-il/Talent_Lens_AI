from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


# ── Auth ──────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Jobs ──────────────────────────────────────────────
class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: List[str]
    min_experience_years: int = 0
    location: Optional[str] = ""
    employment_type: Optional[str] = "Full-time"


class JobOut(BaseModel):
    id: str
    title: str
    description: str
    required_skills: List[str]
    min_experience_years: int
    location: Optional[str]
    employment_type: Optional[str]
    created_at: datetime
    candidate_count: int = 0


# ── Candidates ────────────────────────────────────────
class CandidateOut(BaseModel):
    id: str
    job_id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    filename: str
    skills_detected: List[str]
    experience_years: float
    skills_score: float
    experience_score: float
    semantic_score: float
    final_score: float
    status: str  # "pending" | "shortlisted" | "rejected"
    uploaded_at: datetime


class StatusUpdate(BaseModel):
    status: str  # "shortlisted" | "rejected" | "pending"
