from fastapi import APIRouter
from app.utils.ingest_rag_dataset import ingest_dataset_to_chromadb
from fastapi.responses import JSONResponse
from app.config.dataset_config import DATASET_PATH
import os

router = APIRouter(prefix="/dataset", tags=["Dataset Management"])

@router.post("/ingest")
def ingest_dataset(dataset_path: str = None):
    """
    Ingest a CSV dataset into ChromaDB for RAG. If no path is provided, uses the default from config.
    """
    path = dataset_path or DATASET_PATH
    success = ingest_dataset_to_chromadb(path)
    if success:
        return {"message": f"Dataset at {os.path.basename(path)} ingested into ChromaDB."}
    return JSONResponse(status_code=400, content={"message": f"Failed to ingest dataset at {path}."})
