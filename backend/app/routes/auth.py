from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database.db import SessionLocal
from app.models.user import User
from app.utils.hashing import hash_password, verify_password
from app.utils.auth_jwt import create_access_token

class UserCreate(BaseModel):
    username: str
    email: EmailStr  # Added email validation
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    if len(user.username) > 30:  # Changed from 15 to 30
        raise HTTPException(status_code=400, detail="Username must be 30 characters or less.")
    if len(user.password) < 8 or len(user.password) > 10:
        raise HTTPException(status_code=400, detail="Password must be between 8 and 10 characters.")

    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken.")

    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already taken.")

    new_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}

@router.post("/login")
async def login(user: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token(data={"sub": db_user.username, "user_id": db_user.id})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user_id": db_user.id,
        "username": db_user.username
    }
