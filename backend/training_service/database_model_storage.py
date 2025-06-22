#!/usr/bin/env python3
"""
Database Model Storage for SuperPage Training Service

This module handles saving trained models to PostgreSQL database for Railway deployment.
The prediction service can then load models from the database instead of requiring file storage.

Author: SuperPage Team
"""

import os
import pickle
import base64
import logging
from typing import Optional, Dict, Any
from datetime import datetime

import torch
import psycopg2
import psycopg2.extras

logger = logging.getLogger(__name__)


class DatabaseModelStorage:
    """
    Handles saving and loading ML models to/from PostgreSQL database.
    
    This enables the prediction service to access trained models on Railway
    where file storage is ephemeral.
    """
    
    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize database model storage.
        
        Args:
            database_url: PostgreSQL connection URL (defaults to DATABASE_URL env var)
        """
        self.database_url = database_url or os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        self._ensure_table_exists()
    
    def _ensure_table_exists(self):
        """Create the ml_models table if it doesn't exist."""
        try:
            conn = psycopg2.connect(self.database_url)
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ml_models (
                    id SERIAL PRIMARY KEY,
                    model_name VARCHAR(255) NOT NULL,
                    model_data TEXT NOT NULL,
                    scaler_data TEXT NOT NULL,
                    model_config JSONB NOT NULL,
                    training_metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(model_name, created_at)
                );
            """)
            
            # Create index for faster queries
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_ml_models_name_created 
                ON ml_models(model_name, created_at DESC);
            """)
            
            conn.commit()
            conn.close()
            logger.info("ml_models table ensured to exist")
            
        except Exception as e:
            logger.error(f"Failed to create ml_models table: {e}")
            raise
    
    def save_model(self, 
                   model: torch.nn.Module,
                   scaler: Any,
                   model_config: Dict[str, Any],
                   model_name: str = "fundraising_predictor",
                   training_metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Save a trained model and scaler to the database.
        
        Args:
            model: Trained PyTorch model
            scaler: Fitted scikit-learn scaler
            model_config: Model configuration dictionary
            model_name: Name to save the model under
            training_metadata: Optional training metadata
            
        Returns:
            True if saving successful, False otherwise
        """
        try:
            logger.info(f"Saving model '{model_name}' to PostgreSQL database")
            
            # Serialize model to bytes
            import io
            
            # Save model state dict and config
            model_buffer = io.BytesIO()
            torch.save({
                'model_state_dict': model.state_dict(),
                'model_config': model_config
            }, model_buffer)
            model_bytes = model_buffer.getvalue()
            
            # Save scaler
            scaler_buffer = io.BytesIO()
            pickle.dump(scaler, scaler_buffer)
            scaler_bytes = scaler_buffer.getvalue()
            
            # Encode to base64 for database storage
            model_data = base64.b64encode(model_bytes).decode('utf-8')
            scaler_data = base64.b64encode(scaler_bytes).decode('utf-8')
            
            # Connect to database
            conn = psycopg2.connect(self.database_url)
            cursor = conn.cursor()
            
            # Insert model
            cursor.execute("""
                INSERT INTO ml_models (
                    model_name, model_data, scaler_data, 
                    model_config, training_metadata
                ) VALUES (%s, %s, %s, %s, %s);
            """, (
                model_name,
                model_data,
                scaler_data,
                psycopg2.extras.Json(model_config),
                psycopg2.extras.Json(training_metadata or {})
            ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Model '{model_name}' saved successfully to database")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save model to database: {e}")
            return False
    
    def get_latest_model(self, model_name: str = "fundraising_predictor") -> Optional[Dict[str, Any]]:
        """
        Get the latest model from the database.
        
        Args:
            model_name: Name of the model to retrieve
            
        Returns:
            Dictionary with model data or None if not found
        """
        try:
            conn = psycopg2.connect(self.database_url)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT model_data, scaler_data, model_config, 
                       training_metadata, created_at
                FROM ml_models 
                WHERE model_name = %s 
                ORDER BY created_at DESC 
                LIMIT 1;
            """, (model_name,))
            
            result = cursor.fetchone()
            conn.close()
            
            if not result:
                logger.info(f"No model found with name '{model_name}'")
                return None
            
            model_data, scaler_data, model_config, training_metadata, created_at = result
            
            return {
                'model_data': model_data,
                'scaler_data': scaler_data,
                'model_config': model_config,
                'training_metadata': training_metadata,
                'created_at': created_at
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve model from database: {e}")
            return None
    
    def list_models(self) -> list:
        """
        List all models in the database.
        
        Returns:
            List of model information dictionaries
        """
        try:
            conn = psycopg2.connect(self.database_url)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT model_name, model_config, training_metadata, created_at
                FROM ml_models 
                ORDER BY created_at DESC;
            """)
            
            results = cursor.fetchall()
            conn.close()
            
            models = []
            for model_name, model_config, training_metadata, created_at in results:
                models.append({
                    'model_name': model_name,
                    'model_config': model_config,
                    'training_metadata': training_metadata,
                    'created_at': created_at
                })
            
            return models
            
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []
    
    def delete_old_models(self, model_name: str, keep_count: int = 5) -> bool:
        """
        Delete old model versions, keeping only the most recent ones.
        
        Args:
            model_name: Name of the model
            keep_count: Number of recent models to keep
            
        Returns:
            True if deletion successful, False otherwise
        """
        try:
            conn = psycopg2.connect(self.database_url)
            cursor = conn.cursor()
            
            cursor.execute("""
                DELETE FROM ml_models 
                WHERE model_name = %s 
                AND id NOT IN (
                    SELECT id FROM ml_models 
                    WHERE model_name = %s 
                    ORDER BY created_at DESC 
                    LIMIT %s
                );
            """, (model_name, model_name, keep_count))
            
            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            logger.info(f"Deleted {deleted_count} old model versions for '{model_name}'")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete old models: {e}")
            return False


def save_trained_model_to_database(model_path: str, 
                                   scaler_path: str,
                                   model_name: str = "fundraising_predictor") -> bool:
    """
    Convenience function to save a trained model from files to database.
    
    Args:
        model_path: Path to the saved PyTorch model
        scaler_path: Path to the saved scaler
        model_name: Name to save the model under
        
    Returns:
        True if saving successful, False otherwise
    """
    try:
        # Load model from file
        checkpoint = torch.load(model_path, map_location='cpu')
        model_config = checkpoint['model_config']
        
        # Load scaler from file
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        
        # Recreate model
        from model import FundraisingPredictor  # Import your model class
        model = FundraisingPredictor(
            input_size=model_config['input_size'],
            hidden_sizes=model_config['hidden_sizes'],
            dropout_rate=model_config['dropout_rate']
        )
        model.load_state_dict(checkpoint['model_state_dict'])
        
        # Save to database
        storage = DatabaseModelStorage()
        return storage.save_model(
            model=model,
            scaler=scaler,
            model_config=model_config,
            model_name=model_name,
            training_metadata={
                'source_model_path': model_path,
                'source_scaler_path': scaler_path,
                'upload_timestamp': datetime.now().isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to save model from files to database: {e}")
        return False


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Initialize storage
    storage = DatabaseModelStorage()
    
    # List existing models
    models = storage.list_models()
    print(f"Found {len(models)} models in database")
    
    for model in models:
        print(f"- {model['model_name']} (created: {model['created_at']})")
