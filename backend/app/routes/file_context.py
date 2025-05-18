from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
import os
import json
from typing import Optional
from app.database.db import SessionLocal
from app.models.user import Chat, ChatSession
from app.utils.auth_jwt import get_current_user

router = APIRouter(prefix="/file-context", tags=["FileContext"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{chat_id}")
async def get_file_context(
    chat_id: int = Path(..., description="The ID of the chat message containing the file"),
    file_index: Optional[int] = Query(None, description="Index of the specific file to retrieve context for"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the context of files attached to a specific chat message.
    This is useful for follow-up questions about previously uploaded files.
    """
    user_id = current_user["user_id"]
    
    # Find the chat message that contains the file
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == user_id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat message not found")
    
    if not chat.attachments:
        raise HTTPException(status_code=404, detail="No files attached to this chat message")
    
    try:
        attachments = json.loads(chat.attachments)
        
        # If a specific file is requested
        if file_index is not None:
            if file_index < 0 or file_index >= len(attachments):
                raise HTTPException(status_code=404, detail="File index out of range")
            
            return {
                "file": attachments[file_index],
                "message_context": chat.message,
                "ai_response": chat.response,
                "chat_id": chat.id
            }
        
        # Otherwise return all files
        return {
            "files": attachments,
            "message_context": chat.message,
            "ai_response": chat.response,
            "chat_id": chat.id
        }
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid file attachment data")


@router.get("/by-filename/{filename}")
async def get_file_by_name(
    filename: str = Path(..., description="The name of the file to search for"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Find a file by name across all chat messages for the current user.
    This is useful for follow-up questions about previously uploaded files.
    """
    user_id = current_user["user_id"]
    
    # Get all chats for this user that might have attachments
    chats = db.query(Chat).filter(
        Chat.user_id == user_id,
        Chat.attachments.isnot(None)
    ).all()
    
    for chat in chats:
        try:
            attachments = json.loads(chat.attachments)
            
            # Look for a file with matching name
            for i, attachment in enumerate(attachments):
                if attachment.get("name") == filename or attachment.get("original_name") == filename:
                    return {
                        "file": attachment,
                        "message_context": chat.message,
                        "ai_response": chat.response,
                        "chat_id": chat.id,
                        "file_index": i
                    }
        except:
            continue
    
    raise HTTPException(status_code=404, detail=f"No file named '{filename}' found")


@router.get("/recent/{session_id}")
async def get_recent_files(
    session_id: int = Path(..., description="The ID of the chat session"),
    limit: int = Query(5, description="Maximum number of recent files to return"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the most recent files uploaded in a chat session.
    This helps users quickly reference recent files for follow-up questions.
    """
    user_id = current_user["user_id"]
    
    # Verify the session exists and belongs to the user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Get the most recent chats with attachments in this session
    chats = db.query(Chat).filter(
        Chat.session_id == session_id,
        Chat.user_id == user_id,
        Chat.attachments.isnot(None)
    ).order_by(Chat.timestamp.desc()).limit(limit).all()
    
    result = []
    
    for chat in chats:
        try:
            attachments = json.loads(chat.attachments)
            for attachment in attachments:
                result.append({
                    "file": attachment,
                    "chat_id": chat.id,
                    "timestamp": chat.timestamp.isoformat()
                })
                
                # Limit the total number of files
                if len(result) >= limit:
                    break
                    
        except:
            continue
    
    return {"files": result}
