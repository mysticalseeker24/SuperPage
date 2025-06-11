#!/usr/bin/env python3
"""
Unit tests for SuperPage Training Service

Tests cover:
- PyTorch model instantiation and forward pass
- Data processing and federated splits
- Flower client simulation
- Model saving/loading
- Federated learning round simulation

Author: SuperPage Team
"""

import os
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from train_federated import (
    FundraisingPredictor,
    DataProcessor,
    SVSimulator,
    create_data_loaders,
    train_model,
    evaluate_model,
    save_model,
    load_model
)


class TestFundraisingPredictor(unittest.TestCase):
    """Test cases for the PyTorch model."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.input_size = 7
        self.batch_size = 16
        self.model = FundraisingPredictor(input_size=self.input_size)
    
    def test_model_instantiation(self):
        """Test model can be instantiated with correct architecture."""
        self.assertIsInstance(self.model, nn.Module)
        self.assertEqual(self.model.input_size, self.input_size)
        self.assertEqual(self.model.hidden_sizes, [64, 32, 16])
        self.assertEqual(self.model.dropout_rate, 0.2)
    
    def test_model_forward_pass(self):
        """Test model forward pass with dummy input."""
        # Create dummy input
        dummy_input = torch.randn(self.batch_size, self.input_size)
        
        # Forward pass
        output = self.model(dummy_input)
        
        # Check output shape and range
        self.assertEqual(output.shape, (self.batch_size, 1))
        self.assertTrue(torch.all(output >= 0))  # Sigmoid output
        self.assertTrue(torch.all(output <= 1))  # Sigmoid output
    
    def test_model_custom_architecture(self):
        """Test model with custom architecture."""
        custom_model = FundraisingPredictor(
            input_size=5,
            hidden_sizes=[32, 16],
            dropout_rate=0.1
        )
        
        dummy_input = torch.randn(8, 5)
        output = custom_model(dummy_input)
        
        self.assertEqual(output.shape, (8, 1))
        self.assertEqual(custom_model.input_size, 5)
        self.assertEqual(custom_model.hidden_sizes, [32, 16])
        self.assertEqual(custom_model.dropout_rate, 0.1)
    
    def test_model_parameters_initialized(self):
        """Test model parameters are properly initialized."""
        for param in self.model.parameters():
            self.assertFalse(torch.isnan(param).any())
            self.assertFalse(torch.isinf(param).any())


class TestDataProcessor(unittest.TestCase):
    """Test cases for data processing functionality."""
    
    def setUp(self):
        """Set up test fixtures with mock data."""
        self.temp_dir = tempfile.mkdtemp()
        self.test_csv_path = os.path.join(self.temp_dir, "test_data.csv")
        
        # Create mock dataset
        self.mock_data = pd.DataFrame({
            'ProjectID': ['proj_1', 'proj_2', 'proj_3', 'proj_4', 'proj_5'],
            'TeamExperience': [2.5, 5.0, 3.2, 7.1, 1.8],
            'PitchQuality': [0.7, 0.4, 0.8, 0.6, 0.3],
            'TokenomicsScore': [0.6, 0.8, 0.5, 0.9, 0.4],
            'Traction': [100, 500, 200, 800, 50],
            'CommunityEngagement': [0.3, 0.7, 0.4, 0.8, 0.2],
            'PreviousFunding': [10000, 50000, 20000, 100000, 5000],
            'RaiseSuccessProb': [0.4, 0.7, 0.5, 0.8, 0.3],
            'SuccessLabel': [0, 1, 0, 1, 0]
        })
        self.mock_data.to_csv(self.test_csv_path, index=False)
        
        self.processor = DataProcessor(self.test_csv_path)
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_load_and_preprocess_data(self):
        """Test data loading and preprocessing."""
        X, y = self.processor.load_and_preprocess_data()
        
        # Check shapes
        self.assertEqual(X.shape, (5, 7))  # 5 samples, 7 features
        self.assertEqual(y.shape, (5,))    # 5 labels
        
        # Check data types
        self.assertEqual(X.dtype, np.float64)
        self.assertEqual(y.dtype, np.int64)
        
        # Check normalization (mean should be close to 0)
        self.assertTrue(np.allclose(np.mean(X, axis=0), 0, atol=1e-10))
    
    def test_create_federated_splits(self):
        """Test federated data splitting."""
        X, y = self.processor.load_and_preprocess_data()
        client_data = self.processor.create_federated_splits(X, y, num_clients=2)
        
        # Check number of clients
        self.assertEqual(len(client_data), 2)
        
        # Check data distribution
        total_samples = sum(len(X_client) for X_client, _ in client_data)
        self.assertEqual(total_samples, len(X))
        
        # Check each client has data
        for X_client, y_client in client_data:
            self.assertGreater(len(X_client), 0)
            self.assertEqual(len(X_client), len(y_client))
    
    def test_feature_columns(self):
        """Test correct feature columns are used."""
        expected_features = [
            'TeamExperience', 'PitchQuality', 'TokenomicsScore', 
            'Traction', 'CommunityEngagement', 'PreviousFunding', 'RaiseSuccessProb'
        ]
        self.assertEqual(self.processor.feature_columns, expected_features)
        self.assertEqual(self.processor.target_column, 'SuccessLabel')


class TestDataLoaders(unittest.TestCase):
    """Test cases for PyTorch data loaders."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.X = np.random.randn(100, 7)
        self.y = np.random.randint(0, 2, 100)
    
    def test_create_data_loaders(self):
        """Test data loader creation."""
        train_loader, val_loader = create_data_loaders(
            self.X, self.y, batch_size=16, test_size=0.2
        )
        
        # Check loader types
        self.assertIsInstance(train_loader, DataLoader)
        self.assertIsInstance(val_loader, DataLoader)
        
        # Check batch sizes
        self.assertEqual(train_loader.batch_size, 16)
        self.assertEqual(val_loader.batch_size, 16)
        
        # Check data split
        train_size = len(train_loader.dataset)
        val_size = len(val_loader.dataset)
        self.assertEqual(train_size + val_size, 100)
        self.assertAlmostEqual(val_size / 100, 0.2, delta=0.05)
    
    def test_data_loader_iteration(self):
        """Test data loader can be iterated."""
        train_loader, _ = create_data_loaders(self.X, self.y, batch_size=8)
        
        for batch_X, batch_y in train_loader:
            # Check batch shapes
            self.assertEqual(batch_X.shape[1], 7)  # 7 features
            self.assertEqual(batch_y.shape[1], 1)  # 1 target
            self.assertLessEqual(batch_X.shape[0], 8)  # Batch size
            break  # Just test first batch


