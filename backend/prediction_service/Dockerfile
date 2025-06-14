# SuperPage Prediction Service Dockerfile
# Production-ready container for model serving with SHAP explanations

FROM python:3.9-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV FRONTEND_URL="http://localhost:3000"

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy production requirements first for better caching
COPY requirements-prod.txt requirements.txt

# Install Python dependencies with optimizations
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --compile -r requirements.txt

# Copy application code
COPY main.py .
COPY model_loader.py .

# Create models directory and copy trained models
RUN mkdir -p models/latest
RUN echo 'Models directory created - will be mounted at runtime via Docker volume'

# Create logs directory for volume mount
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Expose port (8000 for Render compatibility, 8002 for local development)
EXPOSE 8000
EXPOSE 8002

# Health check (use PORT env var for flexibility)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8002}/health || exit 1

# Default command (use PORT env var for deployment flexibility)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8002}

# Development variant with hot reload
FROM base AS development

USER root
RUN pip install watchdog
USER app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]

# Production variant with optimizations
FROM base AS production

# Copy optimized configuration
ENV WORKERS=4
ENV MAX_REQUESTS=1000
ENV MAX_REQUESTS_JITTER=100

# Use gunicorn for production
RUN pip install gunicorn

CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8002", "--max-requests", "1000", "--max-requests-jitter", "100", "--preload"]
