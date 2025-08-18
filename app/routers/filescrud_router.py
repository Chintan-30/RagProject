from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import logging
from sqlalchemy import select
from fastapi.responses import StreamingResponse
import os
from urllib.parse import unquote
import mimetypes


# Import your DBService
from app.services.dbservices import Document, get_db_service, DBService

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/files", tags=["files"])

# Pydantic models for response
class DocumentResponse(BaseModel):
    id: str
    collection_name: str
    filename: str
    document_count: int
    chunk_count: int
    file_size: Optional[int]
    upload_date: datetime
    storage_path: Optional[str]

    class Config:
        from_attributes = True

class DocumentListResponseDto(BaseModel):
    doc_details: List[DocumentResponse]
    TotalRecords: int
    
# API Endpoints

@router.get("/", response_model=DocumentListResponseDto)
async def get_all_documents(
    page_number: int = Query(1, ge=1, description="Page number (starts from 1)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of documents per page"),
    db_service: DBService = Depends(get_db_service)
):
    """Get all documents with pagination"""
    try:
        # Calculate offset
        offset = (page_number - 1) * page_size
        
        # Get documents with pagination
        docs = await db_service.get_all_documents_paginated(limit=page_size, offset=offset)
        total_count = await db_service.count_all_documents()
        
        return DocumentListResponseDto(
            doc_details=[DocumentResponse.from_orm(doc) for doc in docs],
            TotalRecords=total_count
        )
    except Exception as e:
        logger.error(f"Error fetching documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")

@router.get("/blob")
async def get_file_blob_stream(path: str = Query(...)):
    print(f"XXXXXXXXXXXXXReceived path: {path}")  # Debug print
    # Decode the file path
    file_path = unquote(path)
    
    # Extract only the filename from the path
    filename = os.path.basename(file_path)
    
    # Construct the full path - use forward slashes or raw string
    full_path = f"C:/filestorage/ragchat/{filename}"
    # OR use os.path.normpath to handle path separators
    # full_path = os.path.normpath(os.path.join("C:/", "filestorage", "ragchat", filename))
    
    print(f"Looking for file: {full_path}")  # Debug print
    
    # Check if file exists
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if it's actually a file
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="Path is not a file")
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(full_path)
    if not content_type:
        content_type = "application/pdf"
    
    # Generator function to stream file
    def file_generator():
        with open(full_path, "rb") as file:
            while chunk := file.read(8192):  # Read in 8KB chunks
                yield chunk
    
    # Get file size for Content-Length header
    file_size = os.path.getsize(full_path)
    
    return StreamingResponse(
        file_generator(),
        media_type=content_type,
        headers={
            "Content-Length": str(file_size),
            "Content-Disposition": f"inline; filename={os.path.basename(full_path)}"
        }
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document_by_id(
    document_id: str,
    db_service: DBService = Depends(get_db_service)
):
    """Get a specific document by ID"""
    try:
        doc = await db_service.get_document_by_id(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return DocumentResponse.from_orm(doc)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching document: {str(e)}")

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db_service: DBService = Depends(get_db_service)
):
    """Delete a document by ID"""
    try:
        success = await db_service.delete_document(document_id)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": f"Document {document_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

# Add this method to your DBService class if not already present:

async def get_document_by_id(self, document_id: str):
    """Get document by ID"""
    if not self.async_session:
        raise Exception("Database not initialized. Call init_db() first.")
        
    async with self.async_session() as session:
        result = await session.execute(
            select(Document).where(Document.id == document_id)
        )
        return result.scalars().first()
    
