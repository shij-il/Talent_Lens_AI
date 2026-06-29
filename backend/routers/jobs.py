from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from database import get_db
from models.schemas import JobCreate
from utils.dependencies import get_current_user

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


def serialize_job(job: dict, candidate_count: int = 0) -> dict:
    return {
        "id": str(job["_id"]),
        "title": job["title"],
        "description": job["description"],
        "required_skills": job.get("required_skills", []),
        "min_experience_years": job.get("min_experience_years", 0),
        "location": job.get("location", ""),
        "employment_type": job.get("employment_type", "Full-time"),
        "created_at": job["created_at"].isoformat(),
        "candidate_count": candidate_count,
    }


@router.post("/", status_code=201)
async def create_job(job: JobCreate, user=Depends(get_current_user)):
    db = get_db()
    doc = {
        **job.model_dump(),
        "created_by": str(user["_id"]),
        "created_at": datetime.utcnow(),
    }
    result = await db.jobs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_job(doc)


@router.get("/")
async def list_jobs(user=Depends(get_current_user)):
    db = get_db()
    jobs = await db.jobs.find().sort("created_at", -1).to_list(100)
    result = []
    for job in jobs:
        count = await db.candidates.count_documents({"job_id": str(job["_id"])})
        result.append(serialize_job(job, count))
    return result


@router.get("/{job_id}")
async def get_job(job_id: str, user=Depends(get_current_user)):
    db = get_db()
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    count = await db.candidates.count_documents({"job_id": job_id})
    return serialize_job(job, count)


@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: str, user=Depends(get_current_user)):
    db = get_db()
    result = await db.jobs.delete_one({"_id": ObjectId(job_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.candidates.delete_many({"job_id": job_id})
