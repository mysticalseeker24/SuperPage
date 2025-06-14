"""
SuperPage Ingestion Service
Continuously scrapes live StartUp data via Firecrawl MCP SDK
"""

import asyncio
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
import structlog
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv("../../.env")
print(f"🔧 Environment loaded - FIRECRAWL_API_KEY: {'✅ Set' if os.getenv('FIRECRAWL_API_KEY') else '❌ Missing'}")

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

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - startup and shutdown events"""
    global mongo_client, database

    # Startup
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

    yield

    # Shutdown
    if mongo_client:
        mongo_client.close()

    if firecrawl_client:
        firecrawl_client.close()

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="SuperPage Ingestion Service",
    description="StartUp data ingestion service using Firecrawl MCP SDK",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware with frontend URL configuration
allowed_origins = [
    FRONTEND_URL,
    "http://localhost:3000",  # Local development
    "https://superpage-frontend.netlify.app",  # Production frontend
    "https://*.netlify.app",  # Netlify preview deployments
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Environment variables
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "superpage")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Load Web3 sites configuration from JSON file
def load_web3_config():
    """Load Web3 sites configuration from JSON file"""
    try:
        config_path = os.path.join(os.path.dirname(__file__), "web3_sites_config.json")
        with open(config_path, 'r') as f:
            config = json.load(f)

        # Combine all sites into a single list
        all_sites = []
        all_sites.extend(config.get("web3_startup_sites", []))
        all_sites.extend(config.get("additional_web3_sites", []))

        # Extract URLs for backward compatibility
        urls = [site["url"] for site in all_sites]

        return {
            "sites": all_sites,
            "urls": urls,
            "schemas": config.get("extraction_schemas", {})
        }
    except Exception as e:
        print(f"❌ Failed to load Web3 config: {e}")
        return {"sites": [], "urls": [], "schemas": {}}

# Load configuration
WEB3_CONFIG = load_web3_config()
WEB3_STARTUP_SITES = WEB3_CONFIG["urls"]
WEB3_SITES_DATA = WEB3_CONFIG["sites"]
EXTRACTION_SCHEMAS = WEB3_CONFIG["schemas"]
DEFAULT_EXTRACTION_SCHEMA = EXTRACTION_SCHEMAS.get("default", {
    "project_name": "string",
    "description": "string",
    "funding_amount": "string",
    "team_size": "string",
    "website": "string",
    "category": "string",
    "stage": "string",
    "location": "string"
})

# Debug output for configuration
print(f"🔧 Web3 sites config loaded: {'✅ ' + str(len(WEB3_STARTUP_SITES)) + ' sites' if WEB3_STARTUP_SITES else '❌ No sites loaded'}")
if WEB3_SITES_DATA:
    categories = list(set([site.get('category', 'Unknown') for site in WEB3_SITES_DATA]))
    print(f"🔧 Available categories: {', '.join(categories[:5])}{'...' if len(categories) > 5 else ''}")
print(f"🔧 Available schemas: {', '.join(EXTRACTION_SCHEMAS.keys()) if EXTRACTION_SCHEMAS else 'None'}")

# MongoDB client (will be initialized on startup)
mongo_client: Optional[AsyncIOMotorClient] = None
database = None


# Database dependency
def get_database():
    """Get database instance for dependency injection"""
    if database is None:
        raise HTTPException(status_code=503, detail="Database not available")
    return database


# Pydantic models
class IngestRequest(BaseModel):
    """Request model for ingestion endpoint"""
    url: str = Field(..., description="URL to scrape and extract data from")
    extraction_schema: Dict[str, Any] = Field(..., description="Schema for data extraction", alias="schema")
    
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
    extraction_schema: Dict[str, Any]
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
        print(f"✅ Firecrawl client initialized successfully with API key: {FIRECRAWL_API_KEY[:10]}...")
    except FirecrawlError as e:
        print(f"❌ Failed to initialize Firecrawl client: {e}")
        logger.error("Failed to initialize Firecrawl client", error=str(e))
else:
    print(f"❌ No Firecrawl API key found. FIRECRAWL_API_KEY = '{FIRECRAWL_API_KEY}'")


# Event handlers moved to lifespan context manager above


async def process_ingestion(job_id: str, url: str, schema: Dict[str, Any]):
    """
    Background task to process data ingestion
    """
    print(f"🚀 Starting ingestion job {job_id} for URL: {url}")
    logger.info("Starting ingestion job", job_id=job_id, url=url)

    try:
        if not firecrawl_client:
            print(f"❌ Firecrawl client not available for job {job_id}")
            raise Exception("Firecrawl API key not configured")

        print(f"✅ Firecrawl client available, starting extraction for {url}")

        # Extract data using Firecrawl (run in thread pool since it's synchronous)
        import asyncio
        loop = asyncio.get_event_loop()
        extracted_result = await loop.run_in_executor(
            None, firecrawl_client.extract, url, schema
        )

        # Create validated data object
        # For v1 API, extracted data is in data.json for extractions
        extracted_json = extracted_result.get("data", {}).get("json", {})
        metadata = extracted_result.get("data", {}).get("metadata", {})

        extracted_data = ExtractedData(
            job_id=job_id,
            url=url,
            extraction_schema=schema,
            extracted_data=extracted_json,
            timestamp=metadata.get("timestamp", ""),
            status="completed"
        )

        # Store in MongoDB or print for development
        if database is not None:
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
        if database is not None:
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
        if database is not None:
            collection = database["ingestion_jobs"]
            await collection.insert_one({
                "job_id": job_id,
                "url": url,
                "status": "failed",
                "error": str(e),
                "timestamp": ""
            })


async def process_web3_batch_ingestion(job_id: str, urls: List[str], schema: Dict[str, Any]):
    """
    Background task to process batch ingestion from multiple Web3 startup sites
    """
    logger.info("Starting Web3 batch ingestion", job_id=job_id, urls_count=len(urls))

    successful_extractions = 0
    failed_extractions = 0
    all_extracted_data = []

    for i, url in enumerate(urls):
        site_job_id = f"{job_id}-site-{i+1}"
        logger.info("Processing Web3 site", site_job_id=site_job_id, url=url, progress=f"{i+1}/{len(urls)}")

        try:
            if not firecrawl_client:
                raise Exception("Firecrawl API key not configured")

            # Extract data using Firecrawl
            loop = asyncio.get_event_loop()
            extracted_result = await loop.run_in_executor(
                None, firecrawl_client.extract, url, schema
            )

            # Create validated data object
            # For v1 API, extracted data is in data.json for extractions
            extracted_json = extracted_result.get("data", {}).get("json", {})
            metadata = extracted_result.get("data", {}).get("metadata", {})

            extracted_data = ExtractedData(
                job_id=site_job_id,
                url=url,
                extraction_schema=schema,
                extracted_data=extracted_json,
                timestamp=metadata.get("timestamp", ""),
                status="completed"
            )

            all_extracted_data.append(extracted_data.dict())
            successful_extractions += 1
            logger.info("Web3 site extraction successful", site_job_id=site_job_id, url=url)

        except Exception as e:
            failed_extractions += 1
            logger.error("Web3 site extraction failed", site_job_id=site_job_id, url=url, error=str(e))

            # Store failed extraction
            failed_data = {
                "job_id": site_job_id,
                "url": url,
                "extraction_schema": schema,
                "status": "failed",
                "error": str(e),
                "timestamp": ""
            }
            all_extracted_data.append(failed_data)

        # Add delay between requests to be respectful to servers
        await asyncio.sleep(2)

    # Store batch results
    batch_summary = {
        "job_id": job_id,
        "batch_type": "web3_startups",
        "total_sites": len(urls),
        "successful_extractions": successful_extractions,
        "failed_extractions": failed_extractions,
        "completion_timestamp": "",
        "status": "completed",
        "extracted_data": all_extracted_data
    }

    if database is not None:
        collection = database["batch_ingestion_jobs"]
        await collection.insert_one(batch_summary)
        logger.info("Web3 batch ingestion completed and stored", job_id=job_id,
                   successful=successful_extractions, failed=failed_extractions)
    else:
        # Development stub - print the results
        print(f"WEB3 BATCH INGESTION RESULT [{job_id}]:")
        print(f"Successful: {successful_extractions}, Failed: {failed_extractions}")
        print(json.dumps(batch_summary, indent=2))
        logger.info("Web3 batch ingestion completed (printed to console)", job_id=job_id)


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
        request.extraction_schema
    )
    
    return IngestResponse(
        job_id=job_id,
        status="accepted",
        message="Ingestion job started successfully"
    )


@app.get("/health")
async def health_check():
    """Health check endpoint - returns standard health status"""
    try:
        # Check critical dependencies
        is_healthy = (
            bool(FIRECRAWL_API_KEY) and
            bool(firecrawl_client) and
            bool(WEB3_STARTUP_SITES)
        )

        return {
            "status": "ok" if is_healthy else "degraded",
            "service": "ingestion-service",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "dependencies": {
                "firecrawl_configured": bool(FIRECRAWL_API_KEY),
                "firecrawl_client_initialized": bool(firecrawl_client),
                "mongodb_connected": database is not None,
                "web3_sites_configured": bool(WEB3_STARTUP_SITES),
                "web3_sites_count": len(WEB3_STARTUP_SITES)
            }
        }
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return {
            "status": "error",
            "service": "ingestion-service",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get status of a specific ingestion job"""
    if database is None:
        return {"error": "Database not available"}

    collection = database["ingestion_jobs"]
    job = await collection.find_one({"job_id": job_id})

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Remove MongoDB _id field
    job.pop("_id", None)
    return job


