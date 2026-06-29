from fastapi import APIRouter, HTTPException, status
from database import get_db
from models.schemas import UserCreate, UserLogin, Token
from utils.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", status_code=201)
async def register(user: UserCreate):
    db = get_db()
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    doc = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
    }
    result = await db.users.insert_one(doc)
    return {"message": "Account created successfully", "id": str(result.inserted_id)}


@router.post("/login", response_model=Token)
async def login(creds: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": creds.email})
    if not user or not verify_password(creds.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user["_id"]), "name": user["name"], "email": user["email"]},
    }
