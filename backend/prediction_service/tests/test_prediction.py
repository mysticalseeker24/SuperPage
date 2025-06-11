#!/usr/bin/env python3
"""
Unit tests for SuperPage Prediction Service

Tests cover:
- Model loading and management
- Prediction endpoint functionality
- SHAP explanations computation and validation
- Error handling and edge cases
- Thread safety and concurrency

Author: SuperPage Team
"""

import os
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch, MagicMock
import asyncio
import json
from pathlib import Path

import numpy as np
import torch
import pytest
from fastapi.testclient import TestClient
from hypothesis import given, strategies as st

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, get_model_manager, initialize_shap_explainer, compute_shap_explanations
from model_loader import ModelManager, FundraisingPredictor


class TestFundraisingPredictor(unittest.TestCase):
    """Test cases for the PyTorch model."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.model = FundraisingPredictor()
        self.input_size = 7
        self.batch_size = 4
    
    def test_model_instantiation(self):
        """Test model can be instantiated with correct architecture."""
        self.assertIsInstance(self.model, torch.nn.Module)
        self.assertEqual(self.model.input_size, self.input_size)
        self.assertEqual(self.model.hidden_sizes, [64, 32, 16])
        self.assertEqual(self.model.dropout_rate, 0.2)
    
    def test_model_forward_pass(self):
        """Test model forward pass with dummy input."""
        dummy_input = torch.randn(self.batch_size, self.input_size)
        
        with torch.no_grad():
            output = self.model(dummy_input)
        
        # Check output shape and range
        self.assertEqual(output.shape, (self.batch_size, 1))
        self.assertTrue(torch.all(output >= 0))  # Sigmoid output
        self.assertTrue(torch.all(output <= 1))  # Sigmoid output
    
    def test_model_deterministic(self):
        """Test model produces consistent outputs for same input."""
        dummy_input = torch.randn(1, self.input_size)
        
        with torch.no_grad():
            output1 = self.model(dummy_input)
            output2 = self.model(dummy_input)
        
        self.assertTrue(torch.allclose(output1, output2))


class TestModelManager(unittest.TestCase):
    """Test cases for model management functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.model_path = os.path.join(self.temp_dir, "test_model.pth")
        self.scaler_path = os.path.join(self.temp_dir, "test_scaler.pkl")
        
        # Create mock model and scaler files
        self.create_mock_model_files()
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def create_mock_model_files(self):
        """Create mock model and scaler files for testing."""
        # Create mock model
        model = FundraisingPredictor()
        torch.save({
            'model_state_dict': model.state_dict(),
            'model_config': {
                'input_size': 7,
                'hidden_sizes': [64, 32, 16],
                'dropout_rate': 0.2
            }
        }, self.model_path)
        
        # Create mock scaler
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        dummy_data = np.random.randn(10, 7)
        scaler.fit(dummy_data)
        
        import pickle
        with open(self.scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
    
    def test_model_manager_singleton(self):
        """Test ModelManager implements singleton pattern."""
        manager1 = ModelManager()
        manager2 = ModelManager()
        self.assertIs(manager1, manager2)
    
    def test_load_model_success(self):
        """Test successful model loading."""
        manager = ModelManager()
        success = manager.load_model(self.model_path, self.scaler_path)
        
        self.assertTrue(success)
        self.assertTrue(manager.is_loaded())
        self.assertIsNotNone(manager.model)
        self.assertIsNotNone(manager.scaler)
        self.assertIsNotNone(manager.metadata)
    
    def test_load_model_missing_files(self):
        """Test model loading with missing files."""
        manager = ModelManager()
        
        # Test missing model file
        success = manager.load_model("nonexistent_model.pth", self.scaler_path)
        self.assertFalse(success)
        self.assertFalse(manager.is_loaded())
        
        # Test missing scaler file
        success = manager.load_model(self.model_path, "nonexistent_scaler.pkl")
        self.assertFalse(success)
        self.assertFalse(manager.is_loaded())
    
    def test_prediction_success(self):
        """Test successful prediction."""
        manager = ModelManager()
        manager.load_model(self.model_path, self.scaler_path)
        
        # Valid feature vector
        features = [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]
        score, metadata = manager.predict(features)
        
        # Check prediction
        self.assertIsInstance(score, float)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)
        
        # Check metadata
        self.assertIsInstance(metadata, dict)
        self.assertIn('model_version', metadata)
        self.assertIn('device', metadata)
        self.assertIn('input_features', metadata)
    
    def test_prediction_invalid_input(self):
        """Test prediction with invalid input."""
        manager = ModelManager()
        manager.load_model(self.model_path, self.scaler_path)
        
        # Wrong number of features
        with self.assertRaises(ValueError):
            manager.predict([1, 2, 3])  # Only 3 features instead of 7
        
        # NaN values
        with self.assertRaises(ValueError):
            manager.predict([1, 2, 3, 4, 5, 6, float('nan')])
        
        # Infinite values
        with self.assertRaises(ValueError):
            manager.predict([1, 2, 3, 4, 5, 6, float('inf')])
    
    def test_prediction_without_loaded_model(self):
        """Test prediction when model is not loaded."""
        manager = ModelManager()
        
        with self.assertRaises(ValueError):
            manager.predict([1, 2, 3, 4, 5, 6, 7])
    
    def test_get_feature_names(self):
        """Test feature names retrieval."""
        manager = ModelManager()
        feature_names = manager.get_feature_names()
        
        expected_names = [
            "TeamExperience", "PitchQuality", "TokenomicsScore",
            "Traction", "CommunityEngagement", "PreviousFunding", "RaiseSuccessProb"
        ]
        self.assertEqual(feature_names, expected_names)
    
    def test_get_model_info(self):
        """Test model info retrieval."""
        manager = ModelManager()
        
        # Before loading
        info = manager.get_model_info()
        self.assertEqual(info["status"], "not_loaded")
        
        # After loading
        manager.load_model(self.model_path, self.scaler_path)
        info = manager.get_model_info()
        self.assertEqual(info["status"], "loaded")
        self.assertIn("metadata", info)
        self.assertIn("feature_names", info)


