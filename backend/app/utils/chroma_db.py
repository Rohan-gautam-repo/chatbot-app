"""ChromaDB utility for managing vector embeddings for faster chat responses."""
import chromadb
from chromadb.utils import embedding_functions
import os
import shutil
import logging
from typing import List, Dict, Any, Optional
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ChromaDBUtil:
    def __init__(self, persist_directory: str = "./chroma_db"):
        """Initialize ChromaDB with the specified persistence directory."""
        self.persist_directory = persist_directory
        os.makedirs(persist_directory, exist_ok=True)
        
        # Use the default embedding function (all-MiniLM-L6-v2)
        self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
        
        try:
            # Try to initialize the client
            self.client = chromadb.PersistentClient(path=persist_directory)
            
            # Create collections for chat context and responses
            self.chat_collection = self.client.get_or_create_collection(
                name="chat_history",
                embedding_function=self.embedding_function,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("ChromaDB initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing ChromaDB: {str(e)}")
            logger.info("Attempting to reset and recreate ChromaDB...")
            self._recreate_chroma_db()
            
    def _recreate_chroma_db(self):
        """Remove and recreate the ChromaDB directory if there are database issues."""
        try:
            # Close any existing client connections
            if hasattr(self, 'client'):
                del self.client
                
            # Remove the existing directory
            if os.path.exists(self.persist_directory):
                shutil.rmtree(self.persist_directory)
                logger.info(f"Removed existing ChromaDB directory: {self.persist_directory}")
                
            # Recreate the directory
            os.makedirs(self.persist_directory, exist_ok=True)
            
            # Initialize a new client
            self.client = chromadb.PersistentClient(path=self.persist_directory)
            
            # Create a fresh collection
            self.chat_collection = self.client.get_or_create_collection(
                name="chat_history",
                embedding_function=self.embedding_function,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("ChromaDB recreated successfully")
        except Exception as e:
            logger.error(f"Failed to recreate ChromaDB: {str(e)}")
            raise
    
    def add_chat_entry(self, user_id: int, session_id: int, message: str, response: str):
        """Add a chat entry (user message and AI response) to the collection."""
        # Create a unique ID for this chat entry
        document_id = f"chat_{user_id}_{session_id}_{uuid.uuid4()}"
        
        # Store both the message and response as a document
        full_document = f"User: {message}\nAI: {response}"
        
        # Add to collection
        self.chat_collection.add(
            documents=[full_document],
            metadatas=[{
                "user_id": str(user_id),
                "session_id": str(session_id),
                "type": "chat"
            }],
            ids=[document_id]        )
    
    def get_relevant_context(self, user_id: int, session_id: int, query: str, limit: int = 5):
        """Retrieve the most relevant context based on the user's query."""
        try:
            # Use $and operator to combine conditions according to ChromaDB's query format
            results = self.chat_collection.query(
                query_texts=[query],
                where={"$and": [
                    {"user_id": str(user_id)},
                    {"session_id": str(session_id)}
                ]},
                n_results=limit
            )
            
            return results["documents"][0] if results["documents"] else []
        except Exception as e:
            logger.error(f"ChromaDB query error: {str(e)}")
            # Return empty list on error to allow fallback mechanism
            return []
    
    def batch_add_chats(self, chats: List[Dict[str, Any]]):
        """Add multiple chat entries in a batch for initial loading."""
        if not chats:
            return
        
        documents = []
        metadatas = []
        ids = []
        
        for chat in chats:
            document_id = f"chat_{chat['user_id']}_{chat['session_id']}_{uuid.uuid4()}"
            full_document = f"User: {chat['message']}\nAI: {chat['response']}"
            
            documents.append(full_document)
            metadatas.append({
                "user_id": str(chat["user_id"]),
                "session_id": str(chat["session_id"]),
                "type": "chat"
            })
            ids.append(document_id)
        
        self.chat_collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
    
    def reset_collection(self):
        """Reset the collection by deleting and recreating it."""
        try:
            self.client.delete_collection("chat_history")
        except:
            pass
        
        self.chat_collection = self.client.get_or_create_collection(
            name="chat_history",
            embedding_function=self.embedding_function,
            metadata={"hnsw:space": "cosine"}
        )

# Create a singleton instance
chroma_db = ChromaDBUtil()
