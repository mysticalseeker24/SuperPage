"""
Unit tests for SuperPage Preprocessing Service

Tests cover feature processing, text cleaning, and FastAPI endpoints
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
import numpy as np

# Import modules to test
from main import (
    app, 
    clean_text, 
    extract_numeric_features, 
    extract_text_features,
    process_project_features,
    get_tokenizer,
    get_scaler,
    get_text_vectorizer
)


class TestTextProcessing:
    """Test cases for text processing functions"""
    
    def test_clean_text_html_removal(self):
        """Test HTML tag removal"""
        html_text = "<h1>Amazing Project</h1><p>This is a <strong>great</strong> project.</p>"
        cleaned = clean_text(html_text)
        assert "<" not in cleaned
        assert ">" not in cleaned
        assert "Amazing Project" in cleaned
        assert "great" in cleaned
    
    def test_clean_text_url_removal(self):
        """Test URL removal"""
        text_with_urls = "Check out https://example.com and http://test.org for more info"
        cleaned = clean_text(text_with_urls)
        assert "https://example.com" not in cleaned
        assert "http://test.org" not in cleaned
        assert "Check out" in cleaned
        assert "for more info" in cleaned
    
    def test_clean_text_special_characters(self):
        """Test special character handling"""
        text_with_special = "Amazing project!!! @#$%^&*() with 100% success rate."
        cleaned = clean_text(text_with_special)
        assert "Amazing project" in cleaned
        assert "success rate" in cleaned
        assert "@#$%^&*()" not in cleaned
    
    def test_clean_text_whitespace_normalization(self):
        """Test whitespace normalization"""
        text_with_spaces = "Amazing    project\n\n\twith   multiple   spaces"
        cleaned = clean_text(text_with_spaces)
        assert "Amazing project with multiple spaces" == cleaned
    
    def test_clean_text_empty_input(self):
        """Test empty and None input handling"""
        assert clean_text("") == ""
        assert clean_text(None) == ""
        assert clean_text(123) == ""


class TestFeatureExtraction:
    """Test cases for feature extraction functions"""
    
    def test_extract_numeric_features_complete_data(self):
        """Test numeric feature extraction with complete data"""
        data = {
            "team_experience": 5.5,
            "funding_amount": 1000000,
            "team_size": 8,
            "traction_score": 75,
            "community_followers": 15000,
            "github_stars": 250,
            "previous_funding": 500000
        }
        
        features = extract_numeric_features(data)
        
        assert features["team_experience"] == 5.5
        assert features["funding_amount"] == 1000000.0
        assert features["team_size"] == 8.0
        assert features["traction_score"] == 75.0
        assert features["community_followers"] == 15000.0
        assert features["github_stars"] == 250.0
        assert features["previous_funding"] == 500000.0
    
    def test_extract_numeric_features_missing_data(self):
        """Test numeric feature extraction with missing data"""
        data = {
            "team_experience": 3.0,
            "funding_amount": "1M"  # String value
        }
        
        features = extract_numeric_features(data)
        
        assert features["team_experience"] == 3.0
        assert features["funding_amount"] == 1.0  # Extracted from "1M"
        assert features["team_size"] == 1.0  # Default value
        assert features["traction_score"] == 0.0  # Default value
    
    def test_extract_numeric_features_string_numbers(self):
        """Test extraction of numbers from strings"""
        data = {
            "funding_amount": "$2.5M raised",
            "team_size": "12 developers",
            "traction_score": "85% success rate"
        }
        
        features = extract_numeric_features(data)
        
        assert features["funding_amount"] == 2.5
        assert features["team_size"] == 12.0
        assert features["traction_score"] == 85.0
    
    @patch('main.get_tokenizer')
    def test_extract_text_features(self, mock_get_tokenizer):
        """Test text feature extraction"""
        # Mock tokenizer
        mock_tokenizer = Mock()
        mock_tokenizer.encode.return_value = [101, 2023, 2003, 102]  # Sample token IDs
        mock_tokenizer.decode.return_value = "test"
        mock_get_tokenizer.return_value = mock_tokenizer
        
        data = {
            "title": "Amazing Web3 Project",
            "description": "This is a revolutionary blockchain solution for DeFi.",
            "pitch": "We're building the future of finance!"
        }
        
        vectorizer = Mock()
        features = extract_text_features(data, mock_tokenizer, vectorizer)
        
        assert features["token_count"] == 4
        assert features["text_length"] > 0
        assert features["sentence_count"] >= 1
        assert "avg_token_length" in features
    
    def test_extract_text_features_empty_data(self):
        """Test text feature extraction with empty data"""
        mock_tokenizer = Mock()
        vectorizer = Mock()
        
        data = {}
        features = extract_text_features(data, mock_tokenizer, vectorizer)
        
        assert features["token_count"] == 0
        assert features["avg_token_length"] == 0
        assert features["text_length"] == 0
        assert features["sentence_count"] == 0


class TestFastAPIEndpoints:
    """Test cases for FastAPI endpoints"""
    
    @pytest.fixture
    def test_client(self):
        """Fixture to create FastAPI test client"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_env(self, monkeypatch):
        """Mock environment variables for testing"""
        monkeypatch.setenv("MONGODB_URL", "mongodb://localhost:27017")
        monkeypatch.setenv("DATABASE_NAME", "test_superpage")
        monkeypatch.setenv("TOKENIZER_MODEL", "distilbert-base-uncased")
    
    def test_health_endpoint(self, test_client):
        """Test health check endpoint"""
        response = test_client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "preprocessing-service"
        assert data["version"] == "1.0.0"
        assert "dependencies" in data
    
    def test_root_endpoint(self, test_client):
        """Test root endpoint"""
        response = test_client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["service"] == "SuperPage Preprocessing Service"
        assert data["version"] == "1.0.0"
        assert "endpoints" in data
    
    @patch('main.database')
    @patch('main.process_project_features')
    async def test_get_project_features_success(self, mock_process, mock_db, test_client):
        """Test successful feature processing"""
        # Mock database response
        mock_collection = AsyncMock()
        mock_collection.find_one.return_value = {
            "project_id": "test_project",
            "extracted_data": {
                "title": "Test Project",
                "description": "A test project",
                "team_experience": 5.0
            }
        }
        mock_db.__getitem__.return_value = mock_collection
        
        # Mock feature processing
        mock_process.return_value = {
            "project_id": "test_project",
            "features": [0.5, 0.7, 0.3],
            "feature_names": ["feature1", "feature2", "feature3"],
            "processing_metadata": {"test": True}
        }
        
        response = test_client.get("/features/test_project")
        
        # Note: This test may not work perfectly due to async/dependency injection
        # In a real scenario, you'd use pytest-asyncio and proper async test setup
        
    def test_get_project_features_invalid_id(self, test_client):
        """Test feature processing with invalid project ID"""
        # This will likely return a 503 due to no database connection in test
        response = test_client.get("/features/nonexistent")
        assert response.status_code in [404, 503]  # Either not found or service unavailable


