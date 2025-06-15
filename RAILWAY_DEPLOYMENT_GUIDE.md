# 🚂 SuperPage Railway Deployment Guide

## Why Railway?

Railway is a modern deployment platform that offers:
- ✅ **Zero-config deployments** with automatic builds
- ✅ **Built-in PostgreSQL** database with no payment info required
- ✅ **Automatic HTTPS** and custom domains
- ✅ **Environment variable management**
- ✅ **Real-time logs and metrics**
- ✅ **GitHub integration** with auto-deploys
- ✅ **Paid service available** (you already have this!)

## 🏗️ Architecture Overview

### **Services to Deploy:**
1. **PostgreSQL Database** (Railway managed)
2. **Ingestion Service** (Port 8000) - Web3 data scraping
3. **Preprocessing Service** (Port 8000) - ML feature processing  
4. **Prediction Service** (Port 8000) - ML model serving
5. **Blockchain Service** (Port 8000) - Smart contract integration

### **Frontend:**
- **Netlify** (free tier) - React frontend with Railway API integration

## 🚀 Step-by-Step Deployment

### **1. Create Railway Account & Project**

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. **New Project** → **Empty Project**
4. Name your project: `SuperPage`

**⚠️ Important**: Do NOT deploy the entire repository at once. Railway requires each service to be deployed individually.

### **2. Add PostgreSQL Database**

1. In your Railway project dashboard
2. **+ New** → **Database** → **Add PostgreSQL**
3. Railway automatically provisions the database
4. Note the connection details (automatically available as environment variables)

### **3. Deploy Backend Services**

Deploy each service individually with the correct root directory:

#### **Deploy Ingestion Service:**
1. In your Railway project: **+ New** → **GitHub Repo**
2. Select your `SuperPage` repository
3. **Configure Service:**
   - **Service Name**: `superpage-ingestion`
   - **Root Directory**: `backend/ingestion_service`
   - **Build Command**: Auto-detected from Dockerfile
   - **Start Command**: Auto-detected from Dockerfile
4. **Deploy**

#### **Deploy Preprocessing Service:**
1. **+ New** → **GitHub Repo** → **SuperPage**
2. **Configure Service:**
   - **Service Name**: `superpage-preprocessing`
   - **Root Directory**: `backend/preprocessing_service`
3. **Deploy**

#### **Deploy Prediction Service:**
1. **+ New** → **GitHub Repo** → **SuperPage**
2. **Configure Service:**
   - **Service Name**: `superpage-prediction`
   - **Root Directory**: `backend/prediction_service`
3. **Deploy**

#### **Deploy Blockchain Service:**
1. **+ New** → **GitHub Repo** → **SuperPage**
2. **Configure Service:**
   - **Service Name**: `superpage-blockchain`
   - **Root Directory**: `backend/blockchain_service`
3. **Deploy**

### **4. Configure Environment Variables**

For each service, add these environment variables in Railway dashboard:

#### **All Services:**
```bash
# Database (auto-provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# API Keys
FIRECRAWL_API_KEY=fc-62e1fc5b845c40948b28fd133fbef7cf

# Frontend URL
FRONTEND_URL=https://superpage-frontend.netlify.app

# Service Configuration
PORT=8000
```

#### **Blockchain Service Additional:**
```bash
BLOCKCHAIN_PRIVATE_KEY=a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e
BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266
SUPERPAGE_CONTRACT_ADDRESS=0x45341d82d59b3C4C43101782d97a4dBb97a42dba
INFURA_PROJECT_ID=ea1e0f21469f412995bdaaa76ac1c266
ETHERSCAN_API_KEY=PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA
```

### **5. Get Service URLs**

After deployment, Railway provides URLs for each service:
- **Ingestion**: `https://superpage-ingestion.up.railway.app`
- **Preprocessing**: `https://superpage-preprocessing.up.railway.app`
- **Prediction**: `https://superpage-prediction.up.railway.app`
- **Blockchain**: `https://superpage-blockchain.up.railway.app`

## 🎨 Frontend Deployment (Netlify)

