# 🚂 Railway CLI Deployment Guide

## Problem: Railway GitHub Integration Deploys Entire Repository

Railway's GitHub integration automatically detects the entire repository, not individual services. The solution is to use **Railway CLI** for precise service deployment.

## 🔧 Solution: Deploy via Railway CLI

### **Step 1: Install Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Verify installation
railway --version
```

### **Step 2: Login to Railway**

```bash
# Login to Railway
railway login

# This will open a browser window for authentication
```

### **Step 3: Create Railway Project**

```bash
# Create new project
railway new

# Or link to existing project
railway link [project-id]
```

### **Step 4: Deploy Each Service Individually**

#### **Deploy Ingestion Service:**
```bash
# Navigate to service directory
cd backend/ingestion_service

# Initialize Railway service
railway service create superpage-ingestion

# Deploy the service
railway up

# Set environment variables
railway variables set DATABASE_URL="${{Postgres.DATABASE_URL}}"
railway variables set FIRECRAWL_API_KEY="fc-62e1fc5b845c40948b28fd133fbef7cf"
railway variables set FRONTEND_URL="https://superpage-frontend.netlify.app"
railway variables set PORT="8000"
```

#### **Deploy Preprocessing Service:**
```bash
# Navigate to service directory
cd ../preprocessing_service

# Create new service
railway service create superpage-preprocessing

# Deploy
railway up

# Set environment variables
railway variables set DATABASE_URL="${{Postgres.DATABASE_URL}}"
railway variables set FIRECRAWL_API_KEY="fc-62e1fc5b845c40948b28fd133fbef7cf"
railway variables set FRONTEND_URL="https://superpage-frontend.netlify.app"
railway variables set PORT="8000"
```

#### **Deploy Prediction Service:**
```bash
# Navigate to service directory
cd ../prediction_service

# Create new service
railway service create superpage-prediction

# Deploy
railway up

# Set environment variables
railway variables set DATABASE_URL="${{Postgres.DATABASE_URL}}"
railway variables set FRONTEND_URL="https://superpage-frontend.netlify.app"
railway variables set PORT="8000"
```

#### **Deploy Blockchain Service:**
```bash
# Navigate to service directory
cd ../blockchain_service

# Create new service
railway service create superpage-blockchain

# Deploy
railway up

# Set environment variables
railway variables set DATABASE_URL="${{Postgres.DATABASE_URL}}"
railway variables set BLOCKCHAIN_PRIVATE_KEY="a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e"
railway variables set BLOCKCHAIN_NETWORK_URL="https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266"
railway variables set SUPERPAGE_CONTRACT_ADDRESS="0x45341d82d59b3C4C43101782d97a4dBb97a42dba"
railway variables set INFURA_PROJECT_ID="ea1e0f21469f412995bdaaa76ac1c266"
railway variables set ETHERSCAN_API_KEY="PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA"
railway variables set FRONTEND_URL="https://superpage-frontend.netlify.app"
railway variables set PORT="8000"
```

### **Step 5: Add PostgreSQL Database**

```bash
# Add PostgreSQL database to project
railway add postgresql

# The database URL will be automatically available as ${{Postgres.DATABASE_URL}}
```

### **Step 6: Set Up Database Schema**

```bash
# Get database URL
railway variables get DATABASE_URL

# Connect and run schema setup
psql [DATABASE_URL] -f ../../scripts/setup-postgres-schema.sql
```

## 🔄 **Option 2: Manual Service Creation in Dashboard**

If you prefer using the Railway dashboard:

### **Step 1: Create Empty Project**
1. Go to [railway.app](https://railway.app)
2. **New Project** → **Empty Project**
3. Name: `SuperPage`

### **Step 2: Create Services Manually**
1. **+ New** → **Empty Service**
2. **Service Name**: `superpage-ingestion`
3. **Settings** → **Source** → **Connect Repo**
4. **Root Directory**: `backend/ingestion_service`
5. **Deploy**

Repeat for each service with the correct root directory.

## 🔧 **Option 3: Use Separate Repositories (Alternative)**

Create separate repositories for each service:

```bash
# Create separate repos
git subtree push --prefix=backend/ingestion_service origin ingestion-service
git subtree push --prefix=backend/preprocessing_service origin preprocessing-service
git subtree push --prefix=backend/prediction_service origin prediction-service
git subtree push --prefix=backend/blockchain_service origin blockchain-service
```

Then deploy each repository separately in Railway.

## ✅ **Verification**

After deployment, check your services:

```bash
# List all services
railway status

# Check service logs
railway logs --service superpage-ingestion

# Test health endpoints
curl https://superpage-ingestion.up.railway.app/health
curl https://superpage-preprocessing.up.railway.app/health
curl https://superpage-prediction.up.railway.app/health
curl https://superpage-blockchain.up.railway.app/health
```

## 🚨 **Common Issues & Solutions**

### **Issue: "Service already exists"**
```bash
# List existing services
railway services

# Link to existing service
railway service link [service-name]
```

### **Issue: "Build failed"**
```bash
# Check build logs
railway logs --build

# Ensure Dockerfile exists in service directory
ls -la Dockerfile
```

### **Issue: "Environment variables not set"**
```bash
# List current variables
railway variables

# Set missing variables
railway variables set KEY="value"
```

## 📋 **Complete Deployment Script**

Here's a complete script to deploy all services:

```bash
#!/bin/bash
# Complete Railway deployment script

echo "🚂 Deploying SuperPage to Railway..."

# Login to Railway
railway login

# Create project (if not exists)
railway new SuperPage

# Add PostgreSQL database
railway add postgresql

# Deploy each service
services=("ingestion" "preprocessing" "prediction" "blockchain")

for service in "${services[@]}"; do
    echo "Deploying $service service..."
    
    cd backend/${service}_service
    
    # Create service
    railway service create superpage-$service
    
    # Deploy
    railway up
    
    # Set common environment variables
    railway variables set DATABASE_URL="\${{Postgres.DATABASE_URL}}"
    railway variables set FRONTEND_URL="https://superpage-frontend.netlify.app"
    railway variables set PORT="8000"
    
    # Set service-specific variables
    if [ "$service" = "blockchain" ]; then
        railway variables set BLOCKCHAIN_PRIVATE_KEY="a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e"
        railway variables set BLOCKCHAIN_NETWORK_URL="https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266"
        railway variables set SUPERPAGE_CONTRACT_ADDRESS="0x45341d82d59b3C4C43101782d97a4dBb97a42dba"
        railway variables set INFURA_PROJECT_ID="ea1e0f21469f412995bdaaa76ac1c266"
        railway variables set ETHERSCAN_API_KEY="PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA"
    else
        railway variables set FIRECRAWL_API_KEY="fc-62e1fc5b845c40948b28fd133fbef7cf"
    fi
    
    cd ../..
    echo "✅ $service service deployed"
done

echo "🎉 All services deployed successfully!"
echo "Run 'railway status' to check deployment status"
```

---

**🎯 Recommended Approach: Use Railway CLI for precise control over individual service deployment.**
