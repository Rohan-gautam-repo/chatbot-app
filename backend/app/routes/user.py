from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.db import SessionLocal
from app.models.user import User
from app.utils.hashing import hash_password, verify_password
from app.utils.auth_jwt import get_current_user

class UserUpdate(BaseModel):
    username: str = None
    password: str = None
    current_password: str = None

router = APIRouter(prefix="/user", tags=["User"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.put("/update")
async def update_user(
    user_update: UserUpdate, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Get user from database
    db_user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password before making changes
    if not verify_password(user_update.current_password, db_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update username if provided and it's different
    if user_update.username and user_update.username != db_user.username:
        # Check if username already exists
        if db.query(User).filter(User.username == user_update.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Update username
        db_user.username = user_update.username
    
    # Update password if provided
    if user_update.password:
        # Check password length
        if len(user_update.password) < 8 or len(user_update.password) > 10:
            raise HTTPException(status_code=400, detail="Password must be between 8 and 10 characters")
        
        # Update password
        db_user.password = hash_password(user_update.password)
    
    # Commit changes
    db.commit()
    
    return {"message": "User updated successfully"}
