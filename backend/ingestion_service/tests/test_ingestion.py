"""
Unit tests for SuperPage Ingestion Service

Tests cover FirecrawlClient functionality and FastAPI endpoints
"""

import json
import os
import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
import requests

# Import modules to test
from firecrawl_client import (
    FirecrawlClient, 
    FirecrawlError, 
    FirecrawlAuthError, 
    FirecrawlRateLimitError,
    FirecrawlTimeoutError,
    extract_data
)
from main import app


class TestFirecrawlClient:
    """Test cases for FirecrawlClient class"""
    
    @pytest.fixture
    def mock_api_key(self, monkeypatch):
        """Fixture to set API key in environment"""
        monkeypatch.setenv("FIRECRAWL_API_KEY", "test_api_key_12345")
        return "test_api_key_12345"
    
    @pytest.fixture
    def client(self, mock_api_key):
        """Fixture to create FirecrawlClient instance"""
        return FirecrawlClient(api_key=mock_api_key)
    
    @pytest.fixture
    def sample_extract_response(self):
        """Sample response for extract API"""
        return {
            "success": True,
            "data": {
                "title": "Amazing Web3 Project",
                "funding_amount": 1000000,
                "team_size": 5,
                "description": "Revolutionary blockchain solution"
            },
            "metadata": {
                "url": "https://example.com",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }
    
    @pytest.fixture
    def sample_scrape_response(self):
        """Sample response for scrape API"""
        return {
            "success": True,
            "data": {
                "markdown": "# Amazing Project\n\nThis is a revolutionary blockchain solution...",
                "html": "<h1>Amazing Project</h1><p>This is a revolutionary blockchain solution...</p>",
                "content": "Amazing Project\n\nThis is a revolutionary blockchain solution..."
            }
        }
    
    @pytest.fixture
    def sample_crawl_response(self):
        """Sample response for crawl API"""
        return {
            "success": True,
            "jobId": "crawl_job_12345"
        }
    
    @pytest.fixture
    def sample_crawl_status_response(self):
        """Sample crawl status response"""
        return {
            "status": "completed",
            "data": [
                {
                    "url": "https://example.com",
                    "title": "Home Page",
                    "content": "Welcome to our amazing project"
                },
                {
                    "url": "https://example.com/about",
                    "title": "About Us",
                    "content": "Learn more about our team"
                }
            ]
        }
    
    def test_client_initialization_with_api_key(self):
        """Test client initialization with explicit API key"""
        client = FirecrawlClient(api_key="test_key")
        assert client.api_key == "test_key"
        assert client.base_url == "https://api.firecrawl.dev/v0"
    
    def test_client_initialization_from_env(self, mock_api_key):
        """Test client initialization from environment variable"""
        client = FirecrawlClient()
        assert client.api_key == mock_api_key
    
    def test_client_initialization_no_api_key(self, monkeypatch):
        """Test client initialization fails without API key"""
        monkeypatch.delenv("FIRECRAWL_API_KEY", raising=False)
        with pytest.raises(FirecrawlAuthError, match="Firecrawl API key is required"):
            FirecrawlClient()
    
    @patch('requests.Session.request')
    def test_extract_success(self, mock_request, client, sample_extract_response):
        """Test successful data extraction"""
        # Mock successful API response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_extract_response
        mock_request.return_value = mock_response
        
        # Test extraction
        schema = {
            "title": "string",
            "funding_amount": "number",
            "team_size": "number",
            "description": "string"
        }
        result = client.extract("https://example.com", schema)
        
        # Assertions
        assert result == sample_extract_response
        assert result["data"]["title"] == "Amazing Web3 Project"
        assert result["data"]["funding_amount"] == 1000000
        
        # Verify API call
        mock_request.assert_called_once()
        call_args = mock_request.call_args
        assert call_args[0][0] == "POST"  # HTTP method
        assert "/extract" in call_args[0][1]  # URL contains endpoint
        
        # Check payload
        payload = call_args[1]["json"]
        assert payload["url"] == "https://example.com"
        assert payload["extractorOptions"]["extractionSchema"] == schema
    
    @patch('requests.Session.request')
    def test_extract_auth_error(self, mock_request, client):
        """Test extraction with authentication error"""
        # Mock 401 response
        mock_response = Mock()
        mock_response.status_code = 401
        mock_request.return_value = mock_response
        
        schema = {"title": "string"}
        with pytest.raises(FirecrawlAuthError, match="Invalid API key"):
            client.extract("https://example.com", schema)
    
    @patch('requests.Session.request')
    def test_extract_rate_limit_error(self, mock_request, client):
        """Test extraction with rate limit error"""
        # Mock 429 response
        mock_response = Mock()
        mock_response.status_code = 429
        mock_request.return_value = mock_response
        
        schema = {"title": "string"}
        with pytest.raises(FirecrawlRateLimitError, match="Rate limit exceeded"):
            client.extract("https://example.com", schema)
    
    @patch('requests.Session.request')
    def test_scrape_success(self, mock_request, client, sample_scrape_response):
        """Test successful content scraping"""
        # Mock successful API response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_scrape_response
        mock_request.return_value = mock_response
        
        # Test scraping
        result = client.scrape("https://example.com", "markdown")
        
        # Assertions
        assert result == "# Amazing Project\n\nThis is a revolutionary blockchain solution..."
        
        # Verify API call
        mock_request.assert_called_once()
        call_args = mock_request.call_args
        assert call_args[0][0] == "POST"  # HTTP method
        assert "/scrape" in call_args[0][1]  # URL contains endpoint
    
    @patch('requests.Session.request')
    def test_crawl_success(self, mock_request, client, sample_crawl_response, sample_crawl_status_response):
        """Test successful domain crawling"""
        # Mock crawl initiation and status responses
        mock_responses = [
            Mock(status_code=200, json=lambda: sample_crawl_response),  # Start crawl
            Mock(status_code=200, json=lambda: sample_crawl_status_response)  # Status check
        ]
        mock_request.side_effect = mock_responses
        
        # Test crawling
        result = client.crawl("example.com", max_depth=1)
        
        # Assertions
        assert len(result) == 2
        assert result[0]["title"] == "Home Page"
        assert result[1]["title"] == "About Us"
        
        # Verify API calls
        assert mock_request.call_count == 2
    
    @patch('requests.Session.request')
    def test_crawl_timeout(self, mock_request, client, sample_crawl_response):
        """Test crawl job timeout"""
        # Mock crawl initiation
        mock_crawl_response = Mock()
        mock_crawl_response.status_code = 200
        mock_crawl_response.json.return_value = sample_crawl_response
        
        # Mock status response (always pending)
        mock_status_response = Mock()
        mock_status_response.status_code = 200
        mock_status_response.json.return_value = {"status": "pending"}
        
        mock_request.side_effect = [mock_crawl_response, mock_status_response]
        
        # Patch time.sleep to avoid actual waiting
        with patch('time.sleep'):
            with pytest.raises(FirecrawlTimeoutError):
                # Set very short timeout for testing
                original_timeout = client.__class__.__dict__.get('_crawl_timeout', 300)
                with patch.object(client, '_crawl_timeout', 0.1):
                    client.crawl("example.com")
    
    def test_context_manager(self, mock_api_key):
        """Test client as context manager"""
        with FirecrawlClient(api_key=mock_api_key) as client:
            assert client.api_key == mock_api_key
        # Client should be closed after context exit
    
    @patch('requests.Session.request')
    def test_convenience_function(self, mock_request, mock_api_key, sample_extract_response):
        """Test convenience extract_data function"""
        # Mock successful API response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_extract_response
        mock_request.return_value = mock_response
        
        schema = {"title": "string"}
        result = extract_data("https://example.com", schema, mock_api_key)
        
        assert result == sample_extract_response


class TestFastAPIEndpoints:
    """Test cases for FastAPI endpoints"""
    
    @pytest.fixture
    def test_client(self):
        """Fixture to create FastAPI test client"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_firecrawl_env(self, monkeypatch):
        """Mock environment variables for testing"""
        monkeypatch.setenv("FIRECRAWL_API_KEY", "test_api_key_12345")
        monkeypatch.setenv("MONGODB_URL", "mongodb://localhost:27017")
        monkeypatch.setenv("DATABASE_NAME", "test_superpage")
    
    def test_health_endpoint(self, test_client):
        """Test health check endpoint"""
        response = test_client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ingestion-service"
        assert data["version"] == "1.0.0"
        assert "firecrawl_configured" in data
        assert "mongodb_connected" in data
    
    @patch('main.firecrawl_client')
    def test_ingest_endpoint_success(self, mock_firecrawl_client, test_client, mock_firecrawl_env):
        """Test successful ingestion request"""
        # Mock firecrawl client
        mock_firecrawl_client.extract.return_value = {
            "data": {"title": "Test Project", "funding": 100000}
        }
        
        # Test request
        request_data = {
            "url": "https://example-web3-project.com",
            "schema": {
                "title": "string",
                "funding": "number"
            }
        }
        
        response = test_client.post("/ingest", json=request_data)
        
        # Assertions
        assert response.status_code == 202
        data = response.json()
        assert data["status"] == "accepted"
        assert data["message"] == "Ingestion job started successfully"
        assert "job_id" in data
        assert len(data["job_id"]) > 0  # UUID should be generated
    
    def test_ingest_endpoint_invalid_data(self, test_client):
        """Test ingestion with invalid request data"""
        # Missing required fields
        request_data = {
            "url": "https://example.com"
            # Missing schema
        }
        
        response = test_client.post("/ingest", json=request_data)
        assert response.status_code == 422  # Validation error
    
    def test_ingest_endpoint_no_api_key(self, test_client, monkeypatch):
        """Test ingestion without API key configured"""
        # Remove API key from environment
        monkeypatch.delenv("FIRECRAWL_API_KEY", raising=False)
        
        request_data = {
            "url": "https://example.com",
            "schema": {"title": "string"}
        }
        
        response = test_client.post("/ingest", json=request_data)
        assert response.status_code == 500
        assert "Firecrawl API key not configured" in response.json()["detail"]
    
    def test_job_status_endpoint_not_found(self, test_client):
        """Test job status for non-existent job"""
        response = test_client.get("/jobs/non-existent-job-id")
        assert response.status_code == 404
        assert response.json()["detail"] == "Job not found"


# Integration test fixtures
@pytest.fixture
def integration_test_env(monkeypatch):
    """Set up environment for integration tests"""
    monkeypatch.setenv("FIRECRAWL_API_KEY", "test_key")
    monkeypatch.setenv("MONGODB_URL", "mongodb://localhost:27017")
    monkeypatch.setenv("DATABASE_NAME", "test_db")


class TestIntegration:
    """Integration tests (require actual services)"""
    
    @pytest.mark.integration
    def test_full_ingestion_flow(self, integration_test_env):
        """Test complete ingestion flow (requires real services)"""
        # This test would require actual Firecrawl API key and MongoDB
        # Skip in regular test runs
        pytest.skip("Integration test requires real services")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
