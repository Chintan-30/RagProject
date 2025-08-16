import logging

def setup_logger():
    """Configure and return a logger instance"""
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    return logger

logger = setup_logger()