@app.post("/ingest/web3-startups", response_model=IngestResponse, status_code=202)
async def ingest_web3_startups(
    background_tasks: BackgroundTasks,
    custom_schema: Optional[Dict[str, Any]] = None,
    schema_name: Optional[str] = None,
    category_filter: Optional[str] = None
) -> IngestResponse:
    """
    Automatically ingest data from configured Web3 startup sites

    Args:
        custom_schema: Custom extraction schema (overrides schema_name)
        schema_name: Name of predefined schema to use (default, tracxn_profile, company_website)
        category_filter: Filter sites by category (e.g., "DeFi Exchange", "NFT Marketplace")
    """
    # Generate unique job ID for batch ingestion
    job_id = str(uuid.uuid4())

    # Filter sites by category if specified
    sites_to_process = WEB3_SITES_DATA
    if category_filter:
        sites_to_process = [site for site in WEB3_SITES_DATA
                          if site.get("category", "").lower() == category_filter.lower()]
        if not sites_to_process:
            raise HTTPException(
                status_code=400,
                detail=f"No sites found for category: {category_filter}"
            )

    # Extract URLs from filtered sites
    urls_to_process = [site["url"] for site in sites_to_process]

    logger.info("Starting Web3 startup batch ingestion",
               job_id=job_id,
               sites_count=len(urls_to_process),
               category_filter=category_filter)

    # Validate Firecrawl API key
    if not FIRECRAWL_API_KEY:
        logger.error("Firecrawl API key not configured")
        raise HTTPException(
            status_code=500,
            detail="Firecrawl API key not configured"
        )

    if not urls_to_process:
        logger.error("No Web3 startup sites to process")
        raise HTTPException(
            status_code=500,
            detail="No Web3 startup sites configured or found for the specified criteria."
        )

    # Determine extraction schema
    if custom_schema:
        extraction_schema = custom_schema
    elif schema_name and schema_name in EXTRACTION_SCHEMAS:
        extraction_schema = EXTRACTION_SCHEMAS[schema_name]
    else:
        extraction_schema = DEFAULT_EXTRACTION_SCHEMA

    # Add background task for batch processing
    background_tasks.add_task(
        process_web3_batch_ingestion,
        job_id,
        urls_to_process,
        extraction_schema
    )

    filter_msg = f" (filtered by category: {category_filter})" if category_filter else ""
    schema_msg = f" using {schema_name} schema" if schema_name else " using default schema"

    return IngestResponse(
        job_id=job_id,
        status="accepted",
        message=f"Web3 startup batch ingestion started for {len(urls_to_process)} sites{filter_msg}{schema_msg}"
    )


