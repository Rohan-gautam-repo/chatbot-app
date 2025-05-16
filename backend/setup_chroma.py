# This script installs dependencies for ChromaDB and initializes the database
import subprocess
import sys
import os
import logging
import shutil

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    try:
        logger.info("Installing ChromaDB dependencies...")
        # Install dependencies
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements_chroma.txt"])
        
        # Ensure latest version of chromadb
        logger.info("Upgrading ChromaDB to latest version...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "chromadb"])
        
        # Clean up any existing ChromaDB data
        chroma_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
        if os.path.exists(chroma_dir):
            logger.info(f"Removing existing ChromaDB directory: {chroma_dir}")
            shutil.rmtree(chroma_dir)
        
        # Initialize the database
        logger.info("Initializing ChromaDB...")
        subprocess.check_call([sys.executable, "-c", "from app.utils.populate_chroma import populate_chroma_db; populate_chroma_db()"])
        
        logger.info("ChromaDB setup completed successfully!")
    except Exception as e:
        logger.error(f"Error setting up ChromaDB: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
