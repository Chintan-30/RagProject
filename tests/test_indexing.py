import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_collections():
    """Test listing collections endpoint"""
    response = client.get("/indexing/collections")
    assert response.status_code == 200
    assert "collections" in response.json()

def test_upload_validation():
    """Test PDF upload validation"""
    # Test non-PDF file
    response = client.post(
        "/indexing/upload",
        files={"file": ("test.txt", b"test content", "text/plain")}
    )
    assert response.status_code == 400
    assert "pdf" in response.json()["detail"].lower()

    # Test empty file
    response = client.post(
        "/indexing/upload",
        files={"file": ("test.pdf", b"", "application/pdf")}
    )
    assert response.status_code == 400
