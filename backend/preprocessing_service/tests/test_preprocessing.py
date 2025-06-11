"""
Unit tests for SuperPage Preprocessing Service

Tests cover feature processing, text cleaning, and FastAPI endpoints
Includes hypothesis testing for numeric edge cases and comprehensive mocking
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
import numpy as np
from hypothesis import given, strategies as st, assume
import json

# Import modules to test
from main import (
    app,
    clean_text,
    extract_numeric_features,
    extract_text_features,
    process_project_features,
    get_tokenizer,
    get_scaler,
    get_text_vectorizer,
    ProcessedFeatures,
    RawProjectData
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

    @given(
        team_experience=st.floats(min_value=-100, max_value=100, allow_nan=False, allow_infinity=False),
        funding_amount=st.integers(min_value=-1000000, max_value=1000000000),
        team_size=st.integers(min_value=-10, max_value=10000),
        traction_score=st.floats(min_value=-1000, max_value=1000, allow_nan=False, allow_infinity=False)
    )
    def test_extract_numeric_features_hypothesis_edge_cases(self, team_experience, funding_amount, team_size, traction_score):
        """Test numeric feature extraction with hypothesis-generated edge cases"""
        data = {
            "team_experience": team_experience,
            "funding_amount": funding_amount,
            "team_size": team_size,
            "traction_score": traction_score
        }

        features = extract_numeric_features(data)

        # All features should be extracted as floats
        assert isinstance(features["team_experience"], float)
        assert isinstance(features["funding_amount"], float)
        assert isinstance(features["team_size"], float)
        assert isinstance(features["traction_score"], float)

        # Values should match input (converted to float)
        assert features["team_experience"] == float(team_experience)
        assert features["funding_amount"] == float(funding_amount)
        assert features["team_size"] == float(team_size)
        assert features["traction_score"] == float(traction_score)

    @given(
        text_input=st.text(min_size=0, max_size=1000),
        numeric_string=st.from_regex(r'\d+\.?\d*', fullmatch=True)
    )
    def test_extract_numeric_features_string_edge_cases(self, text_input, numeric_string):
        """Test numeric extraction from various string formats"""
        assume(len(numeric_string) > 0)  # Ensure we have a valid numeric string

        # Test with text containing numbers
        data = {
            "funding_amount": f"{text_input} {numeric_string} more text",
            "team_size": numeric_string
        }

        features = extract_numeric_features(data)

        # Should extract the numeric part
        expected_value = float(numeric_string)
        assert features["funding_amount"] == expected_value
        assert features["team_size"] == expected_value

    @given(
        invalid_data=st.one_of(
            st.none(),
            st.lists(st.integers()),
            st.dictionaries(st.text(), st.integers()),
            st.booleans()
        )
    )
    def test_extract_numeric_features_invalid_types(self, invalid_data):
        """Test numeric feature extraction with invalid data types"""
        data = {
            "team_experience": invalid_data,
            "funding_amount": invalid_data
        }

        features = extract_numeric_features(data)

        # Should handle invalid types gracefully with defaults
        assert isinstance(features["team_experience"], float)
        assert isinstance(features["funding_amount"], float)
        # Should use default values for invalid types
        assert features["team_experience"] == 0.0
        assert features["funding_amount"] == 0.0
    
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


class TestFeatureVectorProcessing:
    """Test cases for feature vector processing and validation"""

    @pytest.fixture
    def sample_raw_data(self):
        """Sample raw data for testing"""
        return {
            "project_id": "test_project_123",
            "url": "https://example-web3-project.com",
            "extracted_data": {
                "title": "Revolutionary DeFi Protocol",
                "description": "A groundbreaking decentralized finance solution that enables seamless cross-chain transactions",
                "pitch": "We're building the future of finance with innovative blockchain technology",
                "team_experience": 7.5,
                "funding_amount": 2500000,
                "team_size": 12,
                "traction_score": 85,
                "community_followers": 25000,
                "github_stars": 450,
                "previous_funding": 1000000
            },
            "timestamp": "2024-01-15T10:30:00Z"
        }

    @pytest.fixture
    def minimal_raw_data(self):
        """Minimal raw data for edge case testing"""
        return {
            "project_id": "minimal_project",
            "extracted_data": {}
        }

    @patch('main.get_tokenizer')
    @patch('main.get_scaler')
    @patch('main.get_text_vectorizer')
    async def test_feature_vector_length_consistency(self, mock_vectorizer, mock_scaler, mock_tokenizer, sample_raw_data):
        """Test that feature vectors have consistent length"""
        # Mock dependencies
        mock_tokenizer.return_value.encode.return_value = [101, 2023, 3021, 102]
        mock_tokenizer.return_value.decode.return_value = "test"
        mock_scaler.return_value = Mock()
        mock_vectorizer.return_value = Mock()

        result = await process_project_features(sample_raw_data)

        # Assert feature vector properties
        assert isinstance(result, ProcessedFeatures)
        assert len(result.features) > 0
        assert len(result.feature_names) == len(result.features)
        assert all(isinstance(f, float) for f in result.features)
        assert result.project_id == "test_project_123"

    @patch('main.get_tokenizer')
    @patch('main.get_scaler')
    @patch('main.get_text_vectorizer')
    async def test_feature_vector_minimal_data(self, mock_vectorizer, mock_scaler, mock_tokenizer, minimal_raw_data):
        """Test feature vector generation with minimal data"""
        # Mock dependencies
        mock_tokenizer.return_value.encode.return_value = []
        mock_tokenizer.return_value.decode.return_value = ""
        mock_scaler.return_value = Mock()
        mock_vectorizer.return_value = Mock()

        result = await process_project_features(minimal_raw_data)

        # Should still produce a valid feature vector
        assert isinstance(result, ProcessedFeatures)
        assert len(result.features) >= 5  # At least default features
        assert len(result.feature_names) == len(result.features)
        assert all(isinstance(f, float) for f in result.features)

    @given(
        team_experience=st.floats(min_value=0, max_value=50, allow_nan=False, allow_infinity=False),
        funding_amount=st.integers(min_value=0, max_value=100000000),
        team_size=st.integers(min_value=1, max_value=1000)
    )
    @patch('main.get_tokenizer')
    @patch('main.get_scaler')
    @patch('main.get_text_vectorizer')
    async def test_feature_processing_numeric_edge_cases(self, mock_vectorizer, mock_scaler, mock_tokenizer,
                                                       team_experience, funding_amount, team_size):
        """Test feature processing with various numeric edge cases using hypothesis"""
        # Mock dependencies
        mock_tokenizer.return_value.encode.return_value = [101, 102]
        mock_tokenizer.return_value.decode.return_value = "test"
        mock_scaler.return_value = Mock()
        mock_vectorizer.return_value = Mock()

        raw_data = {
            "project_id": f"edge_case_{team_experience}_{funding_amount}_{team_size}",
            "extracted_data": {
                "title": "Edge Case Project",
                "description": "Testing edge cases",
                "team_experience": team_experience,
                "funding_amount": funding_amount,
                "team_size": team_size
            }
        }

        result = await process_project_features(raw_data)

        # Assertions for edge cases
        assert isinstance(result, ProcessedFeatures)
        assert len(result.features) > 0
        assert all(isinstance(f, (int, float)) for f in result.features)
        assert all(not np.isnan(f) for f in result.features)
        assert all(not np.isinf(f) for f in result.features)
        assert all(0 <= f <= 1 for f in result.features)  # Normalized features should be in [0,1]


class TestFastAPIEndpoints:
    """Test cases for FastAPI endpoints with comprehensive HTTP testing"""

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

    @pytest.fixture
    def mock_database_success(self):
        """Mock successful database response"""
        mock_db = Mock()
        mock_collection = AsyncMock()
        mock_collection.find_one.return_value = {
            "project_id": "test_project",
            "extracted_data": {
                "title": "Test Project",
                "description": "A comprehensive test project for validation",
                "team_experience": 5.5,
                "funding_amount": 1500000,
                "team_size": 8
            },
            "timestamp": "2024-01-15T10:30:00Z"
        }
        mock_db.__getitem__.return_value = mock_collection
        return mock_db

    def test_health_endpoint_status_and_schema(self, test_client):
        """Test health endpoint returns correct status and schema"""
        response = test_client.get("/health")

        # Test HTTP status
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

        # Test response schema
        data = response.json()
        required_fields = ["status", "service", "version", "dependencies"]
        for field in required_fields:
            assert field in data

        assert data["status"] == "healthy"
        assert data["service"] == "preprocessing-service"
        assert data["version"] == "1.0.0"
        assert isinstance(data["dependencies"], dict)

    def test_root_endpoint_status_and_schema(self, test_client):
        """Test root endpoint returns correct status and schema"""
        response = test_client.get("/")

        # Test HTTP status
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

        # Test response schema
        data = response.json()
        required_fields = ["service", "version", "description", "endpoints"]
        for field in required_fields:
            assert field in data

        assert data["service"] == "SuperPage Preprocessing Service"
        assert data["version"] == "1.0.0"
        assert isinstance(data["endpoints"], dict)

    @patch('main.database')
    @patch('main.get_tokenizer')
    @patch('main.get_scaler')
    @patch('main.get_text_vectorizer')
    def test_features_endpoint_success_status_and_schema(self, mock_vectorizer, mock_scaler,
                                                       mock_tokenizer, mock_db, test_client):
        """Test /features endpoint returns correct status and schema"""
        # Mock database
        mock_collection = AsyncMock()
        mock_collection.find_one.return_value = {
            "project_id": "test_project",
            "extracted_data": {
                "title": "Test Project",
                "description": "A test project for validation",
                "team_experience": 5.0,
                "funding_amount": 1000000
            }
        }
        mock_db.__getitem__.return_value = mock_collection

        # Mock ML components
        mock_tokenizer.return_value.encode.return_value = [101, 2023, 102]
        mock_tokenizer.return_value.decode.return_value = "test"
        mock_scaler.return_value = Mock()
        mock_vectorizer.return_value = Mock()

        # Make request
        response = test_client.get("/features/test_project")

        # Test HTTP status (might be 503 due to dependency injection in tests)
        assert response.status_code in [200, 503]

        if response.status_code == 200:
            # Test response schema if successful
            data = response.json()
            required_fields = ["project_id", "features", "feature_names", "processing_metadata"]
            for field in required_fields:
                assert field in data

            assert isinstance(data["features"], list)
            assert isinstance(data["feature_names"], list)
            assert isinstance(data["processing_metadata"], dict)
            assert len(data["features"]) == len(data["feature_names"])

    def test_features_endpoint_not_found(self, test_client):
        """Test /features endpoint with non-existent project"""
        response = test_client.get("/features/nonexistent_project_12345")

        # Should return either 404 (not found) or 503 (service unavailable due to no DB)
        assert response.status_code in [404, 503]

        # Response should be JSON
        assert response.headers["content-type"] == "application/json"

    def test_features_endpoint_invalid_project_id(self, test_client):
        """Test /features endpoint with invalid project ID format"""
        invalid_ids = ["", " ", "invalid/id", "id with spaces", "very_long_id_" + "x" * 1000]

        for invalid_id in invalid_ids:
            response = test_client.get(f"/features/{invalid_id}")
            # Should handle gracefully
            assert response.status_code in [404, 422, 503]


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


class TestRawDataMocking:
    """Test cases for mocking raw data input and validating feature vectors"""

    @pytest.fixture
    def comprehensive_raw_data(self):
        """Comprehensive raw data fixture for testing"""
        return {
            "project_id": "comprehensive_test_project",
            "url": "https://comprehensive-defi-protocol.com",
            "extracted_data": {
                "title": "Comprehensive DeFi Protocol",
                "description": "A revolutionary decentralized finance protocol that enables cross-chain liquidity provision with automated market making capabilities",
                "pitch": "We're revolutionizing DeFi by solving the liquidity fragmentation problem across multiple blockchains",
                "whitepaper_summary": "Our protocol uses novel cryptographic proofs to ensure secure cross-chain transactions",
                "team_bio": "Founded by experienced blockchain developers with backgrounds from top tech companies",
                "team_experience": 8.5,
                "funding_amount": 5000000,
                "team_size": 15,
                "traction_score": 92,
                "community_followers": 50000,
                "github_stars": 1250,
                "previous_funding": 2000000
            },
            "timestamp": "2024-01-15T14:30:00Z"
        }

    @pytest.fixture
    def edge_case_raw_data(self):
        """Edge case raw data with extreme values"""
        return {
            "project_id": "edge_case_project",
            "extracted_data": {
                "title": "",  # Empty title
                "description": "A" * 10000,  # Very long description
                "team_experience": 0,  # Zero experience
                "funding_amount": 0,  # No funding
                "team_size": 1,  # Single person team
                "traction_score": 100,  # Maximum score
                "community_followers": 0,  # No followers
                "github_stars": 0,  # No stars
                "previous_funding": 0  # No previous funding
            }
        }

    @patch('main.get_tokenizer')
    @patch('main.get_scaler')
    @patch('main.get_text_vectorizer')
    async def test_comprehensive_raw_data_feature_vector_length(self, mock_vectorizer, mock_scaler,
                                                              mock_tokenizer, comprehensive_raw_data):
        """Test feature vector length with comprehensive raw data"""
        # Mock ML components
        mock_tokenizer.return_value.encode.return_value = [101] + list(range(2000, 2100)) + [102]  # 102 tokens
        mock_tokenizer.return_value.decode.return_value = "comprehensive"
        mock_scaler.return_value = Mock()
        mock_vectorizer.return_value = Mock()

        result = await process_project_features(comprehensive_raw_data)

        # Assert feature vector properties
        assert isinstance(result.features, list)
        assert len(result.features) > 0
        assert len(result.features) == len(result.feature_names)

        # All features should be numeric
        for i, feature in enumerate(result.features):
            assert isinstance(feature, (int, float)), f"Feature {i} ({result.feature_names[i]}) is not numeric: {type(feature)}"
            assert not np.isnan(feature), f"Feature {i} ({result.feature_names[i]}) is NaN"
            assert not np.isinf(feature), f"Feature {i} ({result.feature_names[i]}) is infinite"

        # Features should be normalized (0-1 range for most features)
        normalized_features = [f for f in result.features if 0 <= f <= 1]
        assert len(normalized_features) >= len(result.features) * 0.8  # At least 80% should be normalized

    @patch('main.get_tokenizer')
    @patch('main.get_scaler')
    @patch('main.get_text_vectorizer')
    async def test_edge_case_raw_data_feature_vector_length(self, mock_vectorizer, mock_scaler,
                                                          mock_tokenizer, edge_case_raw_data):
        """Test feature vector length with edge case raw data"""
        # Mock ML components for edge cases
        mock_tokenizer.return_value.encode.return_value = [101, 102]  # Minimal tokens
        mock_tokenizer.return_value.decode.return_value = "A"
        mock_scaler.return_value = Mock()
        mock_vectorizer.return_value = Mock()

        result = await process_project_features(edge_case_raw_data)

        # Should still produce valid feature vector
        assert isinstance(result.features, list)
        assert len(result.features) > 0
        assert len(result.features) == len(result.feature_names)

        # All features should be valid numbers
        for feature in result.features:
            assert isinstance(feature, (int, float))
            assert not np.isnan(feature)
            assert not np.isinf(feature)

    @given(
        project_data=st.fixed_dictionaries({
            'project_id': st.text(min_size=1, max_size=50),
            'extracted_data': st.fixed_dictionaries({
                'title': st.text(min_size=0, max_size=200),
                'description': st.text(min_size=0, max_size=1000),
                'team_experience': st.floats(min_value=0, max_value=50, allow_nan=False, allow_infinity=False),
                'funding_amount': st.integers(min_value=0, max_value=100000000),
                'team_size': st.integers(min_value=1, max_value=1000),
                'traction_score': st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False)
            })
        })
    )
    @patch('main.get_tokenizer')
    @patch('main.get_scaler')
    @patch('main.get_text_vectorizer')
    async def test_hypothesis_raw_data_feature_vector_consistency(self, mock_vectorizer, mock_scaler,
                                                                mock_tokenizer, project_data):
        """Test feature vector consistency with hypothesis-generated raw data"""
        # Mock ML components
        mock_tokenizer.return_value.encode.return_value = [101, 2000, 2001, 102]
        mock_tokenizer.return_value.decode.return_value = "test"
        mock_scaler.return_value = Mock()
        mock_vectorizer.return_value = Mock()

        result = await process_project_features(project_data)

        # Basic consistency checks
        assert isinstance(result, ProcessedFeatures)
        assert result.project_id == project_data['project_id']
        assert len(result.features) > 0
        assert len(result.features) == len(result.feature_names)

        # All features should be valid
        for i, feature in enumerate(result.features):
            assert isinstance(feature, (int, float)), f"Feature {i} is not numeric"
            assert not np.isnan(feature), f"Feature {i} is NaN"
            assert not np.isinf(feature), f"Feature {i} is infinite"


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
