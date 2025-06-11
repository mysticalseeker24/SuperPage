"""
SuperPage Preprocessing Service

This service processes raw ingestion data and converts it into ML-ready features
using text cleaning, tokenization, and feature scaling.
"""

import os
import re
import json
from typing import List, Dict, Any, Optional
import asyncio
from functools import lru_cache

import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.feature_extraction.text import TfidfVectorizer
import structlog
from transformers import AutoTokenizer
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
from motor.motor_asyncio import AsyncIOMotorClient

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

logger = structlog.get_logger()

# Initialize FastAPI app
app = FastAPI(
    title="SuperPage Preprocessing Service",
    description="ML feature preprocessing service for fundraising prediction",
    version="1.0.0"
)

# Environment variables
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "superpage")
TOKENIZER_MODEL = os.getenv("TOKENIZER_MODEL", "distilbert-base-uncased")

# Global variables
mongo_client: Optional[AsyncIOMotorClient] = None
database = None
tokenizer = None
scaler = None
text_vectorizer = None


# Pydantic models
class RawProjectData(BaseModel):
    """Model for raw project data from ingestion"""
    project_id: str = Field(..., description="Unique project identifier")
    url: str = Field(..., description="Source URL")
    extracted_data: Dict[str, Any] = Field(..., description="Raw extracted data")
    timestamp: str = Field(..., description="Extraction timestamp")


class ProcessedFeatures(BaseModel):
    """Model for processed ML features"""
    project_id: str = Field(..., description="Project identifier")
    features: List[float] = Field(..., description="Processed feature vector")
    feature_names: List[str] = Field(..., description="Names of features")
    processing_metadata: Dict[str, Any] = Field(..., description="Processing metadata")
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "proj_12345",
                "features": [0.75, 0.82, 0.45, 0.91, 0.33],
                "feature_names": ["team_experience", "pitch_quality", "tokenomics_score", "traction", "community_engagement"],
                "processing_metadata": {
                    "text_fields_processed": 3,
                    "numeric_fields_scaled": 5,
                    "processing_timestamp": "2024-01-15T10:30:00Z"
                }
            }
        }


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    service: str
    version: str
    dependencies: Dict[str, bool]


# Dependency injection
async def get_database():
    """Dependency to get database connection"""
    if not database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    return database


@lru_cache()
def get_tokenizer():
    """Get cached tokenizer instance"""
    global tokenizer
    if tokenizer is None:
        try:
            tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_MODEL)
            logger.info("Tokenizer loaded successfully", model=TOKENIZER_MODEL)
        except Exception as e:
            logger.error("Failed to load tokenizer", error=str(e), model=TOKENIZER_MODEL)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to load tokenizer: {str(e)}"
            )
    return tokenizer


@lru_cache()
def get_scaler():
    """Get cached scaler instance"""
    global scaler
    if scaler is None:
        scaler = MinMaxScaler()
        logger.info("MinMaxScaler initialized")
    return scaler


@lru_cache()
def get_text_vectorizer():
    """Get cached text vectorizer"""
    global text_vectorizer
    if text_vectorizer is None:
        text_vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            lowercase=True,
            ngram_range=(1, 2)
        )
        logger.info("TF-IDF vectorizer initialized")
    return text_vectorizer