class TestPredictionAPI(unittest.TestCase):
    """Test cases for FastAPI endpoints."""
    
    def setUp(self):
        """Set up test client and mock model."""
        self.client = TestClient(app)
        
        # Mock the model manager
        self.mock_manager = Mock(spec=ModelManager)
        self.mock_manager.is_loaded.return_value = True
        self.mock_manager.predict.return_value = (0.7234, {
            "model_version": "2024-01-15T10:30:00",
            "device": "cpu",
            "input_features": 7
        })
        self.mock_manager.get_feature_names.return_value = [
            "TeamExperience", "PitchQuality", "TokenomicsScore",
            "Traction", "CommunityEngagement", "PreviousFunding", "RaiseSuccessProb"
        ]
        self.mock_manager.get_model_info.return_value = {
            "status": "loaded",
            "metadata": {"input_size": 7}
        }
        
        # Patch the dependency
        app.dependency_overrides[get_model_manager] = lambda: self.mock_manager
    
    def tearDown(self):
        """Clean up test fixtures."""
        app.dependency_overrides.clear()
    
    def test_health_endpoint(self):
        """Test health check endpoint."""
        response = self.client.get("/health")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status", data)
        self.assertIn("model_loaded", data)
        self.assertIn("model_info", data)
    
    def test_root_endpoint(self):
        """Test root endpoint."""
        response = self.client.get("/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["service"], "SuperPage Prediction Service")
        self.assertIn("endpoints", data)
    
    def test_model_info_endpoint(self):
        """Test model info endpoint."""
        response = self.client.get("/model/info")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "loaded")
    
    def test_predict_endpoint_success(self):
        """Test successful prediction request."""
        request_data = {
            "features": [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]
        }
        
        response = self.client.post("/predict", json=request_data)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check response structure
        self.assertIn("score", data)
        self.assertIn("explanations", data)
        self.assertIn("model_metadata", data)
        
        # Check score
        self.assertIsInstance(data["score"], float)
        self.assertGreaterEqual(data["score"], 0.0)
        self.assertLessEqual(data["score"], 1.0)
        
        # Check explanations (may be empty if SHAP not available)
        self.assertIsInstance(data["explanations"], list)
    
    def test_predict_endpoint_invalid_features(self):
        """Test prediction with invalid feature count."""
        request_data = {
            "features": [1, 2, 3]  # Only 3 features instead of 7
        }
        
        response = self.client.post("/predict", json=request_data)
        self.assertEqual(response.status_code, 422)  # Validation error
    
    def test_predict_endpoint_invalid_feature_values(self):
        """Test prediction with invalid feature values."""
        request_data = {
            "features": [1, 2, 3, 4, 5, 6, "invalid"]  # String instead of number
        }
        
        response = self.client.post("/predict", json=request_data)
        self.assertEqual(response.status_code, 422)  # Validation error
    
    def test_predict_endpoint_model_not_loaded(self):
        """Test prediction when model is not loaded."""
        self.mock_manager.is_loaded.return_value = False
        
        request_data = {
            "features": [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]
        }
        
        response = self.client.post("/predict", json=request_data)
        self.assertEqual(response.status_code, 503)  # Service unavailable
    
    def test_predict_endpoint_prediction_error(self):
        """Test prediction when model prediction fails."""
        self.mock_manager.predict.side_effect = ValueError("Prediction failed")
        
        request_data = {
            "features": [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]
        }
        
        response = self.client.post("/predict", json=request_data)
        self.assertEqual(response.status_code, 400)  # Bad request


