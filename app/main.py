from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import logging

from app.routers import chat_router, indexing_router, filescrud_router
from app.utils.logger import logger
from app.services.dbservices import DBService

# Global DB service instance
db_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global db_service
    
    # Startup
    logger.info("🚀 Starting RagChat API server...")
    try:
        db_service = DBService()
        await db_service.init_db()
        
        # Test connection
        connection_ok = await db_service.test_connection()
        if not connection_ok:
            raise Exception("Database connection test failed")
            
        logger.info("✅ Application startup completed - Database initialized and tested")
        
    except Exception as e:
        logger.error(f"❌ Error during startup: {str(e)}")
        logger.error("🔧 Possible fixes:")
        logger.error("   1. Make sure MySQL server is running")
        logger.error("   2. Check your database credentials in .env file")
        logger.error("   3. Ensure MySQL user has sufficient privileges")
        raise
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("🔄 Application shutting down...")
    if db_service:
        await db_service.close()
    logger.info("✅ Application shutdown completed")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    app = FastAPI(
        title="RagChat API",
        description="Chat with your PDF documents using RAG and AI",
        version="1.0.0",
        lifespan=lifespan  # Use lifespan instead of startup/shutdown events
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
    app.include_router(filescrud_router.router)

    @app.get("/", response_model=dict)
    async def root():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "message": "RagChat API is running",
            "version": "1.0.0"
        }

    @app.get("/health")
    async def health_check():
        """Detailed health check"""
        try:
            global db_service
            db_status = "disconnected"
            
            if db_service:
                connection_ok = await db_service.test_connection()
                db_status = "connected" if connection_ok else "connection_failed"
            
            return {
                "status": "healthy" if db_status == "connected" else "degraded",
                "timestamp": datetime.utcnow().isoformat(),
                "version": "1.0.0",
                "database": db_status
            }
        except Exception as e:
            logger.error(f"Health check error: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "database": "error"
            }

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger.info("🚀 Starting RagChat API server...")
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )