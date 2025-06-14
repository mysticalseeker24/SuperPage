#!/usr/bin/env python3
"""
SuperPage Training Service - Federated Learning Implementation

This module implements a Flower federated learning setup for fundraising success prediction.
Uses PyTorch for tabular regression with the SuperPage dataset features.

Features:
- PyTorch tabular regression model
- Flower federated learning client (SVSimulator)
- Model weight aggregation
- Command-line interface for training parameters
- Model persistence to /models/latest

Author: SuperPage Team
"""

import argparse
import logging
import os
import sys
import warnings
from pathlib import Path
from typing import Dict, List, Tuple, Union, Optional

import flwr as fl
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from torch.utils.data import DataLoader, TensorDataset

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('training.log')
    ]
)
logger = logging.getLogger(__name__)


class FundraisingPredictor(nn.Module):
    """
    PyTorch neural network for fundraising success prediction.
    
    Architecture:
    - Input: 7 features (TeamExperience, PitchQuality, TokenomicsScore, 
             Traction, CommunityEngagement, PreviousFunding, RaiseSuccessProb)
    - Hidden layers: 64 -> 32 -> 16 neurons with ReLU activation
    - Output: 1 neuron with sigmoid activation for binary classification
    - Dropout for regularization
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


class DataProcessor:
    """Handles data loading, preprocessing, and splitting for federated learning."""
    
    def __init__(self, data_path: str = "Dataset/dummy_dataset_aligned.csv"):
        self.data_path = data_path
        self.scaler = StandardScaler()
        self.feature_columns = [
            'TeamExperience', 'PitchQuality', 'TokenomicsScore', 
            'Traction', 'CommunityEngagement', 'PreviousFunding', 'RaiseSuccessProb'
        ]
        self.target_column = 'SuccessLabel'
    
    def load_and_preprocess_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load dataset and preprocess for training.
        
        Returns:
            Tuple of (features, labels) as numpy arrays
        """
        try:
            # Load dataset
            df = pd.read_csv(self.data_path)
            logger.info(f"Loaded dataset with {len(df)} samples")
            
            # Extract features and target
            X = df[self.feature_columns].values
            y = df[self.target_column].values
            
            # Normalize features
            X_scaled = self.scaler.fit_transform(X)
            
            logger.info(f"Features shape: {X_scaled.shape}, Target shape: {y.shape}")
            logger.info(f"Positive samples: {np.sum(y)}/{len(y)} ({np.mean(y)*100:.1f}%)")
            
            return X_scaled, y
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def create_federated_splits(self, X: np.ndarray, y: np.ndarray, 
                              num_clients: int = 3) -> List[Tuple[np.ndarray, np.ndarray]]:
        """
        Split data for federated learning simulation.
        
        Args:
            X: Feature matrix
            y: Target vector
            num_clients: Number of federated clients to simulate
            
        Returns:
            List of (X_client, y_client) tuples for each client
        """
        client_data = []
        
        # Split data among clients
        indices = np.arange(len(X))
        np.random.shuffle(indices)
        
        client_size = len(X) // num_clients
        
        for i in range(num_clients):
            start_idx = i * client_size
            if i == num_clients - 1:  # Last client gets remaining data
                end_idx = len(X)
            else:
                end_idx = (i + 1) * client_size
            
            client_indices = indices[start_idx:end_idx]
            X_client = X[client_indices]
            y_client = y[client_indices]
            
            logger.info(f"Client {i+1}: {len(X_client)} samples, "
                       f"{np.sum(y_client)} positive ({np.mean(y_client)*100:.1f}%)")
            
            client_data.append((X_client, y_client))
        
        return client_data


def create_data_loaders(X: np.ndarray, y: np.ndarray, 
                       batch_size: int = 32, test_size: float = 0.2) -> Tuple[DataLoader, DataLoader]:
    """
    Create PyTorch data loaders for training and validation.
    
    Args:
        X: Feature matrix
        y: Target vector
        batch_size: Batch size for training
        test_size: Fraction of data for validation
        
    Returns:
        Tuple of (train_loader, val_loader)
    """
    # Split into train/validation
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    
    # Convert to tensors
    X_train_tensor = torch.FloatTensor(X_train)
    y_train_tensor = torch.FloatTensor(y_train).unsqueeze(1)
    X_val_tensor = torch.FloatTensor(X_val)
    y_val_tensor = torch.FloatTensor(y_val).unsqueeze(1)
    
    # Create datasets
    train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
    val_dataset = TensorDataset(X_val_tensor, y_val_tensor)
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader


def train_model(model: nn.Module, train_loader: DataLoader, 
               optimizer: optim.Optimizer, criterion: nn.Module, 
               device: torch.device) -> float:
    """
    Train model for one epoch.
    
    Args:
        model: PyTorch model
        train_loader: Training data loader
        optimizer: Optimizer
        criterion: Loss function
        device: Training device (CPU/GPU)
        
    Returns:
        Average training loss
    """
    model.train()
    total_loss = 0.0
    num_batches = 0
    
    for batch_X, batch_y in train_loader:
        batch_X, batch_y = batch_X.to(device), batch_y.to(device)
        
        # Forward pass
        optimizer.zero_grad()
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)
        
        # Backward pass
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        num_batches += 1
    
    return total_loss / num_batches


