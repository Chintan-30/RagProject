from pydantic import BaseModel, Field
from typing import List, Optional,Union

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="User's question")
    collection_name: str = Field(..., description="Name of the PDF collection to search")
    max_results: int = Field(default=4, ge=1, le=10, description="Maximum number of search results")
    model: str = Field(default="gpt-4.1", description="OpenAI model to use")

class SearchResult(BaseModel):
    page_content: str
    page_number: Optional[Union[int, str]] = None
    source: Optional[str] = None
    score: Optional[float] = None

class ChatResponse(BaseModel):
    answer: str
    query: str
    collection_name: str
    search_results: List[SearchResult]
    model_used: str
