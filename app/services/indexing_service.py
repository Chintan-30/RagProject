import uuid
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from app.config import UPLOAD_DIR
from app.utils.qdrant_client import get_qdrant_client
from app.utils.logger import logger
from app.config import QDRANT_URL


class IndexingService:
    def __init__(self):
        self.embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")

    def sanitize_collection_name(self, filename: str) -> str:
        """Create a valid collection name from filename"""
        name = Path(filename).stem
        sanitized = "".join(c if c.isalnum() else "_" for c in name)
        if sanitized and not sanitized[0].isalpha() and sanitized[0] != "_":
            sanitized = f"doc_{sanitized}"
        return sanitized or f"doc_{uuid.uuid4().hex[:8]}"

    async def process_pdf(self, file_content: bytes, filename: str, collection_name: str = None, 
                         chunk_size: int = 1000, chunk_overlap: int = 400):
        """Process and index a PDF document"""
        temp_pdf_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{filename}"
        
        try:
            # Save file temporarily
            with open(temp_pdf_path, "wb") as f:
                f.write(file_content)
            
            final_collection_name = collection_name or self.sanitize_collection_name(filename)
            logger.info(f"Processing PDF: {filename} -> Collection: {final_collection_name}")
            
            # Load and process PDF
            loader = PyPDFLoader(file_path=str(temp_pdf_path))
            docs = loader.load()
            
            if not docs:
                raise ValueError("No content could be extracted from the PDF.")
            
            # Split documents
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size, 
                chunk_overlap=chunk_overlap
            )
            split_docs = text_splitter.split_documents(documents=docs)
            
            if not split_docs:
                raise ValueError("No text chunks could be created from the PDF.")
            
            # Store documents
            QdrantVectorStore.from_documents(
                documents=split_docs,
                embedding=self.embedding_model,
                url=QDRANT_URL,
                collection_name=final_collection_name,
            )
            
            logger.info(f"Successfully indexed {len(docs)} pages into {len(split_docs)} chunks")
            
            return final_collection_name, len(docs), len(split_docs)
            
        finally:
            # Clean up temporary file
            if temp_pdf_path.exists():
                try:
                    temp_pdf_path.unlink()
                    logger.info(f"Cleaned up temporary file: {temp_pdf_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean up temporary file {temp_pdf_path}: {str(e)}")

    async def list_collections(self):
        """List all collections in Qdrant"""
        client = get_qdrant_client()
        collections = client.get_collections().collections
        
        collection_info = []
        for col in collections:
            info = client.get_collection(col.name)
            collection_info.append({
                "name": col.name,
                "vectors_count": info.vectors_count or 0
            })
        
        return collection_info

    async def delete_collection(self, collection_name: str):
        """Delete a specific collection"""
        client = get_qdrant_client()
        client.delete_collection(collection_name=collection_name)
        logger.info(f"Deleted collection: {collection_name}")

    async def get_collection_info(self, collection_name: str):
        """Get information about a specific collection"""
        client = get_qdrant_client()
        info = client.get_collection(collection_name)

        vectors_config = info.config.params["vectors"]  # <- dict

        return {
            "name": collection_name,
            "vectors_count": info.vectors_count or 0,
            "config": {
                "vector_size": vectors_config["size"] if "size" in vectors_config else None,
                "distance": vectors_config["distance"].name if "distance" in vectors_config else None
            }
        }
    
    async def get_collection_info_robust(self, collection_name: str): 
        """Get information about a specific collection with robust error handling""" 
        client = get_qdrant_client() 
        info = client.get_collection(collection_name) 

        # Handle different possible vector configurations
        vectors_config = info.config.params.vectors
        
        # More defensive attribute access
        vector_size = None
        distance = None
        
        if hasattr(vectors_config, 'size'):
            vector_size = vectors_config.size
        elif hasattr(vectors_config, 'vector_size'):
            vector_size = vectors_config.vector_size
        
        if hasattr(vectors_config, 'distance'):
            distance = vectors_config.distance.name if hasattr(vectors_config.distance, 'name') else str(vectors_config.distance)
    
        return { 
            "name": collection_name, 
            "vectors_count": info.vectors_count or 0, 
            "config": { 
                "vector_size": vector_size, 
                "distance": distance 
            } 
        }