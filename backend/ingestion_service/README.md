# SuperPage Ingestion Service

The ingestion service continuously scrapes live Web3 data via the Firecrawl MCP SDK and stores structured results for ML processing.

## Features

- **FastAPI-based** REST API service
- **Firecrawl integration** for web scraping and data extraction
- **MongoDB storage** for extracted data
- **Async processing** with background tasks
- **Structured logging** with detailed error handling
- **Health checks** and monitoring endpoints

## API Endpoints

### POST /ingest
Accepts a URL and extraction schema, returns a job ID for async processing.

**Request:**
```json
{
  "url": "https://example-web3-project.com",
  "schema": {
    "project_name": "string",
    "funding_amount": "number",
    "team_size": "number",
    "description": "string"
  }
}
```

**Response:**
```json
{
  "job_id": "uuid-here",
  "status": "accepted",
  "message": "Ingestion job started successfully"
}
```

### GET /health
Health check endpoint for monitoring.

### GET /jobs/{job_id}
Get the status and results of a specific ingestion job.

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `FIRECRAWL_API_KEY`: Your Firecrawl API key
- `MONGODB_URL`: MongoDB connection string
- `DATABASE_NAME`: Database name for storing results

## Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run the service:
   ```bash
   python main.py
   ```

## Docker

Build and run with Docker:

```bash
# Build image
docker build -t superpage-ingestion .

# Run container
docker run -p 8000:8000 \
  -e FIRECRAWL_API_KEY=your_key \
  -e MONGODB_URL=mongodb://host:27017 \
  superpage-ingestion
```

## Testing

The service includes comprehensive error handling and logging. Monitor logs for ingestion job status and any issues with the Firecrawl API or MongoDB connections.