class TestModelTraining(unittest.TestCase):
    """Test cases for model training and evaluation."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.model = FundraisingPredictor()
        self.device = torch.device("cpu")
        self.model.to(self.device)
        
        # Create dummy data
        X = np.random.randn(50, 7)
        y = np.random.randint(0, 2, 50)
        self.train_loader, self.val_loader = create_data_loaders(X, y, batch_size=8)
        
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        self.criterion = nn.BCELoss()
    
    def test_train_model(self):
        """Test model training for one epoch."""
        initial_params = [p.clone() for p in self.model.parameters()]
        
        loss = train_model(
            self.model, self.train_loader, self.optimizer, 
            self.criterion, self.device
        )
        
        # Check loss is a valid number
        self.assertIsInstance(loss, float)
        self.assertFalse(np.isnan(loss))
        self.assertFalse(np.isinf(loss))
        
        # Check parameters have changed
        final_params = list(self.model.parameters())
        for initial, final in zip(initial_params, final_params):
            self.assertFalse(torch.equal(initial, final))
    
    def test_evaluate_model(self):
        """Test model evaluation."""
        metrics = evaluate_model(
            self.model, self.val_loader, self.criterion, self.device
        )
        
        # Check required metrics are present
        required_metrics = ['loss', 'accuracy', 'precision', 'recall', 'f1']
        for metric in required_metrics:
            self.assertIn(metric, metrics)
            self.assertIsInstance(metrics[metric], (int, float))
            self.assertFalse(np.isnan(metrics[metric]))
        
        # Check metric ranges
        self.assertGreaterEqual(metrics['accuracy'], 0)
        self.assertLessEqual(metrics['accuracy'], 1)
        self.assertGreaterEqual(metrics['precision'], 0)
        self.assertLessEqual(metrics['precision'], 1)


class TestSVSimulator(unittest.TestCase):
    """Test cases for Flower federated learning client."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.model = FundraisingPredictor()
        
        # Create dummy data
        X = np.random.randn(30, 7)
        y = np.random.randint(0, 2, 30)
        self.train_loader, self.val_loader = create_data_loaders(X, y, batch_size=8)
        
        self.client = SVSimulator(
            self.model, self.train_loader, self.val_loader, learning_rate=0.001
        )
    
    def test_client_instantiation(self):
        """Test SVSimulator client can be instantiated."""
        self.assertIsInstance(self.client.model, FundraisingPredictor)
        self.assertIsInstance(self.client.train_loader, DataLoader)
        self.assertIsInstance(self.client.val_loader, DataLoader)
    
    def test_get_parameters(self):
        """Test client can return model parameters."""
        params = self.client.get_parameters({})
        
        self.assertIsInstance(params, list)
        self.assertGreater(len(params), 0)
        
        for param in params:
            self.assertIsInstance(param, np.ndarray)
    
    def test_set_parameters(self):
        """Test client can set model parameters."""
        # Get initial parameters
        initial_params = self.client.get_parameters({})
        
        # Create new parameters (slightly modified)
        new_params = [param + 0.01 for param in initial_params]
        
        # Set new parameters
        self.client.set_parameters(new_params)
        
        # Get updated parameters
        updated_params = self.client.get_parameters({})
        
        # Check parameters were updated
        for initial, updated in zip(initial_params, updated_params):
            self.assertFalse(np.allclose(initial, updated))
    
    def test_fit_method(self):
        """Test client fit method (federated training)."""
        initial_params = self.client.get_parameters({})
        
        # Simulate federated round
        updated_params, num_examples, metrics = self.client.fit(initial_params, {})
        
        # Check return types
        self.assertIsInstance(updated_params, list)
        self.assertIsInstance(num_examples, int)
        self.assertIsInstance(metrics, dict)
        
        # Check metrics
        self.assertIn('train_loss', metrics)
        self.assertIn('accuracy', metrics)
        
        # Check parameters were updated
        for initial, updated in zip(initial_params, updated_params):
            self.assertFalse(np.allclose(initial, updated, atol=1e-6))
    
    def test_evaluate_method(self):
        """Test client evaluate method."""
        params = self.client.get_parameters({})
        
        loss, num_examples, metrics = self.client.evaluate(params, {})
        
        # Check return types
        self.assertIsInstance(loss, float)
        self.assertIsInstance(num_examples, int)
        self.assertIsInstance(metrics, dict)
        
        # Check values
        self.assertFalse(np.isnan(loss))
        self.assertGreater(num_examples, 0)
        self.assertIn('accuracy', metrics)


