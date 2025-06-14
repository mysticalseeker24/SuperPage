"""
CORS Configuration for SuperPage Backend Services

This module provides centralized CORS configuration for all FastAPI services.
Customize the allowed origins based on your deployment environment.
"""

import os
from typing import List

def get_cors_origins() -> List[str]:
    """
    Get allowed CORS origins based on environment
    
    Returns:
        List of allowed origins
    """
    # Get environment
    environment = os.getenv("ENVIRONMENT", "development")
    
    if environment == "production":
        # Production origins - customize these for your deployment
        return [
            "https://superpage.app",
            "https://www.superpage.app",
            "https://app.superpage.io",
            # Add your production domains here
        ]
    elif environment == "staging":
        # Staging origins
        return [
            "https://staging.superpage.app",
            "https://dev.superpage.app",
            "http://localhost:3000",
            "http://localhost:3001",
        ]
    else:
        # Development origins - allow local development
        return [
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://localhost:5173",  # Vite default
            "http://127.0.0.1:5173",
            "http://localhost:8080",  # Alternative dev server
            "http://127.0.0.1:8080",
        ]

def get_cors_config() -> dict:
    """
    Get complete CORS configuration
    
    Returns:
        Dictionary with CORS configuration
    """
    environment = os.getenv("ENVIRONMENT", "development")
    
    return {
        "allow_origins": get_cors_origins(),
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": [
            "Accept",
            "Accept-Language", 
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-API-Key",
            "X-Wallet-Address",
            "Origin",
            "Cache-Control",
        ],
        "expose_headers": [
            "X-Total-Count",
            "X-Page-Count", 
            "X-Rate-Limit-Remaining",
            "X-Rate-Limit-Reset",
        ],
        "max_age": 86400 if environment == "production" else 600,  # 24h prod, 10m dev
    }

# For backward compatibility
CORS_ORIGINS = get_cors_origins()
CORS_CONFIG = get_cors_config()
