from pydantic import BaseModel
from typing import List

class UploadResponse(BaseModel):
    message: str
    collection_name: str
    document_count: int
    chunk_count: int

class CollectionInfo(BaseModel):
    name: str
    vectors_count: int

class CollectionsResponse(BaseModel):
    collections: List[CollectionInfo]