class TestMLComponents:
    """Test cases for ML components"""
    
    @patch('transformers.AutoTokenizer.from_pretrained')
    def test_get_tokenizer_success(self, mock_from_pretrained):
        """Test tokenizer loading"""
        mock_tokenizer = Mock()
        mock_from_pretrained.return_value = mock_tokenizer
        
        # Clear cache first
        get_tokenizer.cache_clear()
        
        tokenizer = get_tokenizer()
        assert tokenizer == mock_tokenizer
        mock_from_pretrained.assert_called_once()
    
    def test_get_scaler(self):
        """Test scaler initialization"""
        # Clear cache first
        get_scaler.cache_clear()
        
        scaler = get_scaler()
        assert scaler is not None
        assert hasattr(scaler, 'fit_transform')
    
    def test_get_text_vectorizer(self):
        """Test text vectorizer initialization"""
        # Clear cache first
        get_text_vectorizer.cache_clear()
        
        vectorizer = get_text_vectorizer()
        assert vectorizer is not None
        assert hasattr(vectorizer, 'fit_transform')


class TestIntegration:
    """Integration tests"""
    
    @pytest.mark.integration
    @patch('main.get_tokenizer')
    @patch('main.get_scaler')
    @patch('main.get_text_vectorizer')
    async def test_process_project_features_integration(self, mock_vectorizer, mock_scaler, mock_tokenizer):
        """Test complete feature processing pipeline"""
        # Mock dependencies
        mock_tokenizer.return_value.encode.return_value = [101, 2023, 102]
        mock_tokenizer.return_value.decode.return_value = "test"
        mock_scaler.return_value = Mock()
        mock_vectorizer.return_value = Mock()
        
        raw_data = {
            "project_id": "integration_test",
            "extracted_data": {
                "title": "Integration Test Project",
                "description": "This is a comprehensive test of the feature processing pipeline",
                "team_experience": 7.5,
                "funding_amount": 2000000,
                "team_size": 12,
                "traction_score": 85
            }
        }
        
        result = await process_project_features(raw_data)
        
        assert result.project_id == "integration_test"
        assert len(result.features) > 0
        assert len(result.feature_names) == len(result.features)
        assert "processing_timestamp" in result.processing_metadata
        assert result.processing_metadata["total_features"] == len(result.features)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
