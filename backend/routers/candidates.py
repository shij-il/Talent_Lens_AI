import csv
import io
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from bson import ObjectId
from datetime import datetime
from typing import List
from database import get_db
from models.schemas import StatusUpdate
from services.ai_service import analyze_resume
from utils.dependencies import get_current_user

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])


def serialize_candidate(c: dict) -> dict:
    return {
        "id": str(c["_id"]),
        "job_id": c["job_id"],
        "name": c.get("name", "Unknown"),
        "email": c.get("email"),
        "phone": c.get("phone"),
        "filename": c.get("filename", ""),
        "skills_detected": c.get("skills_detected", []),
        "experience_years": c.get("experience_years", 0),
        "skills_score": c.get("skills_score", 0),
        "experience_score": c.get("experience_score", 0),
        "semantic_score": c.get("semantic_score", 0),
        "final_score": c.get("final_score", 0),
        "status": c.get("status", "pending"),
        "uploaded_at": c["uploaded_at"].isoformat(),
    }


@router.post("/upload/{job_id}", status_code=201)
async def upload_resumes(
    job_id: str,
    files: List[UploadFile] = File(...),
    user=Depends(get_current_user),
):
    db = get_db()
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    results = []
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            continue
        pdf_bytes = await file.read()
        analysis = analyze_resume(pdf_bytes, job)
        doc = {
            "job_id": job_id,
            "filename": file.filename,
            "status": "pending",
            "uploaded_at": datetime.utcnow(),
            **analysis,
        }
        result = await db.candidates.insert_one(doc)
        doc["_id"] = result.inserted_id
        results.append(serialize_candidate(doc))

    return {"uploaded": len(results), "candidates": results}


@router.get("/job/{job_id}")
async def get_candidates(job_id: str, user=Depends(get_current_user)):
    db = get_db()
    candidates = (
        await db.candidates.find({"job_id": job_id})
        .sort("final_score", -1)
        .to_list(500)
    )
    return [serialize_candidate(c) for c in candidates]


@router.patch("/{candidate_id}/status")
async def update_status(
    candidate_id: str, body: StatusUpdate, user=Depends(get_current_user)
):
    if body.status not in ("pending", "shortlisted", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status value")
    db = get_db()
    result = await db.candidates.update_one(
        {"_id": ObjectId(candidate_id)}, {"$set": {"status": body.status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"message": "Status updated"}


@router.delete("/{candidate_id}", status_code=204)
async def delete_candidate(candidate_id: str, user=Depends(get_current_user)):
    db = get_db()
    result = await db.candidates.delete_one({"_id": ObjectId(candidate_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")


@router.get("/export/{job_id}")
async def export_csv(job_id: str, user=Depends(get_current_user)):
    db = get_db()
    candidates = (
        await db.candidates.find({"job_id": job_id})
        .sort("final_score", -1)
        .to_list(500)
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Rank", "Name", "Email", "Phone", "Skills Detected",
        "Experience (yrs)", "Skills Score", "Experience Score",
        "Semantic Score", "Final Score", "Status"
    ])
    for rank, c in enumerate(candidates, start=1):
        writer.writerow([
            rank,
            c.get("name", ""),
            c.get("email", ""),
            c.get("phone", ""),
            ", ".join(c.get("skills_detected", [])),
            c.get("experience_years", 0),
            c.get("skills_score", 0),
            c.get("experience_score", 0),
            c.get("semantic_score", 0),
            c.get("final_score", 0),
            c.get("status", "pending"),
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=candidates_job_{job_id}.csv"},
    )
