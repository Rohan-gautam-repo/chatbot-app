"""
RAG dataset ingestion utility for ChromaDB.
Allows ingestion of any CSV dataset for domain-specific Q&A.
"""
import pandas as pd
from app.utils.chroma_db import chroma_db
from app.config.dataset_config import DATASET_PATH
import logging
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def chunk_text(text, chunk_size=300):
    """Split text into chunks of approximately chunk_size characters."""
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def ingest_dataset_to_chromadb(dataset_path=None):
    """
    Ingests a CSV dataset into ChromaDB for RAG.
    Each row is chunked and embedded for retrieval.
    """
    path = dataset_path or DATASET_PATH
    if not os.path.exists(path):
        logger.error(f"Dataset file not found: {path}")
        return False
    df = pd.read_csv(path)
    required_cols = {'issue/query', 'response'}
    if not required_cols.issubset(df.columns):
        logger.error(f"Dataset must contain columns: {required_cols}")
        return False
    chroma_db.reset_collection()
    batch = []
    for idx, row in df.iterrows():
        issue = str(row['issue/query'])
        response = str(row['response'])
        for chunk in chunk_text(issue):
            batch.append({
                'user_id': 'rag',
                'session_id': 'rag',
                'message': chunk,
                'response': response
            })
        if len(batch) >= 100:
            chroma_db.batch_add_chats(batch)
            batch = []
    if batch:
        chroma_db.batch_add_chats(batch)
    logger.info(f"Ingested dataset from {path} into ChromaDB.")
    return True

if __name__ == "__main__":
    ingest_dataset_to_chromadb()