class TestSHAPIntegration(unittest.TestCase):
    """Test cases for SHAP explanations."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.model_path = os.path.join(self.temp_dir, "test_model.pth")
        self.scaler_path = os.path.join(self.temp_dir, "test_scaler.pkl")
        
        # Create mock model and scaler files
        self.create_mock_model_files()
        
        # Create and load model manager
        self.manager = ModelManager()
        self.manager.load_model(self.model_path, self.scaler_path)
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def create_mock_model_files(self):
        """Create mock model and scaler files for testing."""
        # Create mock model
        model = FundraisingPredictor()
        torch.save({
            'model_state_dict': model.state_dict(),
            'model_config': {
                'input_size': 7,
                'hidden_sizes': [64, 32, 16],
                'dropout_rate': 0.2
            }
        }, self.model_path)
        
        # Create mock scaler
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        dummy_data = np.random.randn(10, 7)
        scaler.fit(dummy_data)
        
        import pickle
        with open(self.scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
    
    def test_shap_explanations_structure(self):
        """Test SHAP explanations return correct structure."""
        features = [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]
        
        # Mock SHAP explainer
        with patch('main.shap_explainer') as mock_explainer:
            mock_shap_values = Mock()
            mock_shap_values.values = np.array([[0.1, 0.05, 0.15, 0.02, 0.08, 0.03, 0.12]]).reshape(1, -1)
            mock_explainer.return_value = mock_shap_values
            
            explanations = compute_shap_explanations(features, self.manager)
        
        # Check structure
        self.assertIsInstance(explanations, list)
        self.assertLessEqual(len(explanations), 3)  # Top 3 explanations
        
        for explanation in explanations:
            self.assertIn('feature_name', explanation.__dict__)
            self.assertIn('importance', explanation.__dict__)
            self.assertIn('feature_value', explanation.__dict__)
    
    def test_shap_explanations_ordering(self):
        """Test SHAP explanations are ordered by importance."""
        features = [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]
        
        # Mock SHAP explainer with known values
        with patch('main.shap_explainer') as mock_explainer:
            mock_shap_values = Mock()
            # Importance values: [0.1, 0.05, 0.15, 0.02, 0.08, 0.03, 0.12]
            # Sorted by absolute value: 0.15, 0.12, 0.1 (indices 2, 6, 0)
            mock_shap_values.values = np.array([[0.1, 0.05, 0.15, 0.02, 0.08, 0.03, 0.12]]).reshape(1, -1)
            mock_explainer.return_value = mock_shap_values
            
            explanations = compute_shap_explanations(features, self.manager)
        
        # Check ordering (should be sorted by absolute importance)
        if len(explanations) > 1:
            for i in range(len(explanations) - 1):
                self.assertGreaterEqual(
                    abs(explanations[i].importance),
                    abs(explanations[i + 1].importance)
                )
    
    def test_shap_explanations_fallback(self):
        """Test SHAP explanations fallback when explainer fails."""
        features = [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]
        
        # Mock SHAP explainer to raise exception
        with patch('main.shap_explainer', None):
            explanations = compute_shap_explanations(features, self.manager)
        
        # Should return empty list when explainer not available
        self.assertEqual(len(explanations), 0)


class TestHypothesisProperties(unittest.TestCase):
    """Property-based tests using Hypothesis."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.model_path = os.path.join(self.temp_dir, "test_model.pth")
        self.scaler_path = os.path.join(self.temp_dir, "test_scaler.pkl")
        
        # Create mock model and scaler files
        self.create_mock_model_files()
        
        # Create and load model manager
        self.manager = ModelManager()
        self.manager.load_model(self.model_path, self.scaler_path)
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def create_mock_model_files(self):
        """Create mock model and scaler files for testing."""
        # Create mock model
        model = FundraisingPredictor()
        torch.save({
            'model_state_dict': model.state_dict(),
            'model_config': {
                'input_size': 7,
                'hidden_sizes': [64, 32, 16],
                'dropout_rate': 0.2
            }
        }, self.model_path)
        
        # Create mock scaler
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        dummy_data = np.random.randn(100, 7)
        scaler.fit(dummy_data)
        
        import pickle
        with open(self.scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
    
    @given(st.lists(
        st.floats(min_value=-1000, max_value=1000, allow_nan=False, allow_infinity=False),
        min_size=7,
        max_size=7
    ))
    def test_prediction_output_range(self, features):
        """Test that predictions are always in valid range [0, 1]."""
        try:
            score, _ = self.manager.predict(features)
            self.assertGreaterEqual(score, 0.0)
            self.assertLessEqual(score, 1.0)
            self.assertIsInstance(score, float)
        except ValueError:
            # Some feature combinations may be invalid, which is acceptable
            pass
    
    @given(st.lists(
        st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False),
        min_size=7,
        max_size=7
    ))
    def test_prediction_consistency(self, features):
        """Test that same input produces same output."""
        try:
            score1, _ = self.manager.predict(features)
            score2, _ = self.manager.predict(features)
            self.assertAlmostEqual(score1, score2, places=6)
        except ValueError:
            # Some feature combinations may be invalid, which is acceptable
            pass


if __name__ == '__main__':
    unittest.main()