def evaluate_model(model: nn.Module, val_loader: DataLoader, 
                  criterion: nn.Module, device: torch.device) -> Dict[str, float]:
    """
    Evaluate model performance.
    
    Args:
        model: PyTorch model
        val_loader: Validation data loader
        criterion: Loss function
        device: Evaluation device (CPU/GPU)
        
    Returns:
        Dictionary of evaluation metrics
    """
    model.eval()
    total_loss = 0.0
    all_predictions = []
    all_targets = []
    
    with torch.no_grad():
        for batch_X, batch_y in val_loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            
            total_loss += loss.item()
            
            # Convert to predictions
            predictions = (outputs > 0.5).float()
            all_predictions.extend(predictions.cpu().numpy().flatten())
            all_targets.extend(batch_y.cpu().numpy().flatten())
    
    # Calculate metrics
    all_predictions = np.array(all_predictions)
    all_targets = np.array(all_targets)
    
    metrics = {
        'loss': total_loss / len(val_loader),
        'accuracy': accuracy_score(all_targets, all_predictions),
        'precision': precision_score(all_targets, all_predictions, zero_division=0),
        'recall': recall_score(all_targets, all_predictions, zero_division=0),
        'f1': f1_score(all_targets, all_predictions, zero_division=0)
    }
    
    return metrics


class SVSimulator(fl.client.NumPyClient):
    """
    Flower federated learning client for SuperPage fundraising prediction.

    Simulates a client in the federated learning setup, training on local data
    and participating in weight aggregation.
    """

    def __init__(self, model: nn.Module, train_loader: DataLoader,
                 val_loader: DataLoader, learning_rate: float = 0.001):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

        # Training components
        self.optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        self.criterion = nn.BCELoss()

        logger.info(f"SVSimulator initialized on device: {self.device}")

    def get_parameters(self, config: Dict) -> List[np.ndarray]:
        """Return current model parameters as numpy arrays."""
        return [param.cpu().detach().numpy() for param in self.model.parameters()]

    def set_parameters(self, parameters: List[np.ndarray]) -> None:
        """Set model parameters from numpy arrays."""
        params_dict = zip(self.model.parameters(), parameters)
        for param, new_param in params_dict:
            param.data = torch.tensor(new_param, dtype=param.dtype, device=param.device)

    def fit(self, parameters: List[np.ndarray], config: Dict) -> Tuple[List[np.ndarray], int, Dict]:
        """
        Train model on local data.

        Args:
            parameters: Global model parameters
            config: Training configuration

        Returns:
            Tuple of (updated_parameters, num_examples, metrics)
        """
        # Set global parameters
        self.set_parameters(parameters)

        # Train for one epoch
        train_loss = train_model(
            self.model, self.train_loader, self.optimizer,
            self.criterion, self.device
        )

        # Evaluate on validation set
        val_metrics = evaluate_model(
            self.model, self.val_loader, self.criterion, self.device
        )

        logger.info(f"Client training - Loss: {train_loss:.4f}, "
                   f"Val Accuracy: {val_metrics['accuracy']:.4f}")

        # Return updated parameters and metrics
        return (
            self.get_parameters({}),
            len(self.train_loader.dataset),
            {"train_loss": train_loss, **val_metrics}
        )

    def evaluate(self, parameters: List[np.ndarray], config: Dict) -> Tuple[float, int, Dict]:
        """
        Evaluate model on local validation data.

        Args:
            parameters: Global model parameters
            config: Evaluation configuration

        Returns:
            Tuple of (loss, num_examples, metrics)
        """
        # Set global parameters
        self.set_parameters(parameters)

        # Evaluate model
        metrics = evaluate_model(
            self.model, self.val_loader, self.criterion, self.device
        )

        return metrics['loss'], len(self.val_loader.dataset), metrics


def save_model(model: nn.Module, scaler: StandardScaler,
               model_path: str = "models/latest/fundraising_model.pth",
               scaler_path: str = "models/latest/scaler.pkl") -> None:
    """
    Save trained model and scaler to disk.

    Args:
        model: Trained PyTorch model
        scaler: Fitted StandardScaler
        model_path: Path to save model
        scaler_path: Path to save scaler
    """
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)

        # Save model state dict
        torch.save({
            'model_state_dict': model.state_dict(),
            'model_config': {
                'input_size': model.input_size,
                'hidden_sizes': model.hidden_sizes,
                'dropout_rate': model.dropout_rate
            }
        }, model_path)

        # Save scaler
        import pickle
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)

        logger.info(f"Model saved to {model_path}")
        logger.info(f"Scaler saved to {scaler_path}")

    except Exception as e:
        logger.error(f"Error saving model: {e}")
        raise


