from pathlib import Path
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Base Configuration
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# API Configuration
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
QDRANT_URL = os.getenv("QDRANT_URL")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Model Configuration
CHAT_MODEL_NAME = "gemini-2.5-flash"
EMBEDDING_MODEL_NAME = "models/text-embedding-004"


# Validate environment variables
if not QDRANT_URL:
    raise ValueError("QDRANT_URL environment variable is required")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is required")
