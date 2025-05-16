from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
from app.database.db import SessionLocal
from app.models.user import ChatSession, Chat
from pydantic import BaseModel
from datetime import datetime
from app.utils.auth_jwt import get_current_user

router = APIRouter(prefix="/chat-sessions", tags=["chat_sessions"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ChatSessionCreate(BaseModel):
    title: str = "New Chat"

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatAttachment(BaseModel):
    name: str
    type: str
    url: str
    extracted_text: Optional[str] = None
    size: Optional[int] = None

class ChatMessageResponse(BaseModel):
    id: int
    message: str
    response: str
    timestamp: datetime
    attachments: Optional[List[ChatAttachment]] = None

    class Config:
        from_attributes = True

@router.post("/", response_model=ChatSessionResponse)
def create_session(
    session: ChatSessionCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    new_session = ChatSession(title=session.title, user_id=user_id)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/", response_model=List[ChatSessionResponse])
def get_user_sessions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    user_id: Optional[str] = None  # Allow explicit user_id from query params
):
    # Use the authenticated user ID from token by default
    auth_user_id = current_user["user_id"]
    
    # Use the authenticated user's ID 
    # This ensures that even if a user_id is provided in the query params,
    # we still only show sessions belonging to the authenticated user
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == auth_user_id
    ).order_by(ChatSession.updated_at.desc()).all()
    
    print(f"Fetching sessions for user ID: {auth_user_id}, found {len(sessions)} sessions")
    return sessions

@router.get("/{session_id}", response_model=List[ChatMessageResponse])
def get_session_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    messages = db.query(Chat).filter(
        Chat.session_id == session_id
    ).order_by(Chat.timestamp.asc()).all()
    
    # Process messages to include attachments
    processed_messages = []
    for message in messages:
        msg_dict = {
            "id": message.id,
            "message": message.message,
            "response": message.response,
            "timestamp": message.timestamp,
            "attachments": None
        }
        
        # Parse attachments JSON if it exists
        if message.attachments:
            try:
                attachments = json.loads(message.attachments)
                msg_dict["attachments"] = attachments
            except:
                pass
                
        processed_messages.append(msg_dict)
    
    return processed_messages

@router.put("/{session_id}", response_model=ChatSessionResponse)
def update_session_title(
    session_id: int,
    session_data: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    session.title = session_data.title
    db.commit()
    db.refresh(session)
    return session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    db.delete(session)
    db.commit()
    return None