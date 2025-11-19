from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional
from app.models.indexing_models import UploadResponse, CollectionsResponse
from app.services.dbservices import Document,DBService, get_db_service
from app.services.indexing_service import IndexingService
from app.config import MAX_FILE_SIZE, CHAT_MODEL_NAME
from app.utils.logger import logger
from pathlib import Path
import uuid
from datetime import datetime
import mimetypes

router = APIRouter(
    prefix="/indexing",
    tags=["indexing"]
)

indexing_service = IndexingService()


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    collection_name: Optional[str] = Query(None, description="Custom collection name (optional)"),
    chunk_size: int = Query(1000, ge=100, le=2000, description="Text chunk size for PDFs"),
    chunk_overlap: int = Query(400, ge=0, le=500, description="Text chunk overlap for PDFs"),
    db_service: DBService = Depends(get_db_service)
):
    """Upload and index a PDF or image document"""
    
    # Validate file type
    file_type, _ = mimetypes.guess_type(file.filename)
    if file_type not in ["application/pdf", "image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only PDF, JPEG, PNG, and WEBP files are allowed.")

    # Read and validate file size
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="File is empty.")
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
        
        if file_type == "application/pdf":
            # Process the PDF using your indexing service
            collection_name, doc_count, chunk_count = await indexing_service.process_pdf(
                file_content=contents,
                filename=file.filename,
                collection_name=collection_name,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
            file_type_for_db = "pdf"
        else: # It's an image
            # Get image description
            description = await indexing_service.process_image(contents, file.filename, collection_name)
            
            # Embed the description
            # collection_name, doc_count, chunk_count = await indexing_service.process_text(
            #     text=description,
            #     filename=file.filename,
            #     collection_name=collection_name
            # )
            file_type_for_db = "image"
            collection_name, doc_count, chunk_count = description # description now returns collection_name, doc_count, chunk_count

        # Insert document record into database with file path
        document_id = await db_service.insert_document(
            collection_name=collection_name,
            filename=file.filename,
            file_type=file_type_for_db,
            storage_path=str(file_path),
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
        logger.error(f"Error processing file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    
    
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
