#!/usr/bin/env python3
"""
SuperPage Prediction Service - FastAPI Application

This service provides real-time fundraising success predictions using the trained
federated learning model with SHAP explanations for interpretability.

Features:
- Load trained PyTorch model at startup
- POST /predict endpoint for feature vector input
- SHAP value computation for top 3 feature explanations
- Thread-safe model serving with comprehensive error handling
- Health checks and monitoring endpoints

Author: SuperPage Team
"""

import os
import sys
import logging
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, List, Any, Optional

import structlog
import uvicorn
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
import numpy as np
import shap
import torch

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model_loader import ModelManager, get_model_manager

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# Environment variables
MODEL_PATH = os.getenv("MODEL_PATH", "../training_service/models/latest/fundraising_model.pth")
SCALER_PATH = os.getenv("SCALER_PATH", "../training_service/models/latest/scaler.pkl")
SHAP_BACKGROUND_SAMPLES = int(os.getenv("SHAP_BACKGROUND_SAMPLES", "100"))

# Global SHAP explainer
shap_explainer: Optional[shap.Explainer] = None


# Pydantic models
class PredictionRequest(BaseModel):
    """Request model for prediction endpoint"""
    features: List[float] = Field(
        ..., 
        description="Feature vector with 7 values: [TeamExperience, PitchQuality, TokenomicsScore, Traction, CommunityEngagement, PreviousFunding, RaiseSuccessProb]",
        min_items=7,
        max_items=7
    )
    
    @field_validator('features')
    @classmethod
    def validate_features(cls, v):
        """Validate feature values are finite numbers"""
        for i, feature in enumerate(v):
            if not isinstance(feature, (int, float)):
                raise ValueError(f"Feature {i} must be a number, got {type(feature)}")
            if not np.isfinite(feature):
                raise ValueError(f"Feature {i} must be finite, got {feature}")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "features": [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]
            }
        }


class FeatureExplanation(BaseModel):
    """Individual feature explanation"""
    feature_name: str = Field(..., description="Name of the feature")
    importance: float = Field(..., description="SHAP importance value")
    feature_value: float = Field(..., description="Input feature value")


