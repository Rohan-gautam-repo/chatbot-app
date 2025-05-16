from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.routes import auth, chat, chat_sessions
from app.database.db import Base, engine
from app.models import user  # This imports the models so they're registered with SQLAlchemy
from app.database.migrations import run_migrations
from app.utils.chroma_db import chroma_db  # Import ChromaDB singleton

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Run migrations to update existing tables if needed
run_migrations()

app = FastAPI()

# Create uploads directory if it doesn't exist
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(uploads_dir, exist_ok=True)

# Startup event to check ChromaDB initialization
@app.on_event("startup")
async def startup_event():
    import logging
    import os
    logger = logging.getLogger("uvicorn")
    
    try:
        logger.info("Initializing ChromaDB for faster responses...")
        
        # Try to access the ChromaDB collections to check if it's working
        collection_count = len(chroma_db.client.list_collections())
        logger.info(f"ChromaDB initialized successfully with {collection_count} collections")
        
    except Exception as e:
        logger.error(f"Error initializing ChromaDB: {str(e)}")
        logger.info("Attempting to reset ChromaDB...")
        
        try:
            # Reset ChromaDB by recreating it
            chroma_db._recreate_chroma_db()
            
            # Repopulate with existing data
            from app.utils.populate_chroma import populate_chroma_db
            populate_chroma_db()
            
            logger.info("ChromaDB reset and repopulated successfully")
        except Exception as reset_err:
            logger.error(f"Failed to reset ChromaDB: {str(reset_err)}")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(chat_sessions.router)

# Mount the uploads directory for static file serving
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/")
async def root():
    return {"message": "Welcome to the MECON Chatbot API"}

@app.post("/init-chroma-db")
async def initialize_chroma_db():
    """Initialize and populate ChromaDB with existing chat data."""
    from app.utils.populate_chroma import populate_chroma_db
    success = populate_chroma_db()
    if success:
        return {"message": "ChromaDB successfully populated with existing chat data"}
    else:
        return {"message": "Error populating ChromaDB"}, 500
