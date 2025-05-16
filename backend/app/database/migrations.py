from sqlalchemy import text
from app.database.db import SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migrations():
    db = SessionLocal()
    try:
        # Check if chat_sessions table exists
        result = db.execute(text("SHOW TABLES LIKE 'chat_sessions'"))
        chat_sessions_exists = result.fetchone() is not None

        if not chat_sessions_exists:
            logger.info("Creating chat_sessions table")
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    title VARCHAR(100) DEFAULT 'New Chat',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    user_id INTEGER,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """))
            db.commit()
            logger.info("chat_sessions table created successfully")

        # Check if session_id column exists in chats table
        try:
            result = db.execute(text("SHOW COLUMNS FROM chats LIKE 'session_id'"))
            session_id_exists = result.fetchone() is not None
            
            if not session_id_exists:
                logger.info("Adding session_id column to chats table")
                db.execute(text("ALTER TABLE chats ADD COLUMN session_id INTEGER"))
                db.execute(text("ALTER TABLE chats ADD CONSTRAINT fk_chat_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id)"))
                db.commit()
                logger.info("session_id column added successfully")
            else:
                logger.info("session_id column already exists, no migration needed")
        except Exception as e:
            logger.error(f"Error checking/adding session_id column: {str(e)}")
            # Continue with other migrations even if this one fails
            
        # Check if attachments column exists in chats table
        try:
            result = db.execute(text("SHOW COLUMNS FROM chats LIKE 'attachments'"))
            attachments_exists = result.fetchone() is not None
            
            if not attachments_exists:
                logger.info("Adding attachments column to chats table")
                db.execute(text("ALTER TABLE chats ADD COLUMN attachments TEXT"))
                db.commit()
                logger.info("attachments column added successfully")
            else:
                logger.info("attachments column already exists, no migration needed")
        except Exception as e:
            logger.error(f"Error checking/adding attachments column: {str(e)}")
            
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_migrations()
