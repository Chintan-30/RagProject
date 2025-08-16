from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional
from app.models.indexing_models import UploadResponse, CollectionsResponse
from app.services.indexing_service import IndexingService
from app.config import MAX_FILE_SIZE
from app.utils.logger import logger

router = APIRouter(
    prefix="/indexing",
    tags=["indexing"]
)

indexing_service = IndexingService()

@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    collection_name: Optional[str] = Query(None, description="Custom collection name (optional)"),
    chunk_size: int = Query(1000, ge=100, le=2000, description="Text chunk size"),
    chunk_overlap: int = Query(400, ge=0, le=500, description="Text chunk overlap")
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
        collection_name, doc_count, chunk_count = await indexing_service.process_pdf(
            file_content=contents,
            filename=file.filename,
            collection_name=collection_name,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        
        return UploadResponse(
            message="Document successfully indexed",
            collection_name=collection_name,
            document_count=doc_count,
            chunk_count=chunk_count
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
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
