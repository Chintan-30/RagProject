from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat_router, indexing_router
from app.utils.logger import logger

def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    app = FastAPI(
        title="RagChat API",
        description="Chat with your PDF documents using RAG and AI",
        version="1.0.0"
    )

    # Enable CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure properly for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(chat_router.router)
    app.include_router(indexing_router.router)

    @app.get("/", response_model=dict)
    async def root():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "message": "RagChat API is running",
            "version": "1.0.0"
        }

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting RagChat API server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
