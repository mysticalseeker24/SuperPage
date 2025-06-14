# Use Python 3.9 slim image for smaller footprint
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    FIRECRAWL_API_KEY="" \
    FRONTEND_URL="http://localhost:3000"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --compile -r requirements.txt

# Copy application code
COPY . .

# Create logs directory for volume mount
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port (8000 for Render compatibility, 8010 for local development)
EXPOSE 8000
EXPOSE 8010

# Health check (use PORT env var for flexibility)
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8010}/health || exit 1

# Run the application with optimal workers (use PORT env var for deployment flexibility)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8010} --workers ${WORKERS:-4}
