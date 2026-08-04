from fastapi import APIRouter, HTTPException, status

from app.core.database import get_database, serialize_doc, utc_now
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth_schema import LoginRequest, RegisterRequest, TokenResponse


router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest):
    db = get_database()
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "role": "analyst",
        "created_at": utc_now(),
    }
    result = await db.users.insert_one(user)
    user["_id"] = result.inserted_id
    public_user = serialize_doc(user)
    public_user.pop("password_hash", None)
    return TokenResponse(access_token=create_access_token(payload.email), token_type="bearer", user=public_user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await get_database().users.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    public_user = serialize_doc(user)
    public_user.pop("password_hash", None)
    return TokenResponse(access_token=create_access_token(payload.email), token_type="bearer", user=public_user)
