from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional
from app.models.indexing_models import UploadResponse, CollectionsResponse
from app.services.dbservices import Document,DBService, get_db_service
from app.services.indexing_service import IndexingService
from app.config import MAX_FILE_SIZE
from app.utils.logger import logger
from pathlib import Path
import uuid
from datetime import datetime

router = APIRouter(
    prefix="/indexing",
    tags=["indexing"]
)

indexing_service = IndexingService()

async def get_db_service() -> DBService:
    """Get the global database service instance"""
    from app.main import db_service
    if db_service is None:
        raise HTTPException(status_code=503, detail="Database service not initialized")
    return db_service


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    collection_name: Optional[str] = Query(None, description="Custom collection name (optional)"),
    chunk_size: int = Query(1000, ge=100, le=2000, description="Text chunk size"),
    chunk_overlap: int = Query(400, ge=0, le=500, description="Text chunk overlap"),
    db_service: DBService = Depends(get_db_service)
):
    """Upload and index a PDF document"""
    
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # Read and validate file size
    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File size exceeds {MAX_FILE_SIZE / (1024*1024):.1f} MB limit."
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    try:
        # Create storage directory if it doesn't exist
        storage_dir = Path("/filestorage/ragchat")
        storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename to avoid conflicts
        timestamp = datetime.now().strftime("%Y%m%d")
        file_extension = Path(file.filename).suffix
        base_filename = Path(file.filename).stem
        unique_filename = f"{base_filename}_{timestamp}{file_extension}"
        
        # Full file path
        file_path = storage_dir / unique_filename
        
        # Save file to filesystem
        with open(file_path, "wb") as f:
            f.write(contents)
        
        logger.info(f"File saved to: {file_path}")
        
        # Process the PDF using your indexing service
        collection_name, doc_count, chunk_count = await indexing_service.process_pdf(
            file_content=contents,
            filename=file.filename,
            collection_name=collection_name,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        
        # Insert document record into database with file path
        document_id = await db_service.insert_document(
            collection_name=collection_name,
            filename=file.filename,
            storage_path=str(file_path),         # Store full file path
            document_count=doc_count,
            chunk_count=chunk_count,
            file_size=len(contents)
        )

        logger.info(f"Successfully processed and stored document {file.filename} with ID {document_id}")

        return UploadResponse(
            message="Document successfully indexed and saved",
            collection_name=collection_name,
            document_count=doc_count,
            chunk_count=chunk_count,
            file_path=str(file_path)  # Include file path in response if needed
        )
        
    except OSError as e:
        # Clean up file if it was created but DB operation failed
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        logger.error(f"File system error for {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File storage error: {str(e)}")
        
    except ValueError as e:
        # Clean up file if it was created but processing failed
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        # Clean up file if it was created but something went wrong
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        logger.error(f"Error processing PDF {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    
    
@router.get("/collections", response_model=CollectionsResponse)
async def list_collections():
    """List all collections in Qdrant"""
    try:
        collections = await indexing_service.list_collections()
        return CollectionsResponse(collections=collections)
    except Exception as e:
        logger.error(f"Failed to list collections: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list collections: {str(e)}")


@router.delete("/collections/{collection_name}")
async def delete_collection(collection_name: str):
    """Delete a specific collection from Qdrant"""
    try:
        await indexing_service.delete_collection(collection_name)
        return JSONResponse(
            content={"message": f"Collection '{collection_name}' successfully deleted"}, 
            status_code=200
        )
    except Exception as e:
        logger.error(f"Failed to delete collection {collection_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete collection: {str(e)}")


@router.get("/collections/{collection_name}")
async def get_collection_info(collection_name: str):
    """Get information about a specific collection"""
    try:
        info = await indexing_service.get_collection_info_robust(collection_name)
        return info
    except Exception as e:
        logger.error(f"Failed to get collection info for {collection_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get collection info: {str(e)}")
