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
import json


class IndexingService:
    def __init__(self):
        self.embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")

    async def process_pdf(self, file_content: bytes, filename: str, collection_name: str, 
                         chunk_size: int = 1000, chunk_overlap: int = 400):
        """Process and index a PDF document"""
        temp_pdf_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{filename}"
        
        try:
            # Save file temporarily
            with open(temp_pdf_path, "wb") as f:
                f.write(file_content)
            
            if collection_name == 'default':
                final_collection_name = self.sanitize_collection_name(filename)
            else:
                final_collection_name = collection_name
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
            
            # DEBUG: Print collection name and document info
            logger.info(f"Final collection name: {final_collection_name}")
            logger.info(f"Number of documents to store: {len(split_docs)}")
            logger.info(f"Sample document metadata: {split_docs[0].metadata if split_docs else 'None'}")
            
            # RECOMMENDED APPROACH: Use direct client method
            try:
                from qdrant_client import QdrantClient
                client = QdrantClient(url=QDRANT_URL)
                
                # Create vector store instance with specific collection
                vector_store = QdrantVectorStore(
                    client=client,
                    collection_name=final_collection_name,
                    embedding=self.embedding_model,
                )
                
                # Add documents to the specific collection
                vector_store.add_documents(documents=split_docs)
                logger.info(f"Documents added to collection '{final_collection_name}' using direct method")
                
            except Exception as e:
                logger.error(f"Error with direct client approach: {str(e)}")
                # Fallback to from_documents method
                logger.info("Falling back to from_documents method")
                vector_store = QdrantVectorStore.from_documents(
                    documents=split_docs,
                    embedding=self.embedding_model,
                    url=QDRANT_URL,
                    collection_name=final_collection_name,
                    force_recreate=False,
                )
            
            logger.info(f"Successfully indexed {len(docs)} pages into {len(split_docs)} chunks in collection '{final_collection_name}'")
            
            # Verify the collection was created correctly
            try:
                from qdrant_client import QdrantClient
                client = QdrantClient(url=QDRANT_URL)
                collections = client.get_collections()
                collection_names = [col.name for col in collections.collections]
                logger.info(f"Available collections: {collection_names}")
                
                if final_collection_name in collection_names:
                    collection_info = client.get_collection(final_collection_name)
                    logger.info(f"Collection '{final_collection_name}' has {collection_info.points_count} points")
                else:
                    logger.warning(f"Collection '{final_collection_name}' not found in available collections!")
                    
            except Exception as e:
                logger.warning(f"Could not verify collection creation: {str(e)}")
            
            return final_collection_name, len(docs), len(split_docs)
            
        finally:
            # Clean up temporary file
            if temp_pdf_path.exists():
                try:
                    temp_pdf_path.unlink()
                    logger.info(f"Cleaned up temporary file: {temp_pdf_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean up temporary file {temp_pdf_path}: {str(e)}")

    def sanitize_collection_name(self, filename: str) -> str:
        """
        Simple sanitization: replace spaces with underscore, keep only alphanumeric and underscore
        """
        import re
        
        # Convert to lowercase
        name = filename.lower()
        
        # Remove .pdf extension if present
        if name.endswith('.pdf'):
            name = name[:-4]
        
        # Replace spaces with underscore, remove everything else except alphanumeric and underscore
        name = re.sub(r'[^a-z0-9_]', '_', name)
        
        return name
    
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
        """Get full information about a specific collection with robust error handling"""
        client = get_qdrant_client()
        info = client.get_collection(collection_name)

        # Convert to dictionary (Qdrant client usually returns Pydantic models / dataclasses)
        if hasattr(info, "dict"):  # If it's a Pydantic model
            return info.dict()
        elif hasattr(info, "model_dump"):  # For Pydantic v2
            return info.model_dump()
        else:
            # As a fallback, cast to str (or jsonable dict if available)
            return json.loads(info.json()) if hasattr(info, "json") else info
