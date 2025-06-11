# SuperPage Training Service Dockerfile
# Multi-stage build supporting both CUDA and CPU environments

ARG BASE_IMAGE=python:3.9-slim
FROM ${BASE_IMAGE} as base

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
COPY train_federated.py .
COPY *.py ./

# Create models directory
RUN mkdir -p /app/models/latest

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Environment variable to control server/client mode
ENV FLOWER_MODE=server

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import torch; print('Training service healthy')" || exit 1

# Default command - can be overridden
CMD ["python", "train_federated.py", "--rounds", "3", "--lr", "0.001", "--batch-size", "32"]

# CUDA variant
FROM nvidia/cuda:11.7-runtime-ubuntu20.04 as cuda

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create symlink for python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with CUDA support
RUN pip3 install --upgrade pip && \
    pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu117 && \
    pip3 install -r requirements.txt

# Copy application code
COPY train_federated.py .
COPY *.py ./

# Create models directory
RUN mkdir -p /app/models/latest

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Environment variable to control server/client mode
ENV FLOWER_MODE=server

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print('Training service healthy')" || exit 1

# Default command - can be overridden
CMD ["python", "train_federated.py", "--rounds", "5", "--lr", "0.001", "--batch-size", "64"]
