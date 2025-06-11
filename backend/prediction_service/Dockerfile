# SuperPage Prediction Service Dockerfile
# Production-ready container for model serving with SHAP explanations

FROM python:3.9-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY main.py .
COPY model_loader.py .

# Create models directory and copy trained models
RUN mkdir -p models/latest
COPY models/latest/ models/latest/ 2>/dev/null || echo "No models directory found - will be mounted at runtime"

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# Default command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]

# Development variant with hot reload
FROM base as development

USER root
RUN pip install watchdog
USER app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]

# Production variant with optimizations
FROM base as production

# Copy optimized configuration
ENV WORKERS=4
ENV MAX_REQUESTS=1000
ENV MAX_REQUESTS_JITTER=100

# Use gunicorn for production
RUN pip install gunicorn

CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8002", "--max-requests", "1000", "--max-requests-jitter", "100", "--preload"]