### **1. Deploy to Netlify**
1. Go to [netlify.com](https://netlify.com)
2. **New site from Git** → Select SuperPage repo
3. **Build settings:**
   - **Build command**: `cd frontend && npm run build`
   - **Publish directory**: `frontend/dist`

### **2. Environment Variables**
```bash
VITE_API_URL=https://superpage-ingestion.up.railway.app
VITE_PREDICTION_API_URL=https://superpage-prediction.up.railway.app
VITE_BLOCKCHAIN_API_URL=https://superpage-blockchain.up.railway.app
VITE_PREPROCESSING_API_URL=https://superpage-preprocessing.up.railway.app
```

## 🔧 GitHub Actions CI/CD Setup

### **Required GitHub Secrets:**

```bash
# Railway API Token (get from Railway dashboard → Account Settings → Tokens)
RAILWAY_TOKEN=your_railway_token_here

# Service IDs (get from Railway service settings → Service ID)
RAILWAY_INGESTION_SERVICE_ID=service_id_here
RAILWAY_PREPROCESSING_SERVICE_ID=service_id_here
RAILWAY_PREDICTION_SERVICE_ID=service_id_here
RAILWAY_BLOCKCHAIN_SERVICE_ID=service_id_here

# Netlify (for frontend deployment)
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_netlify_site_id
```

### **How to Get Railway Service IDs:**
1. Go to each service in Railway dashboard
2. **Settings** → **Service** → Copy **Service ID**

## 📊 Database Schema Setup

Railway PostgreSQL comes with a clean database. Run the schema setup:

### **Option 1: Railway Dashboard**
1. Go to your PostgreSQL service
2. **Data** tab → **Query**
3. Copy and paste contents of `scripts/setup-postgres-schema.sql`
4. **Run Query**

### **Option 2: Local Connection**
```bash
# Get DATABASE_URL from Railway dashboard
psql $DATABASE_URL -f scripts/setup-postgres-schema.sql
```

## 🔍 Verification & Testing

### **1. Health Checks**
```bash
# Test all services
curl https://superpage-ingestion.up.railway.app/health
curl https://superpage-preprocessing.up.railway.app/health
curl https://superpage-prediction.up.railway.app/health
curl https://superpage-blockchain.up.railway.app/health

# Expected response:
{
  "status": "ok",
  "service": "service-name",
  "version": "1.0.0"
}
```

### **2. Frontend Test**
```bash
curl https://superpage-frontend.netlify.app
```

### **3. Database Connection**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

## 🚀 Deployment Workflow

### **Automatic Deployment:**
1. **Push to main branch** → Triggers GitHub Actions
2. **Backend services** → Deploy to Railway automatically
3. **Frontend** → Deploy to Netlify automatically
4. **Health checks** → Verify all services are running

### **Manual Deployment:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy specific service
cd backend/ingestion_service
railway up --service your_service_id
```

## 💰 Cost Breakdown

### **Railway (Paid Service):**
- **Starter Plan**: $5/month per service
- **Database**: Included with plan
- **Total**: ~$20/month for 4 services + database

### **Netlify (Free):**
- **Frontend hosting**: Free
- **Build minutes**: 300/month free
- **Bandwidth**: 100GB/month free

### **Total Monthly Cost**: ~$20 (Railway only)

## 🔧 Configuration Files

### **Railway Configuration:**
- `railway.json` (root) - Global settings
- `backend/*/railway.json` - Service-specific settings
- Dockerfile in each service for build instructions

### **Key Features:**
- **Auto-scaling**: Based on traffic
- **Health checks**: Automatic service monitoring
- **Zero-downtime deploys**: Rolling updates
- **Environment management**: Per-service variables

## 📞 Support & Troubleshooting

### **Common Issues:**

**❌ "Build failed"**
- Check Dockerfile syntax
- Verify requirements.txt dependencies
- Check Railway build logs

**❌ "Service unhealthy"**
- Verify health endpoint returns 200
- Check environment variables
- Review service logs in Railway dashboard

**❌ "Database connection failed"**
- Verify DATABASE_URL is set correctly
- Check PostgreSQL service is running
- Test connection from Railway console

### **Railway Resources:**
- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Status**: [status.railway.app](https://status.railway.app)

---

**🎉 With Railway, SuperPage deployment is streamlined and production-ready!**

**Next Steps:**
1. Deploy database and services to Railway
2. Configure environment variables
3. Deploy frontend to Netlify
4. Set up GitHub Actions for CI/CD
5. Monitor and scale as needed
