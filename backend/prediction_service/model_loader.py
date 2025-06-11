#!/usr/bin/env python3
"""
SuperPage Prediction Service - Model Loading and Management

This module handles loading and managing the trained PyTorch model and scaler
for fundraising success prediction with thread-safe operations.

Author: SuperPage Team
"""

import os
import pickle
import threading
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, List
from dataclasses import dataclass

import torch
import torch.nn as nn
import numpy as np
from sklearn.preprocessing import StandardScaler

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class ModelMetadata:
    """Metadata about the loaded model."""
    model_path: str
    scaler_path: str
    input_size: int
    hidden_sizes: List[int]
    dropout_rate: float
    load_timestamp: str
    device: str


class FundraisingPredictor(nn.Module):
    """
    PyTorch neural network for fundraising success prediction.
    
    This is a copy of the model from training_service to ensure compatibility.
    """
    
    def __init__(self, input_size: int = 7, hidden_sizes: List[int] = [64, 32, 16], dropout_rate: float = 0.2):
        super(FundraisingPredictor, self).__init__()
        
        self.input_size = input_size
        self.hidden_sizes = hidden_sizes
        self.dropout_rate = dropout_rate
        
        # Build network layers
        layers = []
        prev_size = input_size
        
        for hidden_size in hidden_sizes:
            layers.extend([
                nn.Linear(prev_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(dropout_rate)
            ])
            prev_size = hidden_size
        
        # Output layer
        layers.append(nn.Linear(prev_size, 1))
        layers.append(nn.Sigmoid())
        
        self.network = nn.Sequential(*layers)
        
        # Initialize weights
        self._initialize_weights()
    
    def _initialize_weights(self):
        """Initialize network weights using Xavier uniform initialization."""
        for module in self.modules():
            if isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                nn.init.zeros_(module.bias)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass through the network."""
        return self.network(x)


class ModelManager:
    """
    Thread-safe model manager for loading and serving predictions.
    
    Implements singleton pattern to ensure only one model instance is loaded.
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ModelManager, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.model: Optional[FundraisingPredictor] = None
            self.scaler: Optional[StandardScaler] = None
            self.metadata: Optional[ModelMetadata] = None
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self._model_lock = threading.RLock()
            self._initialized = True
            logger.info(f"ModelManager initialized on device: {self.device}")
    
    def load_model(self, model_path: str = "../training_service/models/latest/fundraising_model.pth",
                   scaler_path: str = "../training_service/models/latest/scaler.pkl") -> bool:
        """
        Load the trained model and scaler.
        
        Args:
            model_path: Path to the saved PyTorch model
            scaler_path: Path to the saved StandardScaler
            
        Returns:
            True if loading successful, False otherwise
        """
        with self._model_lock:
            try:
                # Check if files exist
                if not os.path.exists(model_path):
                    logger.error(f"Model file not found: {model_path}")
                    return False
                
                if not os.path.exists(scaler_path):
                    logger.error(f"Scaler file not found: {scaler_path}")
                    return False
                
                # Load model
                logger.info(f"Loading model from: {model_path}")
                checkpoint = torch.load(model_path, map_location=self.device)
                model_config = checkpoint['model_config']
                
                self.model = FundraisingPredictor(
                    input_size=model_config['input_size'],
                    hidden_sizes=model_config['hidden_sizes'],
                    dropout_rate=model_config['dropout_rate']
                )
                self.model.load_state_dict(checkpoint['model_state_dict'])
                self.model.to(self.device)
                self.model.eval()  # Set to evaluation mode
                
                # Load scaler
                logger.info(f"Loading scaler from: {scaler_path}")
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                
                # Create metadata
                from datetime import datetime
                self.metadata = ModelMetadata(
                    model_path=model_path,
                    scaler_path=scaler_path,
                    input_size=model_config['input_size'],
                    hidden_sizes=model_config['hidden_sizes'],
                    dropout_rate=model_config['dropout_rate'],
                    load_timestamp=datetime.now().isoformat(),
                    device=str(self.device)
                )
                
                logger.info("Model and scaler loaded successfully")
                logger.info(f"Model architecture: {self.metadata.input_size} -> {self.metadata.hidden_sizes} -> 1")
                return True
                
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                self.model = None
                self.scaler = None
                self.metadata = None
                return False
    
    def is_loaded(self) -> bool:
        """Check if model and scaler are loaded."""
        with self._model_lock:
            return self.model is not None and self.scaler is not None
    
    def predict(self, features: List[float]) -> Tuple[float, Dict[str, Any]]:
        """
        Make a prediction using the loaded model.
        
        Args:
            features: List of 7 feature values in the correct order
            
        Returns:
            Tuple of (prediction_score, prediction_metadata)
            
        Raises:
            ValueError: If model not loaded or invalid input
        """
        with self._model_lock:
            if not self.is_loaded():
                raise ValueError("Model not loaded. Call load_model() first.")
            
            if len(features) != self.metadata.input_size:
                raise ValueError(f"Expected {self.metadata.input_size} features, got {len(features)}")
            
            try:
                # Validate feature values
                features_array = np.array(features, dtype=np.float32)
                if np.any(np.isnan(features_array)) or np.any(np.isinf(features_array)):
                    raise ValueError("Features contain NaN or infinite values")
                
                # Scale features
                features_scaled = self.scaler.transform(features_array.reshape(1, -1))
                
                # Convert to tensor
                features_tensor = torch.FloatTensor(features_scaled).to(self.device)
                
                # Make prediction
                with torch.no_grad():
                    prediction = self.model(features_tensor)
                    score = prediction.item()
                
                # Create prediction metadata
                prediction_metadata = {
                    "model_version": self.metadata.load_timestamp,
                    "device": self.metadata.device,
                    "input_features": len(features),
                    "scaled_features": features_scaled.tolist()[0],
                    "raw_features": features
                }
                
                logger.debug(f"Prediction made: {score:.4f}")
                return score, prediction_metadata
                
            except Exception as e:
                logger.error(f"Prediction failed: {e}")
                raise ValueError(f"Prediction failed: {str(e)}")
    
    def get_feature_names(self) -> List[str]:
        """Get the expected feature names in order."""
        return [
            "TeamExperience",
            "PitchQuality", 
            "TokenomicsScore",
            "Traction",
            "CommunityEngagement",
            "PreviousFunding",
            "RaiseSuccessProb"
        ]
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        with self._model_lock:
            if not self.is_loaded():
                return {"status": "not_loaded"}
            
            return {
                "status": "loaded",
                "metadata": {
                    "model_path": self.metadata.model_path,
                    "scaler_path": self.metadata.scaler_path,
                    "input_size": self.metadata.input_size,
                    "hidden_sizes": self.metadata.hidden_sizes,
                    "dropout_rate": self.metadata.dropout_rate,
                    "load_timestamp": self.metadata.load_timestamp,
                    "device": self.metadata.device
                },
                "feature_names": self.get_feature_names(),
                "model_parameters": sum(p.numel() for p in self.model.parameters()),
                "trainable_parameters": sum(p.numel() for p in self.model.parameters() if p.requires_grad)
            }


# Global model manager instance
model_manager = ModelManager()


def get_model_manager() -> ModelManager:
    """Get the global model manager instance."""
    return model_manager
