"""
SuperPage Ingestion Service
Continuously scrapes live StartUp data via Firecrawl MCP SDK
"""

import asyncio
import json
import logging
import os
import uuid
from typing import Any, Dict, Optional

import httpx
import structlog
from fastapi import FastAPI, HTTPException, BackgroundTasks
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
    title="SuperPage Ingestion Service",
    description="StartUp data ingestion service using Firecrawl MCP SDK",
    version="1.0.0"
)

# Environment variables
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "superpage")

# MongoDB client (will be initialized on startup)
mongo_client: Optional[AsyncIOMotorClient] = None
database = None


# Pydantic models
class IngestRequest(BaseModel):
    """Request model for ingestion endpoint"""
    url: str = Field(..., description="URL to scrape and extract data from")
    schema: Dict[str, Any] = Field(..., description="Schema for data extraction")
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://example-web3-project.com",
                "schema": {
                    "project_name": "string",
                    "funding_amount": "number",
                    "team_size": "number",
                    "description": "string"
                }
            }
        }


class IngestResponse(BaseModel):
    """Response model for ingestion endpoint"""
    job_id: str = Field(..., description="Unique job identifier")
    status: str = Field(..., description="Job status")
    message: str = Field(..., description="Status message")


class ExtractedData(BaseModel):
    """Model for validated extracted data"""
    job_id: str
    url: str
    schema: Dict[str, Any]
    extracted_data: Dict[str, Any]
    timestamp: str
    status: str


# Import the FirecrawlClient from our separate module
from firecrawl_client import FirecrawlClient, FirecrawlError


# Initialize Firecrawl client
firecrawl_client = None
if FIRECRAWL_API_KEY:
    try:
        firecrawl_client = FirecrawlClient(FIRECRAWL_API_KEY)
    except FirecrawlError as e:
        logger.error("Failed to initialize Firecrawl client", error=str(e))


@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    global mongo_client, database
    
    try:
        mongo_client = AsyncIOMotorClient(MONGODB_URL)
        database = mongo_client[DATABASE_NAME]
        
        # Test connection
        await mongo_client.admin.command('ping')
        logger.info("Connected to MongoDB successfully")
        
    except Exception as e:
        logger.error("Failed to connect to MongoDB", error=str(e))
        # For development, we'll continue without MongoDB
        logger.warning("Continuing without MongoDB connection")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    if mongo_client:
        mongo_client.close()

    if firecrawl_client:
        firecrawl_client.close()


async def process_ingestion(job_id: str, url: str, schema: Dict[str, Any]):
    """
    Background task to process data ingestion
    """
    logger.info("Starting ingestion job", job_id=job_id, url=url)

    try:
        if not firecrawl_client:
            raise Exception("Firecrawl API key not configured")

        # Extract data using Firecrawl (run in thread pool since it's synchronous)
        import asyncio
        loop = asyncio.get_event_loop()
        extracted_result = await loop.run_in_executor(
            None, firecrawl_client.extract, url, schema
        )
        
        # Create validated data object
        extracted_data = ExtractedData(
            job_id=job_id,
            url=url,
            schema=schema,
            extracted_data=extracted_result.get("data", {}),
            timestamp=extracted_result.get("timestamp", ""),
            status="completed"
        )
        
        # Store in MongoDB or print for development
        if database:
            collection = database["ingestion_jobs"]
            await collection.insert_one(extracted_data.dict())
            logger.info("Data stored in MongoDB", job_id=job_id)
        else:
            # Development stub - print the result
            print(f"INGESTION RESULT [{job_id}]:")
            print(json.dumps(extracted_data.dict(), indent=2))
            logger.info("Data printed to console (MongoDB not available)", job_id=job_id)
        
        logger.info("Ingestion job completed successfully", job_id=job_id)
        
    except ValidationError as e:
        logger.error("Data validation failed", job_id=job_id, error=str(e))
        # Store error status
        if database:
            collection = database["ingestion_jobs"]
            await collection.insert_one({
                "job_id": job_id,
                "url": url,
                "status": "failed",
                "error": str(e),
                "timestamp": ""
            })
    
    except Exception as e:
        logger.error("Ingestion job failed", job_id=job_id, error=str(e))
        # Store error status
        if database:
            collection = database["ingestion_jobs"]
            await collection.insert_one({
                "job_id": job_id,
                "url": url,
                "status": "failed",
                "error": str(e),
                "timestamp": ""
            })


@app.post("/ingest", response_model=IngestResponse, status_code=202)
async def ingest_data(
    request: IngestRequest,
    background_tasks: BackgroundTasks
) -> IngestResponse:
    """
    Ingest data from a URL using Firecrawl extraction
    
    Returns 202 Accepted with job ID for async processing
    """
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    logger.info("Received ingestion request", job_id=job_id, url=request.url)
    
    # Validate Firecrawl API key
    if not FIRECRAWL_API_KEY:
        logger.error("Firecrawl API key not configured")
        raise HTTPException(
            status_code=500,
            detail="Firecrawl API key not configured"
        )
    
    # Add background task for processing
    background_tasks.add_task(
        process_ingestion,
        job_id,
        request.url,
        request.schema
    )
    
    return IngestResponse(
        job_id=job_id,
        status="accepted",
        message="Ingestion job started successfully"
    )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ingestion-service",
        "version": "1.0.0",
        "firecrawl_configured": bool(FIRECRAWL_API_KEY),
        "mongodb_connected": bool(database)
    }


@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get status of a specific ingestion job"""
    if not database:
        return {"error": "Database not available"}
    
    collection = database["ingestion_jobs"]
    job = await collection.find_one({"job_id": job_id})
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Remove MongoDB _id field
    job.pop("_id", None)
    return job


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)
