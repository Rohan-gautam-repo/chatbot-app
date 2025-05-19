"""ChromaDB utility for managing vector embeddings for faster chat responses."""
import chromadb
from chromadb.utils import embedding_functions
import os
import shutil
import logging
import time
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
                try:
                    # Attempt to gracefully close client if possible
                    if hasattr(self.client, 'close'):
                        self.client.close()
                except:
                    pass
                    
                del self.client
                
            # Remove the existing directory
            if os.path.exists(self.persist_directory):
                # Try a safer approach - first check if it's actually a ChromaDB directory
                if os.path.exists(os.path.join(self.persist_directory, "chroma.sqlite3")):
                    shutil.rmtree(self.persist_directory)
                    logger.info(f"Removed existing ChromaDB directory: {self.persist_directory}")
                else:
                    logger.warning(f"Directory {self.persist_directory} doesn't appear to be a valid ChromaDB directory, creating a new one instead")
                    # Create a backup of the old directory just in case
                    backup_dir = f"{self.persist_directory}_backup_{int(time.time())}"
                    shutil.move(self.persist_directory, backup_dir)
                    logger.info(f"Backed up existing directory to {backup_dir}")
                
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
        try:
            # Validate inputs
            if not message or not response:
                logger.warning(f"Empty message or response for user_id={user_id}, session_id={session_id}")
                return
                
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
                ids=[document_id]
            )
            logger.debug(f"Successfully added chat entry to ChromaDB for user_id={user_id}, session_id={session_id}")
        except Exception as e:
            logger.error(f"Failed to add chat entry to ChromaDB: {str(e)}")
            # Don't raise to prevent breaking the application flow
            # The SQL database still has the chat history
    
    def get_relevant_context(self, user_id: int, session_id: int, query: str, limit: int = 5):
        """Retrieve the most relevant context based on the user's query."""
        try:
            if not query or not query.strip():
                logger.warning(f"Empty query received for user_id={user_id}, session_id={session_id}")
                return []
                
            # Use $and operator to combine conditions according to ChromaDB's query format
            results = self.chat_collection.query(
                query_texts=[query],
                where={"$and": [
                    {"user_id": str(user_id)},
                    {"session_id": str(session_id)}
                ]},
                n_results=limit
            )
            
            if not results or not results.get("documents"):
                logger.info(f"No matching documents found for query from user_id={user_id}, session_id={session_id}")
                return []
                
            return results["documents"][0] if results["documents"] else []
        except Exception as e:
            logger.error(f"ChromaDB query error: {str(e)}")
            # Return empty list on error to allow fallback mechanism
            return []
    
    def batch_add_chats(self, chats: List[Dict[str, Any]]):
        """Add multiple chat entries in a batch for initial loading."""
        if not chats:
            logger.info("No chats provided for batch adding, skipping")
            return
        
        try:
            documents = []
            metadatas = []
            ids = []
            
            for chat in chats:
                # Validate required fields are present
                if not all(k in chat for k in ["user_id", "session_id", "message", "response"]):
                    logger.warning(f"Skipping invalid chat entry: {chat}")
                    continue
                    
                document_id = f"chat_{chat['user_id']}_{chat['session_id']}_{uuid.uuid4()}"
                full_document = f"User: {chat['message']}\nAI: {chat['response']}"
                
                documents.append(full_document)
                metadatas.append({
                    "user_id": str(chat["user_id"]),
                    "session_id": str(chat["session_id"]),
                    "type": "chat"
                })
                ids.append(document_id)
            
            if documents:  # Only add if we have valid documents
                self.chat_collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                logger.debug(f"Added {len(documents)} documents to ChromaDB in batch")
            else:
                logger.warning("No valid documents found in batch to add to ChromaDB")
                
        except Exception as e:
            logger.error(f"Error in batch_add_chats: {str(e)}")
            # Continue execution, don't raise to avoid breaking the application
    
    def reset_collection(self):
        """Reset the collection by deleting and recreating it."""
        try:
            self.client.delete_collection("chat_history")
            logger.info("Successfully deleted existing 'chat_history' collection")
        except Exception as e:
            logger.warning(f"Error deleting collection (may not exist yet): {str(e)}")
        
        # Create a fresh collection
        self.chat_collection = self.client.get_or_create_collection(
            name="chat_history",
            embedding_function=self.embedding_function,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info("Successfully created new 'chat_history' collection")

# Create a singleton instance
chroma_db = ChromaDBUtil()
