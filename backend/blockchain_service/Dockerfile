# SuperPage Blockchain Service Dockerfile
# Multi-stage build for Python FastAPI service with Node.js HardHat integration

FROM node:18-slim AS node-base

# Set working directory
WORKDIR /app

# Install Node.js dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy HardHat configuration and scripts
COPY hardhat.config.js ./
COPY scripts/ ./scripts/
COPY contracts/ ./contracts/

# Compile contracts (optional, for validation)
RUN npx hardhat compile || echo "Contract compilation skipped"

FROM python:3.9-slim AS python-base

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (required for HardHat)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --compile -r requirements.txt

# Copy Node.js files from node-base stage
COPY --from=node-base /app/node_modules ./node_modules
COPY --from=node-base /app/package.json ./package.json
COPY --from=node-base /app/hardhat.config.js ./hardhat.config.js
COPY --from=node-base /app/scripts ./scripts
COPY --from=node-base /app/contracts ./contracts

# Copy Python application code
COPY main.py .

# Create logs directory for volume mount
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Expose port (8000 for Render compatibility, 8003 for local development)
EXPOSE 8000
EXPOSE 8003

# Environment variables for configuration
ENV HARDHAT_PROJECT_PATH=/app
ENV BLOCKCHAIN_NETWORK_URL=http://localhost:8545
ENV FRONTEND_URL="http://localhost:3000"

# Health check (use PORT env var for flexibility)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8003}/health || exit 1

# Default command (use PORT env var for deployment flexibility)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8003}

# Development variant with hot reload
FROM python-base AS development

USER root
RUN pip install watchdog
USER app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003", "--reload"]

# Production variant with optimizations
FROM python-base AS production

# Install gunicorn for production
USER root
RUN pip install gunicorn
USER app

# Production environment variables
ENV WORKERS=2
ENV MAX_REQUESTS=1000
ENV MAX_REQUESTS_JITTER=100

CMD ["gunicorn", "main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8003", "--max-requests", "1000", "--max-requests-jitter", "100", "--preload"]