@app.get("/web3-sites")
async def get_web3_sites():
    """Get list of configured Web3 startup sites with detailed information"""
    return {
        "sites": WEB3_SITES_DATA,
        "total_count": len(WEB3_SITES_DATA),
        "urls_only": WEB3_STARTUP_SITES,
        "categories": list(set([site.get("category", "Unknown") for site in WEB3_SITES_DATA])),
        "available_schemas": list(EXTRACTION_SCHEMAS.keys()),
        "default_schema": DEFAULT_EXTRACTION_SCHEMA
    }


@app.get("/web3-sites/by-category/{category}")
async def get_web3_sites_by_category(category: str):
    """Get Web3 sites filtered by category"""
    filtered_sites = [site for site in WEB3_SITES_DATA if site.get("category", "").lower() == category.lower()]
    return {
        "category": category,
        "sites": filtered_sites,
        "count": len(filtered_sites)
    }


@app.get("/extraction-schemas")
async def get_extraction_schemas():
    """Get available extraction schemas for different site types"""
    return {
        "schemas": EXTRACTION_SCHEMAS,
        "schema_count": len(EXTRACTION_SCHEMAS),
        "default_schema_name": "default"
    }


@app.get("/predictions/top")
async def get_top_predictions(
    limit: int = 50,
    offset: int = 0,
    min_score: float = 0.0,
    category: Optional[str] = None,
    db=Depends(get_database)
):
    """
    Get top predictions from stored project data

    Args:
        limit: Maximum number of predictions to return (default: 50)
        offset: Number of predictions to skip (default: 0)
        min_score: Minimum prediction score filter (default: 0.0)
        category: Filter by project category (optional)
        db: Database dependency

    Returns:
        List of prediction objects with project data
    """
    logger.info("Fetching top predictions", limit=limit, offset=offset, min_score=min_score, category=category)

    try:
        # Build query filter
        query_filter = {}

        # Add score filter if specified
        if min_score > 0:
            query_filter["prediction_score"] = {"$gte": min_score}

        # Add category filter if specified
        if category:
            query_filter["category"] = {"$regex": category, "$options": "i"}

        # Query database with pagination and sorting
        cursor = db.projects.find(
            query_filter,
            {
                "_id": 0,  # Exclude MongoDB _id field
                "project_id": 1,
                "title": 1,
                "description": 1,
                "category": 1,
                "team_experience": 1,
                "previous_funding": 1,
                "traction": 1,
                "prediction_score": 1,
                "created_at": 1,
                "wallet_address": 1,
                "url": 1
            }
        ).sort("prediction_score", -1).skip(offset).limit(limit)

        # Convert cursor to list
        predictions = []
        async for doc in cursor:
            # Format prediction data for frontend
            prediction = {
                "id": doc.get("project_id", f"project-{len(predictions) + 1}"),
                "projectId": doc.get("project_id", f"startup-{len(predictions) + 1:03d}"),
                "title": doc.get("title", f"Project {len(predictions) + 1}"),
                "score": doc.get("prediction_score", 0.5),
                "timestamp": doc.get("created_at", datetime.utcnow()).isoformat(),
                "teamExperience": doc.get("team_experience", 5.0),
                "previousFunding": doc.get("previous_funding", 0),
                "traction": doc.get("traction", 1000),
                "category": doc.get("category", "Unknown"),
                "walletAddress": doc.get("wallet_address", "0x0000000000000000000000000000000000000000"),
                "description": doc.get("description", ""),
                "url": doc.get("url", "")
            }
            predictions.append(prediction)

        # If no real data found, return sample data for demo
        if not predictions:
            logger.info("No stored predictions found, returning sample data")
            predictions = generate_sample_predictions(limit)

        logger.info("Successfully fetched predictions", count=len(predictions))

        return {
            "predictions": predictions,
            "total": len(predictions),
            "limit": limit,
            "offset": offset,
            "filters": {
                "min_score": min_score,
                "category": category
            }
        }

    except Exception as e:
        logger.error("Failed to fetch predictions", error=str(e))
        # Return sample data as fallback
        return {
            "predictions": generate_sample_predictions(limit),
            "total": limit,
            "limit": limit,
            "offset": offset,
            "error": "Database error, showing sample data"
        }


def generate_sample_predictions(count: int = 50) -> List[Dict]:
    """Generate sample prediction data for demo purposes"""
    import random
    from datetime import datetime, timedelta

    categories = ['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'Social', 'DAO', 'Metaverse', 'AI']

    predictions = []
    for i in range(count):
        predictions.append({
            "id": f"project-{i + 1}",
            "projectId": f"startup-{i + 1:03d}",
            "title": f"Web3 Startup {i + 1}",
            "score": round(random.uniform(0.1, 0.95), 3),
            "timestamp": (datetime.utcnow() - timedelta(days=random.randint(0, 30))).isoformat(),
            "teamExperience": round(random.uniform(1, 15), 1),
            "previousFunding": random.randint(0, 10000000),
            "traction": random.randint(100, 25000),
            "category": random.choice(categories),
            "walletAddress": f"0x{random.randint(0, 16**40):040x}",
            "description": f"Innovative {random.choice(categories)} project focused on decentralized solutions",
            "url": f"https://startup{i + 1}.example.com"
        })

    return predictions


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)
