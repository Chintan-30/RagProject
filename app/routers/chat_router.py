from fastapi import APIRouter, HTTPException
from app.models.chat_models import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.utils.qdrant_client import get_qdrant_client
from app.utils.logger import logger

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

chat_service = ChatService()

@router.post("", response_model=ChatResponse)
async def chat_with_pdf(request: ChatRequest):
    """Chat with a specific PDF collection"""
    try:
        # Check if collection exists
        client = get_qdrant_client()
        try:
            client.get_collection(request.collection_name)
        except Exception:
            raise HTTPException(
                status_code=404, 
                detail=f"Collection '{request.collection_name}' not found"
            )

        # Get answer from service
        answer, search_results = await chat_service.get_answer(
            query=request.query,
            collection_name=request.collection_name,
            max_results=request.max_results,
            model=request.model
        )

        if not answer:
            raise HTTPException(
                status_code=404,
                detail="No relevant information found for this query"
            )

        return ChatResponse(
            answer=answer,
            query=request.query,
            collection_name=request.collection_name,
            search_results=search_results,
            model_used=request.model
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{collection_name}/sample")
async def get_sample_questions(collection_name: str, limit: int = 3):
    """Get sample questions that can be asked about a collection"""
    try:
        # Check if collection exists
        client = get_qdrant_client()
        try:
            client.get_collection(collection_name)
        except:
            raise HTTPException(
                status_code=404, 
                detail=f"Collection '{collection_name}' not found"
            )

        questions = await chat_service.get_sample_questions(collection_name, limit)
        return {"questions": questions}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting sample questions: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate sample questions: {str(e)}"
        )
