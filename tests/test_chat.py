import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chat_endpoint_validation():
    """Test input validation for chat endpoint"""
    response = client.post("/chat", json={
        "query": "",  # Empty query should fail
        "collection_name": "test_collection",
        "max_results": 4
    })
    assert response.status_code == 422  # Validation error

    response = client.post("/chat", json={
        "query": "test query",
        "collection_name": "test_collection",
        "max_results": 20  # Too high, should fail
    })
    assert response.status_code == 422

def test_chat_nonexistent_collection():
    """Test chat with non-existent collection"""
    response = client.post("/chat", json={
        "query": "test query",
        "collection_name": "nonexistent_collection",
        "max_results": 4
    })
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
