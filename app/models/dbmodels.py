from sqlalchemy import Column, Integer, String, DateTime, func
from app.services.dbservices import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    collection_name = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    document_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