# Text processing utilities
def clean_text(text: str) -> str:
    """
    Clean and normalize text data
    
    Args:
        text: Raw text to clean
        
    Returns:
        Cleaned text string
    """
    if not isinstance(text, str):
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove URLs
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    
    # Remove special characters but keep spaces and basic punctuation
    text = re.sub(r'[^\w\s\.\,\!\?]', ' ', text)
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def extract_numeric_features(data: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract and normalize numeric features from raw data
    
    Args:
        data: Raw extracted data
        
    Returns:
        Dictionary of numeric features
    """
    numeric_features = {}
    
    # Define expected numeric fields with defaults
    numeric_fields = {
        'team_experience': 0.0,
        'funding_amount': 0.0,
        'team_size': 1.0,
        'traction_score': 0.0,
        'community_followers': 0.0,
        'github_stars': 0.0,
        'previous_funding': 0.0
    }
    
    for field, default_value in numeric_fields.items():
        value = data.get(field, default_value)
        
        # Handle different data types
        if isinstance(value, (int, float)):
            numeric_features[field] = float(value)
        elif isinstance(value, str):
            # Try to extract numbers from strings
            numbers = re.findall(r'\d+\.?\d*', value)
            if numbers:
                numeric_features[field] = float(numbers[0])
            else:
                numeric_features[field] = default_value
        else:
            numeric_features[field] = default_value
    
    return numeric_features


def extract_text_features(data: Dict[str, Any], tokenizer, vectorizer) -> Dict[str, Any]:
    """
    Extract and process text features
    
    Args:
        data: Raw extracted data
        tokenizer: Hugging Face tokenizer
        vectorizer: TF-IDF vectorizer
        
    Returns:
        Dictionary containing text features
    """
    text_features = {}
    
    # Define text fields to process
    text_fields = ['description', 'title', 'pitch', 'whitepaper_summary', 'team_bio']
    
    # Combine all text fields
    combined_text = ""
    processed_texts = []
    
    for field in text_fields:
        text = data.get(field, "")
        if text:
            cleaned = clean_text(str(text))
            processed_texts.append(cleaned)
            combined_text += " " + cleaned
    
    combined_text = combined_text.strip()
    
    if combined_text:
        # Tokenize with Hugging Face tokenizer
        try:
            tokens = tokenizer.encode(
                combined_text,
                max_length=512,
                truncation=True,
                padding=False
            )
            
            text_features['token_count'] = len(tokens)
            text_features['avg_token_length'] = np.mean([len(tokenizer.decode([t])) for t in tokens[:50]])
            text_features['text_length'] = len(combined_text)
            text_features['sentence_count'] = len(re.split(r'[.!?]+', combined_text))
            
        except Exception as e:
            logger.warning("Tokenization failed", error=str(e))
            text_features['token_count'] = 0
            text_features['avg_token_length'] = 0
            text_features['text_length'] = len(combined_text)
            text_features['sentence_count'] = 1
    else:
        text_features = {
            'token_count': 0,
            'avg_token_length': 0,
            'text_length': 0,
            'sentence_count': 0
        }
    
    return text_features


async def process_project_features(raw_data: Dict[str, Any]) -> ProcessedFeatures:
    """
    Process raw project data into ML-ready features
    
    Args:
        raw_data: Raw project data from ingestion
        
    Returns:
        ProcessedFeatures object with feature vector
    """
    logger.info("Processing project features", project_id=raw_data.get('project_id'))
    
    try:
        # Get dependencies
        tokenizer = get_tokenizer()
        scaler = get_scaler()
        vectorizer = get_text_vectorizer()
        
        extracted_data = raw_data.get('extracted_data', {})
        
        # Extract numeric features
        numeric_features = extract_numeric_features(extracted_data)
        
        # Extract text features
        text_features = extract_text_features(extracted_data, tokenizer, vectorizer)
        
        # Combine all features
        all_features = {**numeric_features, **text_features}
        
        # Create feature vector
        feature_names = list(all_features.keys())
        feature_values = list(all_features.values())
        
        # Scale numeric features (fit_transform for single sample)
        if len(feature_values) > 0:
            # Reshape for single sample
            feature_array = np.array(feature_values).reshape(1, -1)
            
            # For demonstration, we'll use a simple normalization
            # In production, you'd want to use a pre-fitted scaler
            scaled_features = []
            for value in feature_values:
                if isinstance(value, (int, float)) and not np.isnan(value):
                    # Simple min-max normalization (0-1 range)
                    # You would typically use historical data to fit the scaler
                    normalized = max(0, min(1, value / 100.0)) if value > 0 else 0
                    scaled_features.append(normalized)
                else:
                    scaled_features.append(0.0)
        else:
            scaled_features = [0.0] * 5  # Default feature vector
            feature_names = ['default_feature_1', 'default_feature_2', 'default_feature_3', 'default_feature_4', 'default_feature_5']
        
        # Create processing metadata
        processing_metadata = {
            'text_fields_processed': len([k for k in text_features.keys()]),
            'numeric_fields_scaled': len([k for k in numeric_features.keys()]),
            'processing_timestamp': pd.Timestamp.now().isoformat(),
            'tokenizer_model': TOKENIZER_MODEL,
            'total_features': len(scaled_features)
        }
        
        return ProcessedFeatures(
            project_id=raw_data.get('project_id', 'unknown'),
            features=scaled_features,
            feature_names=feature_names,
            processing_metadata=processing_metadata
        )
        
    except Exception as e:
        logger.error("Feature processing failed", error=str(e), project_id=raw_data.get('project_id'))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feature processing failed: {str(e)}"
        )


@app.on_event("startup")
async def startup_event():
    """Initialize database connection and ML models on startup"""
    global mongo_client, database
    
    try:
        # Initialize MongoDB connection
        mongo_client = AsyncIOMotorClient(MONGODB_URL)
        database = mongo_client[DATABASE_NAME]
        
        # Test connection
        await mongo_client.admin.command('ping')
        logger.info("Connected to MongoDB successfully")
        
        # Pre-load ML models
        get_tokenizer()
        get_scaler()
        get_text_vectorizer()
        
        logger.info("Preprocessing service started successfully")
        
    except Exception as e:
        logger.error("Failed to initialize preprocessing service", error=str(e))
        # Continue without MongoDB for development
        logger.warning("Continuing without MongoDB connection")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB connection closed")


@app.get("/features/{project_id}", response_model=ProcessedFeatures)
async def get_project_features(
    project_id: str,
    db=Depends(get_database)
) -> ProcessedFeatures:
    """
    Get processed ML features for a specific project
    
    Args:
        project_id: Unique project identifier
        db: Database dependency
        
    Returns:
        ProcessedFeatures with feature vector and metadata
    """
    logger.info("Fetching project features", project_id=project_id)
    
    try:
        # Query ingestion database for raw data
        collection = db["ingestion_jobs"]
        raw_data = await collection.find_one({"project_id": project_id})
        
        if not raw_data:
            # For development, create mock data if not found
            logger.warning("Project not found in database, using mock data", project_id=project_id)
            raw_data = {
                "project_id": project_id,
                "extracted_data": {
                    "title": "Sample Web3 Project",
                    "description": "A revolutionary blockchain solution for decentralized finance",
                    "team_experience": 5.5,
                    "funding_amount": 1000000,
                    "team_size": 8,
                    "traction_score": 75,
                    "community_followers": 15000
                }
            }
        
        # Process features
        processed_features = await process_project_features(raw_data)
        
        logger.info("Features processed successfully", 
                   project_id=project_id, 
                   feature_count=len(processed_features.features))
        
        return processed_features
        
    except Exception as e:
        logger.error("Failed to process project features", 
                    project_id=project_id, 
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process features: {str(e)}"
        )


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint"""
    dependencies = {
        "mongodb": bool(database),
        "tokenizer": tokenizer is not None,
        "scaler": scaler is not None,
        "vectorizer": text_vectorizer is not None
    }
    
    return HealthResponse(
        status="healthy",
        service="preprocessing-service",
        version="1.0.0",
        dependencies=dependencies
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "SuperPage Preprocessing Service",
        "version": "1.0.0",
        "description": "ML feature preprocessing for fundraising prediction",
        "endpoints": {
            "features": "/features/{project_id}",
            "health": "/health",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
