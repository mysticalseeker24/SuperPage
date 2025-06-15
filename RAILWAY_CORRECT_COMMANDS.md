# 🚂 Railway Correct Commands Guide

## ✅ Fixed Railway CLI Commands

Based on the latest Railway CLI documentation, here are the **correct commands** for deploying SuperPage:

## 🔧 Correct Railway CLI Syntax

### **Create Services:**
```bash
# OLD (INCORRECT): railway service create [name]
# NEW (CORRECT): railway add --service [name]

railway add --service superpage-ingestion
railway add --service superpage-preprocessing
railway add --service superpage-prediction
railway add --service superpage-blockchain
```

### **Link to Service:**
```bash
# Link to a specific service before deploying
railway service [service-name]
```

### **Set Environment Variables:**
```bash
# OLD (INCORRECT): railway variables set KEY="value" --service [name]
# NEW (CORRECT): railway variables --set "KEY=value"

railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
railway variables --set "PORT=8000"
```

## 🚀 Step-by-Step Deployment

### **Step 1: Setup Railway Project**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Add PostgreSQL database
railway add --database postgres
```

### **Step 2: Deploy Ingestion Service**
```bash
# Navigate to service directory
cd backend/ingestion_service

# Create service
railway add --service superpage-ingestion

# Link to the service
railway service superpage-ingestion

# Deploy
railway up

# Set environment variables
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
railway variables --set "FIRECRAWL_API_KEY=fc-62e1fc5b845c40948b28fd133fbef7cf"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"
railway variables --set "PORT=8000"
```

### **Step 3: Deploy Preprocessing Service**
```bash
# Navigate to service directory
cd ../preprocessing_service

# Create service
railway add --service superpage-preprocessing

# Link to the service
railway service superpage-preprocessing

# Deploy
railway up

# Set environment variables
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
railway variables --set "FIRECRAWL_API_KEY=fc-62e1fc5b845c40948b28fd133fbef7cf"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"
railway variables --set "PORT=8000"
```

### **Step 4: Deploy Prediction Service**
```bash
# Navigate to service directory
cd ../prediction_service

# Create service
railway add --service superpage-prediction

# Link to the service
railway service superpage-prediction

# Deploy
railway up

# Set environment variables
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"
railway variables --set "PORT=8000"
```

### **Step 5: Deploy Blockchain Service**
```bash
# Navigate to service directory
cd ../blockchain_service

# Create service
railway add --service superpage-blockchain

# Link to the service
railway service superpage-blockchain

# Deploy
railway up

# Set environment variables
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
railway variables --set "BLOCKCHAIN_PRIVATE_KEY=a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e"
railway variables --set "BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266"
railway variables --set "SUPERPAGE_CONTRACT_ADDRESS=0x45341d82d59b3C4C43101782d97a4dBb97a42dba"
railway variables --set "INFURA_PROJECT_ID=ea1e0f21469f412995bdaaa76ac1c266"
railway variables --set "ETHERSCAN_API_KEY=PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"
railway variables --set "PORT=8000"
```

## 🔍 Verification Commands

### **Check Deployment Status:**
```bash
# View all services
railway status

# Check specific service logs
railway logs

# View environment variables (for current linked service)
railway variables

# View variables for specific service
railway service [service-name]
railway variables
```

### **Test Health Endpoints:**
```bash
curl https://superpage-ingestion.up.railway.app/health
curl https://superpage-preprocessing.up.railway.app/health
curl https://superpage-prediction.up.railway.app/health
curl https://superpage-blockchain.up.railway.app/health
```

## 🛠️ Troubleshooting

### **Common Issues:**

**❌ "unexpected argument 'service-name' found"**
- **Problem**: Using old CLI syntax
- **Solution**: Use `railway add --service [name]` instead of `railway service create [name]`

**❌ "Service not found"**
- **Problem**: Not linked to the correct service
- **Solution**: Run `railway service [service-name]` to link before deploying

**❌ "Build failed"**
- **Problem**: Wrong directory or missing Dockerfile
- **Solution**: Ensure you're in the correct service directory with a Dockerfile

### **Debug Commands:**
```bash
# List all services in project
railway list

# Check current linked service
railway status

# View build logs
railway logs --build

# Connect to service shell
railway shell
```

## 📋 Complete Deployment Script

Here's the corrected automated deployment script:

```bash
#!/bin/bash
# Corrected Railway deployment script

# Setup
railway login
railway init
railway add --database postgres

# Deploy each service
services=("ingestion" "preprocessing" "prediction" "blockchain")

for service in "${services[@]}"; do
    echo "Deploying $service service..."
    
    cd "backend/${service}_service"
    
    # Create and link service
    railway add --service "superpage-$service"
    railway service "superpage-$service"
    
    # Deploy
    railway up
    
    # Set environment variables
    railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
    railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"
    railway variables --set "PORT=8000"
    
    # Service-specific variables
    if [ "$service" = "blockchain" ]; then
        railway variables --set "BLOCKCHAIN_PRIVATE_KEY=a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e"
        railway variables --set "BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266"
        railway variables --set "SUPERPAGE_CONTRACT_ADDRESS=0x45341d82d59b3C4C43101782d97a4dBb97a42dba"
        railway variables --set "INFURA_PROJECT_ID=ea1e0f21469f412995bdaaa76ac1c266"
        railway variables --set "ETHERSCAN_API_KEY=PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA"
    else
        railway variables --set "FIRECRAWL_API_KEY=fc-62e1fc5b845c40948b28fd133fbef7cf"
    fi
    
    cd ../..
    echo "✅ $service deployed"
done

echo "🎉 All services deployed!"
```

---

**🎯 Key Points:**
- Use `railway add --service [name]` to create services
- Use `railway service [name]` to link to a service before deploying
- Use `railway variables --set "KEY=value"` to set environment variables
- Deploy from each service directory individually