def load_model(model_path: str = "models/latest/fundraising_model.pth",
               scaler_path: str = "models/latest/scaler.pkl") -> Tuple[nn.Module, StandardScaler]:
    """
    Load trained model and scaler from disk.

    Args:
        model_path: Path to saved model
        scaler_path: Path to saved scaler

    Returns:
        Tuple of (model, scaler)
    """
    try:
        # Load model
        checkpoint = torch.load(model_path, map_location='cpu')
        model_config = checkpoint['model_config']

        model = FundraisingPredictor(
            input_size=model_config['input_size'],
            hidden_sizes=model_config['hidden_sizes'],
            dropout_rate=model_config['dropout_rate']
        )
        model.load_state_dict(checkpoint['model_state_dict'])

        # Load scaler
        import pickle
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)

        logger.info(f"Model loaded from {model_path}")
        logger.info(f"Scaler loaded from {scaler_path}")

        return model, scaler

    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise


def run_federated_learning(rounds: int = 3, learning_rate: float = 0.001,
                          batch_size: int = 32, num_clients: int = 3) -> None:
    """
    Run federated learning simulation.

    Args:
        rounds: Number of federated learning rounds
        learning_rate: Learning rate for training
        batch_size: Batch size for training
        num_clients: Number of clients to simulate
    """
    logger.info("Starting federated learning simulation")
    logger.info(f"Rounds: {rounds}, LR: {learning_rate}, Batch size: {batch_size}")

    # Initialize data processor
    data_processor = DataProcessor()

    # Load and preprocess data
    X, y = data_processor.load_and_preprocess_data()

    # Create federated data splits
    client_data = data_processor.create_federated_splits(X, y, num_clients)

    # Create clients
    clients = []
    for i, (X_client, y_client) in enumerate(client_data):
        # Create data loaders for this client
        train_loader, val_loader = create_data_loaders(X_client, y_client, batch_size)

        # Create model for this client
        model = FundraisingPredictor()

        # Create client
        client = SVSimulator(model, train_loader, val_loader, learning_rate)
        clients.append(client)

        logger.info(f"Created client {i+1} with {len(X_client)} samples")

    # Simulate federated learning
    logger.info("Starting federated training simulation...")

    # Initialize global model
    global_model = FundraisingPredictor()
    global_params = [param.cpu().detach().numpy() for param in global_model.parameters()]

    for round_num in range(rounds):
        logger.info(f"\n--- Round {round_num + 1}/{rounds} ---")

        # Collect client updates
        client_updates = []
        client_sizes = []

        for i, client in enumerate(clients):
            # Train client
            updated_params, num_examples, metrics = client.fit(global_params, {})
            client_updates.append(updated_params)
            client_sizes.append(num_examples)

            logger.info(f"Client {i+1} - Samples: {num_examples}, "
                       f"Accuracy: {metrics['accuracy']:.4f}")

        # Aggregate parameters (FedAvg)
        total_examples = sum(client_sizes)
        aggregated_params = []

        for param_idx in range(len(global_params)):
            weighted_sum = np.zeros_like(global_params[param_idx])

            for client_idx, client_params in enumerate(client_updates):
                weight = client_sizes[client_idx] / total_examples
                weighted_sum += weight * client_params[param_idx]

            aggregated_params.append(weighted_sum)

        # Update global parameters
        global_params = aggregated_params

        # Set global model parameters
        params_dict = zip(global_model.parameters(), global_params)
        for param, new_param in params_dict:
            param.data = torch.tensor(new_param, dtype=param.dtype, device=param.device)

        logger.info(f"Round {round_num + 1} completed - Parameters aggregated")

    # Save final model
    save_model(global_model, data_processor.scaler)
    logger.info("Federated learning completed successfully!")


def main():
    """Main function with command-line interface."""
    parser = argparse.ArgumentParser(description="SuperPage Federated Learning Training")
    parser.add_argument("--rounds", type=int, default=3,
                       help="Number of federated learning rounds (default: 3)")
    parser.add_argument("--lr", type=float, default=0.001,
                       help="Learning rate (default: 0.001)")
    parser.add_argument("--batch-size", type=int, default=32,
                       help="Batch size for training (default: 32)")
    parser.add_argument("--clients", type=int, default=3,
                       help="Number of federated clients to simulate (default: 3)")
    parser.add_argument("--data-path", type=str, default="Dataset/dummy_dataset_aligned.csv",
                       help="Path to training dataset")

    args = parser.parse_args()

    logger.info("SuperPage Federated Learning Training")
    logger.info("=" * 50)
    logger.info(f"Configuration:")
    logger.info(f"  Rounds: {args.rounds}")
    logger.info(f"  Learning Rate: {args.lr}")
    logger.info(f"  Batch Size: {args.batch_size}")
    logger.info(f"  Clients: {args.clients}")
    logger.info(f"  Data Path: {args.data_path}")
    logger.info("=" * 50)

    try:
        # Run federated learning
        run_federated_learning(
            rounds=args.rounds,
            learning_rate=args.lr,
            batch_size=args.batch_size,
            num_clients=args.clients
        )

    except Exception as e:
        logger.error(f"Training failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
