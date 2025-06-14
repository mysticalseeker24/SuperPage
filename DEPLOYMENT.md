# 🚀 SuperPage Deployment Guide

## Overview
This guide covers deploying SuperPage's microservices architecture to Render.com using Infrastructure as Code.

## 📋 Prerequisites

### 1. Required Accounts & API Keys
- **GitHub Account**: Repository access to https://github.com/mysticalseeker24/SuperPage
- **Render Account**: Sign up at https://render.com
- **MongoDB Atlas**: Database hosting (or use Render PostgreSQL)
- **Firecrawl API**: Web scraping service
- **Infura Account**: Ethereum node access
- **Etherscan API**: Blockchain data

### 2. Environment Variables Required

#### Sensitive Variables (Set manually in Render Dashboard):
```bash
# Firecrawl API for web scraping
FIRECRAWL_API_KEY=fc-62e1fc5b845c40948b28fd133fbef7cf

# MongoDB connection
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/superpage

# Blockchain configuration
BLOCKCHAIN_PRIVATE_KEY=your_ethereum_private_key_here
BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/your_project_id
SEP_RPC_URL=https://sepolia.infura.io/v3/your_project_id
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🏗️ Deployment Steps

### Step 1: Fork Repository
1. Fork https://github.com/mysticalseeker24/SuperPage to your GitHub account
2. Ensure all code is pushed to the `main` branch

### Step 2: Deploy via render.yaml
1. **Login to Render**: Go to https://render.com and sign in
2. **Connect GitHub**: Link your GitHub account in Render
3. **Create New Service**: 
   - Click "New +" → "Blueprint"
   - Select your forked SuperPage repository
   - Render will automatically detect the `render.yaml` file

### Step 3: Configure Environment Variables
For each service, set the sensitive environment variables:

#### Ingestion Service
```bash
FIRECRAWL_API_KEY=your_firecrawl_api_key
MONGODB_URL=your_mongodb_connection_string
```

#### Preprocessing Service
```bash
MONGODB_URL=your_mongodb_connection_string
```

#### Prediction Service
```bash
# Model files will be handled via persistent storage
```

#### Blockchain Service
```bash
BLOCKCHAIN_PRIVATE_KEY=your_ethereum_private_key
BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/your_project_id
SEP_RPC_URL=https://sepolia.infura.io/v3/your_project_id
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Step 4: Database Setup

#### Option A: MongoDB Atlas (Recommended)
1. Create MongoDB Atlas cluster
2. Create database user and get connection string
3. Set `MONGODB_URL` in all services

#### Option B: Render PostgreSQL
1. Render will create PostgreSQL database automatically
2. Update services to use PostgreSQL instead of MongoDB

### Step 5: Model Storage (Prediction Service)
The prediction service requires trained ML models:

1. **Train Models Locally**:
   ```bash
   cd backend/training_service
   python train_federated.py --rounds 5 --lr 0.001 --batch-size 32
   ```

2. **Upload Models**: Use Render's persistent disk or external storage
   - Models should be at: `/app/models/latest/fundraising_model.pth`
   - Scaler at: `/app/models/latest/scaler.pkl`

## 🔧 Service Configuration

### Port Configuration
All services are configured to use:
- **Local Development**: Original ports (8010, 8001, 8002, 8003)
- **Render Deployment**: Port 8000 (via PORT environment variable)

### Health Checks
All services include health check endpoints:
- **Endpoint**: `/health`
- **Expected Response**: 200 OK with service status

### Auto-Deploy
Services are configured for automatic deployment on `main` branch pushes.

## 🌐 Service URLs (After Deployment)
- **Ingestion**: `https://superpage-ingestion.onrender.com`
- **Preprocessing**: `https://superpage-preprocessing.onrender.com`
- **Prediction**: `https://superpage-prediction.onrender.com`
- **Blockchain**: `https://superpage-blockchain.onrender.com`

## 🔍 Monitoring & Debugging

### Health Check URLs
```bash
curl https://superpage-ingestion.onrender.com/health
curl https://superpage-preprocessing.onrender.com/health
curl https://superpage-prediction.onrender.com/health
curl https://superpage-blockchain.onrender.com/health
```

### Logs
Access logs via Render Dashboard:
1. Go to your service
2. Click "Logs" tab
3. Monitor real-time application logs

### Common Issues
1. **Model Loading Failure**: Ensure models are uploaded to prediction service
2. **Database Connection**: Verify MongoDB URL and network access
3. **API Key Issues**: Check all environment variables are set correctly
4. **Build Failures**: Review Dockerfile and requirements.txt

## 🚀 Frontend Deployment (Optional)
To deploy the React frontend:

1. **Uncomment frontend section** in `render.yaml`
2. **Set environment variables**:
   ```bash
   VITE_API_URL=https://superpage-ingestion.onrender.com
   NODE_ENV=production
   ```
3. **Deploy**: Render will build and serve the static site

## 📊 Scaling Considerations
- **Starter Plan**: Good for development and testing
- **Standard Plan**: Recommended for production
- **Auto-scaling**: Configure based on traffic patterns
- **Database**: Consider dedicated database hosting for production

## 🔐 Security Notes
- All sensitive keys are stored as environment variables
- Services run as non-root users
- HTTPS is enforced by Render
- Database connections use encrypted connections

## 📞 Support
- **Render Documentation**: https://render.com/docs
- **SuperPage Issues**: https://github.com/mysticalseeker24/SuperPage/issues
- **Render Support**: Available via dashboard