class PredictionResponse(BaseModel):
    """Response model for prediction endpoint"""
    score: float = Field(..., description="Fundraising success probability (0-1)")
    explanations: List[FeatureExplanation] = Field(
        ..., 
        description="Top 3 feature explanations ordered by importance"
    )
    model_metadata: Dict[str, Any] = Field(..., description="Model and prediction metadata")
    
    class Config:
        json_schema_extra = {
            "example": {
                "score": 0.7234,
                "explanations": [
                    {
                        "feature_name": "PitchQuality",
                        "importance": 0.1456,
                        "feature_value": 0.75
                    },
                    {
                        "feature_name": "TeamExperience", 
                        "importance": 0.1123,
                        "feature_value": 5.5
                    },
                    {
                        "feature_name": "TokenomicsScore",
                        "importance": 0.0987,
                        "feature_value": 0.82
                    }
                ],
                "model_metadata": {
                    "model_version": "2024-01-15T10:30:00",
                    "device": "cpu",
                    "input_features": 7
                }
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether model is loaded")
    model_info: Dict[str, Any] = Field(..., description="Model information")


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - startup and shutdown events"""
    # Startup
    logger.info("Starting SuperPage Prediction Service")
    
    # Load model
    model_manager = get_model_manager()
    success = model_manager.load_model(MODEL_PATH, SCALER_PATH)
    
    if not success:
        logger.error("Failed to load model at startup")
        raise RuntimeError("Model loading failed")
    
    # Initialize SHAP explainer
    await initialize_shap_explainer(model_manager)
    
    logger.info("Prediction service startup completed")
    
    yield
    
    # Shutdown
    logger.info("Shutting down SuperPage Prediction Service")


# Create FastAPI app
app = FastAPI(
    title="SuperPage Prediction Service",
    description="Real-time fundraising success prediction with SHAP explanations",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def initialize_shap_explainer(model_manager: ModelManager):
    """Initialize SHAP explainer with background data"""
    global shap_explainer
    
    try:
        logger.info("Initializing SHAP explainer")
        
        # Create background dataset for SHAP
        # Use representative samples from the feature space
        background_data = create_background_dataset(SHAP_BACKGROUND_SAMPLES)
        
        # Create a wrapper function for SHAP
        def model_predict(X):
            """Wrapper function for SHAP that returns numpy array"""
            results = []
            for row in X:
                try:
                    score, _ = model_manager.predict(row.tolist())
                    results.append(score)
                except Exception as e:
                    logger.warning(f"SHAP prediction failed for row: {e}")
                    results.append(0.5)  # Default neutral prediction
            return np.array(results)
        
        # Initialize SHAP explainer
        shap_explainer = shap.Explainer(model_predict, background_data)
        logger.info("SHAP explainer initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize SHAP explainer: {e}")
        shap_explainer = None


def create_background_dataset(n_samples: int) -> np.ndarray:
    """
    Create background dataset for SHAP explainer.
    
    Uses realistic ranges for each feature based on the training data.
    """
    np.random.seed(42)  # For reproducibility
    
    # Feature ranges based on dataset analysis
    feature_ranges = {
        "TeamExperience": (0.5, 15.0),      # Years
        "PitchQuality": (0.0, 1.0),         # Normalized score
        "TokenomicsScore": (0.0, 1.0),      # Normalized score
        "Traction": (1, 25000),             # User count/stars
        "CommunityEngagement": (0.0, 0.5),  # Normalized engagement
        "PreviousFunding": (0, 100000000),  # USD
        "RaiseSuccessProb": (0.0, 1.0)      # Computed probability
    }
    
    background_samples = []
    
    for _ in range(n_samples):
        sample = []
        for feature_name in ["TeamExperience", "PitchQuality", "TokenomicsScore", 
                           "Traction", "CommunityEngagement", "PreviousFunding", "RaiseSuccessProb"]:
            min_val, max_val = feature_ranges[feature_name]
            
            if feature_name == "Traction":
                # Log-normal distribution for traction
                value = np.random.lognormal(np.log(100), 1.5)
                value = np.clip(value, min_val, max_val)
            elif feature_name == "PreviousFunding":
                # Log-normal distribution for funding
                value = np.random.lognormal(np.log(50000), 2.0)
                value = np.clip(value, min_val, max_val)
            else:
                # Uniform distribution for other features
                value = np.random.uniform(min_val, max_val)
            
            sample.append(float(value))
        
        background_samples.append(sample)
    
    return np.array(background_samples)


def compute_shap_explanations(features: List[float], model_manager: ModelManager) -> List[FeatureExplanation]:
    """
    Compute SHAP explanations for the given features.
    
    Args:
        features: Input feature vector
        model_manager: Loaded model manager
        
    Returns:
        List of top 3 feature explanations
    """
    try:
        if shap_explainer is None:
            logger.warning("SHAP explainer not available, returning empty explanations")
            return []
        
        # Compute SHAP values
        features_array = np.array(features).reshape(1, -1)
        shap_values = shap_explainer(features_array)
        
        # Get feature names
        feature_names = model_manager.get_feature_names()
        
        # Create explanations with absolute importance values
        explanations = []
        for i, (name, importance, value) in enumerate(zip(feature_names, shap_values.values[0], features)):
            explanations.append(FeatureExplanation(
                feature_name=name,
                importance=float(importance),
                feature_value=float(value)
            ))
        
        # Sort by absolute importance and return top 3
        explanations.sort(key=lambda x: abs(x.importance), reverse=True)
        return explanations[:3]
        
    except Exception as e:
        logger.error(f"SHAP computation failed: {e}")
        # Return fallback explanations
        feature_names = model_manager.get_feature_names()
        return [
            FeatureExplanation(
                feature_name=feature_names[i],
                importance=0.0,
                feature_value=float(features[i])
            ) for i in range(min(3, len(features)))
        ]


# API Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check(model_manager: ModelManager = Depends(get_model_manager)) -> HealthResponse:
    """Health check endpoint"""
    model_info = model_manager.get_model_info()
    
    return HealthResponse(
        status="healthy" if model_manager.is_loaded() else "unhealthy",
        model_loaded=model_manager.is_loaded(),
        model_info=model_info
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict_fundraising_success(
    request: PredictionRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> PredictionResponse:
    """
    Predict fundraising success probability with SHAP explanations
    
    Accepts a feature vector and returns prediction score with top 3 feature explanations.
    """
    logger.info("Received prediction request", features_count=len(request.features))
    
    try:
        # Validate model is loaded
        if not model_manager.is_loaded():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Model not loaded"
            )
        
        # Make prediction
        score, prediction_metadata = model_manager.predict(request.features)
        
        # Compute SHAP explanations
        explanations = compute_shap_explanations(request.features, model_manager)
        
        logger.info("Prediction completed", score=score, explanations_count=len(explanations))
        
        return PredictionResponse(
            score=score,
            explanations=explanations,
            model_metadata=prediction_metadata
        )
        
    except ValueError as e:
        logger.error("Prediction validation error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Prediction failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction service error"
        )


@app.get("/model/info")
async def get_model_info(model_manager: ModelManager = Depends(get_model_manager)) -> Dict[str, Any]:
    """Get detailed model information"""
    return model_manager.get_model_info()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "SuperPage Prediction Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "predict": "/predict",
            "health": "/health",
            "model_info": "/model/info"
        }
    }


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )
