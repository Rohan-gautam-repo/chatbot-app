from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database.db import SessionLocal
from ..models.user import Chat, ChatSession
from pydantic import BaseModel
from typing import List, Optional
import requests
from datetime import datetime
import json
from app.utils.auth_jwt import get_current_user
from app.utils.chroma_db import chroma_db
from app.utils.file_processor import file_processor
from app.config.dataset_config import DATASET_PATH  # Import dataset config

router = APIRouter(prefix="/chat", tags=["Chat"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ChatRequest(BaseModel):
    message: str
    session_id: int

class ChatSummary(BaseModel):
    id: int
    chat_title: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatHistory(BaseModel):
    message: str
    response: str
    timestamp: datetime

    class Config:
        from_attributes = True

OLLAMA_URL = "http://localhost:11434/api/generate"

@router.post("/")
def chat(
    req: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    
    # Verify the session exists and belongs to the user
    session = db.query(ChatSession).filter(
        ChatSession.id == req.session_id,
        ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
      # Update the timestamp to show this session was recently used
    from datetime import datetime
    session.updated_at = datetime.utcnow()
    db.commit()
    
    try:
        # Use ChromaDB to find relevant previous context based on semantic similarity
        relevant_context = chroma_db.get_relevant_context(
            user_id=user_id,
            session_id=req.session_id,
            query=req.message,
            limit=5  # Get 5 most semantically relevant chat exchanges
        )
        
        # Also get the most recent messages to maintain conversation flow
        recent_messages = db.query(Chat).filter(
            Chat.session_id == req.session_id
        ).order_by(Chat.timestamp.desc()).limit(3).all()  # Get last 3 messages for recency bias
        
        # Build context combining semantic relevance with recency
        system_message = "You are Nexora AI, a helpful and knowledgeable assistant. Maintain context of the conversation and provide accurate, concise responses. Remember previous information shared by the user.\n\n"
        context = system_message
        
        # Add semantically relevant context first
        if relevant_context:
            context += "Relevant conversation history:\n"
            for exchange in relevant_context:
                context += f"{exchange}\n\n"
        
        # Add recent messages for conversational flow
        if recent_messages:
            context += "Recent conversation:\n"
            # Reverse to get chronological order
            for msg in reversed(recent_messages):
                context += f"User: {msg.message}\nAI: {msg.response}\n\n"
    except Exception as e:
        # If there's an issue with ChromaDB, fall back to the traditional method
        print(f"ChromaDB error, falling back to traditional context retrieval: {str(e)}")
        
        # Traditional method - get previous messages from this session
        previous_messages = db.query(Chat).filter(
            Chat.session_id == req.session_id
        ).order_by(Chat.timestamp.desc()).limit(10).all()
        
        system_message = "You are Nexora AI, a helpful and knowledgeable assistant. Maintain context of the conversation and provide accurate, concise responses. Remember previous information shared by the user.\n\n"
        context = system_message
        
        if previous_messages:
            # Reverse to get chronological order
            for msg in reversed(previous_messages):
                context += f"User: {msg.message}\nAI: {msg.response}\n\n"
    
    # Combine context with current message
    full_prompt = f"{context}User: {req.message}\nAI:"

    payload = {
        "model": "llama3.2",
        "prompt": full_prompt,
        "stream": False
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        result = response.json()
        ai_reply = result.get("response", "No response from model.")
        
        # Clean up AI response if needed to remove any artifacts from context
        if ai_reply.startswith("AI:"):
            ai_reply = ai_reply[3:].strip()
            
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="AI service is currently unavailable. Please try again later.")
    except Exception as e:
        print(f"Error during AI request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")    # Save chat to the SQL database
    chat = Chat(
        message=req.message, 
        response=ai_reply, 
        user_id=user_id,
        session_id=req.session_id
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)

    # Also add to ChromaDB for future semantic search
    chroma_db.add_chat_entry(
        user_id=user_id,
        session_id=req.session_id,
        message=req.message,
        response=ai_reply
    )

    return {"reply": ai_reply, "chat_id": chat.id}

@router.post("/chroma")
def chat_with_chroma(
    req: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Endpoint that specifically uses ChromaDB for semantic search to retrieve context."""
    user_id = current_user["user_id"]
    
    # Verify the session exists and belongs to the user
    session = db.query(ChatSession).filter(
        ChatSession.id == req.session_id,
        ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Update the timestamp to show this session was recently used
    session.updated_at = datetime.utcnow()
    db.commit()
    
    # Use ChromaDB to find relevant previous context based on semantic similarity
    relevant_context = chroma_db.get_relevant_context(
        user_id=user_id,
        session_id=req.session_id,
        query=req.message,
        limit=5
    )
    # Add RAG dataset context (domain-specific)
    rag_context = chroma_db.get_relevant_context(
        user_id='rag',
        session_id='rag',
        query=req.message,
        limit=3
    )
    
    # Also get the most recent message to maintain conversation flow
    recent_message = db.query(Chat).filter(
        Chat.session_id == req.session_id
    ).order_by(Chat.timestamp.desc()).first()
    
    # Build context combining semantic relevance with recency
    system_message = "You are Nexora AI, a helpful and knowledgeable assistant. Maintain context of the conversation and provide accurate, concise responses. Remember previous information shared by the user.\n\n"
    context = system_message
    
    # Add semantically relevant context first
    if relevant_context:
        context += "Relevant conversation history:\n"
        for exchange in relevant_context:
            context += f"{exchange}\n\n"
    # Add RAG context if available
    if rag_context:
        context += "Relevant domain knowledge:\n"
        for chunk in rag_context:
            context += f"{chunk}\n\n"
    
    # Add recent message for conversational flow
    if recent_message:
        context += "Most recent exchange:\n"
        context += f"User: {recent_message.message}\nAI: {recent_message.response}\n\n"
    
    # Combine context with current message
    full_prompt = f"{context}User: {req.message}\nAI:"

    payload = {
        "model": "llama3.2",
        "prompt": full_prompt,
        "stream": False
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        result = response.json()
        ai_reply = result.get("response", "No response from model.")
        
        # Clean up AI response if needed to remove any artifacts from context
        if ai_reply.startswith("AI:"):
            ai_reply = ai_reply[3:].strip()
            
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="AI service is currently unavailable. Please try again later.")
    except Exception as e:
        print(f"Error during AI request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")

    # Save chat to the SQL database
    chat = Chat(
        message=req.message, 
        response=ai_reply, 
        user_id=user_id,
        session_id=req.session_id
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)

    # Also add to ChromaDB for future semantic search
    chroma_db.add_chat_entry(
        user_id=user_id,
        session_id=req.session_id,
        message=req.message,
        response=ai_reply
    )

    return {"reply": ai_reply, "chat_id": chat.id}

@router.post("/with-files")
async def chat_with_files(
    files: List[UploadFile] = File(...),
    message: Optional[str] = Form(None),
    session_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    
    # Verify the session exists and belongs to the user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Update the timestamp to show this session was recently used
    session.updated_at = datetime.utcnow()
    db.commit()
    
    processed_files = []
    extracted_text_combined = ""    # Process each uploaded file but keep them for future reference
    for file in files:
        file_info = file_processor.process_file(file, user_id, delete_after_processing=False)
        processed_files.append(file_info)
        if file_info["extracted_text"]:
            extracted_text_combined += f"\n\nText from {file_info['original_name']}:\n{file_info['extracted_text']}"
    
    # Combine message and extracted text
    user_message = message or ""
    if extracted_text_combined:
        user_message_with_files = f"{user_message}\n\nAttached files:{extracted_text_combined}"
    else:
        user_message_with_files = user_message
    
    # Format the file information for storage in the database
    file_attachments = []
    for file in processed_files:
        file_attachments.append({
            "name": file["original_name"],
            "type": file["content_type"],
            "url": file["url"],
            "size": file["size"],
            "extracted_text": file["extracted_text"]
        })
    
    try:
        # Use ChromaDB to find relevant previous context based on semantic similarity
        relevant_context = chroma_db.get_relevant_context(
            user_id=user_id,
            session_id=session_id,
            query=user_message_with_files,
            limit=5  # Get 5 most semantically relevant chat exchanges
        )
        
        # Also get the most recent messages to maintain conversation flow
        recent_messages = db.query(Chat).filter(
            Chat.session_id == session_id
        ).order_by(Chat.timestamp.desc()).limit(3).all()  # Get last 3 messages for recency bias
        
        # Build context combining semantic relevance with recency
        system_message = "You are Nexora AI, a helpful and knowledgeable assistant. The user is sending you messages with attached files which have been converted to text. Please analyze both the message and the extracted text to provide an appropriate response. Be concise and helpful, focusing on what the files actually contain.\n\n"
        context = system_message
        
        # Add semantically relevant context first
        if relevant_context:
            context += "Relevant conversation history:\n"
            for exchange in relevant_context:
                context += f"{exchange}\n\n"
        
        # Add recent messages for conversational flow
        if recent_messages:
            context += "Recent conversation:\n"
            # Reverse to get chronological order
            for msg in reversed(recent_messages):
                context += f"User: {msg.message}\nAI: {msg.response}\n\n"
    except Exception as e:
        # If there's an issue with ChromaDB, fall back to the traditional method
        print(f"ChromaDB error, falling back to traditional context retrieval: {str(e)}")
        
        # Traditional method - get previous messages from this session
        previous_messages = db.query(Chat).filter(
            Chat.session_id == session_id
        ).order_by(Chat.timestamp.desc()).limit(10).all()
        
        system_message = "You are Nexora AI, a helpful and knowledgeable assistant. The user is sending you messages with attached files which have been converted to text. Please analyze both the message and the extracted text to provide an appropriate response. Be concise and helpful, focusing on what the files actually contain.\n\n"
        context = system_message
        
        if previous_messages:
            # Reverse to get chronological order
            for msg in reversed(previous_messages):
                context += f"User: {msg.message}\nAI: {msg.response}\n\n"
    
    # Combine context with current message
    full_prompt = f"{context}User: {user_message_with_files}\nAI:"

    payload = {
        "model": "llama3.2",
        "prompt": full_prompt,
        "stream": False
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        result = response.json()
        ai_reply = result.get("response", "No response from model.")
        
        # Clean up AI response if needed to remove any artifacts from context
        if ai_reply.startswith("AI:"):
            ai_reply = ai_reply[3:].strip()
            
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="AI service is currently unavailable. Please try again later.")
    except Exception as e:
        print(f"Error during AI request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")
    
    # Store the original message (without the extracted text) and attachments in JSON format
    original_message = user_message
    attachments_json = json.dumps(file_attachments) if file_attachments else None
    
    # Save chat to the SQL database
    chat = Chat(
        message=original_message, 
        response=ai_reply,
        user_id=user_id,
        session_id=session_id,
        attachments=attachments_json
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)

    # Also add to ChromaDB for future semantic search
    chroma_db.add_chat_entry(
        user_id=user_id,
        session_id=session_id,
        message=user_message_with_files,  # Include extracted text for semantic search
        response=ai_reply
    )

    return {
        "reply": ai_reply, 
        "chat_id": chat.id,
        "originalAttachments": file_attachments
    }