class TestModelPersistence(unittest.TestCase):
    """Test cases for model saving and loading."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.model_path = os.path.join(self.temp_dir, "test_model.pth")
        self.scaler_path = os.path.join(self.temp_dir, "test_scaler.pkl")
        
        self.model = FundraisingPredictor()
        
        # Create and fit a dummy scaler
        from sklearn.preprocessing import StandardScaler
        self.scaler = StandardScaler()
        dummy_data = np.random.randn(10, 7)
        self.scaler.fit(dummy_data)
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_save_and_load_model(self):
        """Test model and scaler can be saved and loaded."""
        # Save model and scaler
        save_model(self.model, self.scaler, self.model_path, self.scaler_path)
        
        # Check files were created
        self.assertTrue(os.path.exists(self.model_path))
        self.assertTrue(os.path.exists(self.scaler_path))
        
        # Load model and scaler
        loaded_model, loaded_scaler = load_model(self.model_path, self.scaler_path)
        
        # Check types
        self.assertIsInstance(loaded_model, FundraisingPredictor)
        self.assertIsInstance(loaded_scaler, type(self.scaler))
        
        # Check model architecture
        self.assertEqual(loaded_model.input_size, self.model.input_size)
        self.assertEqual(loaded_model.hidden_sizes, self.model.hidden_sizes)
        
        # Test model inference
        dummy_input = torch.randn(1, 7)
        output = loaded_model(dummy_input)
        self.assertEqual(output.shape, (1, 1))


if __name__ == '__main__':
    unittest.main()
