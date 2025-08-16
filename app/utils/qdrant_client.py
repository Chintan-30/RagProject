from qdrant_client import QdrantClient
from app.config import QDRANT_URL
from app.utils.logger import logger

def get_qdrant_client() -> QdrantClient:
    """Get a configured Qdrant client instance"""
    try:
        client = QdrantClient(url=QDRANT_URL)
        return client
    except Exception as e:
        logger.error(f"Failed to create Qdrant client: {str(e)}")
        raise
