#!/usr/bin/env python
"""Script to reset and repopulate the ChromaDB database."""
import os
import shutil
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def reset_chroma():
    """Remove the ChromaDB directory and repopulate it with data."""
    try:
        # Path to the ChromaDB directory
        chroma_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
        
        # Check if directory exists
        if os.path.exists(chroma_dir):
            logger.info(f"Removing ChromaDB directory: {chroma_dir}")
            shutil.rmtree(chroma_dir)
        
        # Import and run the populate function
        logger.info("Repopulating ChromaDB...")
        from app.utils.populate_chroma import populate_chroma_db
        success = populate_chroma_db()
        
        if success:
            logger.info("ChromaDB reset and repopulation completed successfully")
        else:
            logger.error("ChromaDB repopulation failed")
            return False
            
        return True
    except Exception as e:
        logger.error(f"Error resetting ChromaDB: {str(e)}")
        return False

if __name__ == "__main__":
    if reset_chroma():
        sys.exit(0)
    else:
        sys.exit(1)
