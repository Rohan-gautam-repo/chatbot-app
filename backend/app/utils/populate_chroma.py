"""Script to initialize and populate ChromaDB with existing chat data."""
from app.utils.chroma_db import chroma_db
from app.database.db import SessionLocal
from app.models.user import Chat
from sqlalchemy.orm import Session
import logging
from app.config.dataset_config import DATASET_PATH  # Import dataset config

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def populate_chroma_db():
    """Populate ChromaDB with existing chat data from the SQL database."""
    db = SessionLocal()
    try:
        logger.info("Starting to populate ChromaDB with existing chat data...")
        
        # Reset the collection to start fresh
        chroma_db.reset_collection()
        
        # Get all chats from the database
        chats = db.query(Chat).all()
        
        # Convert to list of dictionaries for batch processing
        chat_dicts = []
        for chat in chats:
            chat_dicts.append({
                "user_id": chat.user_id,
                "session_id": chat.session_id,
                "message": chat.message,
                "response": chat.response
            })
        
        # Process in batches of 100
        batch_size = 100
        for i in range(0, len(chat_dicts), batch_size):
            batch = chat_dicts[i:i + batch_size]
            chroma_db.batch_add_chats(batch)
            logger.info(f"Processed {i + len(batch)} of {len(chat_dicts)} chats...")
        
        logger.info(f"Successfully populated ChromaDB with {len(chat_dicts)} chat entries.")
        return True
    except Exception as e:
        logger.error(f"Error populating ChromaDB: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    populate_chroma_db()
