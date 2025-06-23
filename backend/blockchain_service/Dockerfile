# Railway-optimized Multi-Stage Dockerfile for SuperPage Blockchain Service
# Lightweight build with Node.js and Python

# Stage 1: Node.js Builder
FROM node:18-slim AS node-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies and clean cache
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Copy HardHat files
COPY hardhat.config.js ./
COPY scripts/ ./scripts/
COPY contracts/ ./contracts/

# Compile contracts
RUN npx hardhat compile || echo "Contract compilation skipped"

# Stage 2: Python Builder
FROM python:3.9-slim AS python-builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies with aggressive optimization
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    find /usr/local -name "*.pyc" -delete && \
    find /usr/local -name "__pycache__" -type d -exec rm -rf {} + || true

# Copy Python application
COPY main.py .

# Stage 3: Runtime
FROM python:3.9-slim

# Set environment variables for Railway
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PORT=8000
ENV HARDHAT_PROJECT_PATH=/app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node.js (minimal)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python packages from python-builder stage
COPY --from=python-builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=python-builder /usr/local/bin /usr/local/bin

# Copy Node.js files from node-builder stage
COPY --from=node-builder /app/node_modules ./node_modules
COPY --from=node-builder /app/package.json ./package.json
COPY --from=node-builder /app/hardhat.config.js ./hardhat.config.js
COPY --from=node-builder /app/scripts ./scripts
COPY --from=node-builder /app/contracts ./contracts

# Copy Python application from python-builder stage
COPY --from=python-builder /app/main.py .

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose Railway port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Run with Railway's PORT environment variable (JSON format for proper signal handling)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
