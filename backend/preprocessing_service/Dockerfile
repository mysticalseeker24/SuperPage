# Railway-optimized Multi-Stage Dockerfile for SuperPage Preprocessing Service
# Ultra-lightweight build to stay under 4GB limit

# Stage 1: Builder
FROM python:3.9-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy Railway-specific requirements
COPY requirements-railway.txt requirements.txt

# Install Python dependencies with CPU-only PyTorch and aggressive optimization
RUN pip install --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt && \
    find /usr/local -name "*.pyc" -delete && \
    find /usr/local -name "__pycache__" -type d -exec rm -rf {} + || true

# Copy application code
COPY . .

# Stage 2: Runtime
FROM python:3.9-slim

# Set environment variables for Railway
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PORT=8000

# Set transformers cache directories to writable locations
ENV TRANSFORMERS_CACHE=/tmp/transformers_cache
ENV HF_HOME=/tmp/huggingface
ENV TOKENIZERS_PARALLELISM=false

# Set working directory
WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code from builder stage
COPY --from=builder /app /app

# Create logs and cache directories with proper permissions
RUN mkdir -p /app/logs && chmod 755 /app/logs && \
    mkdir -p /tmp/transformers_cache && chmod 777 /tmp/transformers_cache && \
    mkdir -p /tmp/huggingface && chmod 777 /tmp/huggingface

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose Railway port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Run with Railway's PORT environment variable
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
