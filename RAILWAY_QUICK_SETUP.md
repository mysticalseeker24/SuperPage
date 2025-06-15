# 🚂 Railway Backend Deployment Guide

## ✅ SuperPage Backend on Railway

Deploy all 4 SuperPage microservices to Railway with PostgreSQL database for a complete production backend.

## 🎯 What You'll Deploy

- **🔧 4 Microservices**: Ingestion, Preprocessing, Prediction, Blockchain
- **🗄️ PostgreSQL Database**: Railway managed database
- **🌐 Public URLs**: Each service gets a Railway subdomain
- **🔄 Auto-deployment**: GitHub integration for continuous deployment

## 🚀 Deployment Options

### **Option 1: Automated Deployment (Easiest)**

```bash
# Make script executable
chmod +x scripts/deploy-to-railway.sh

# Run automated deployment
./scripts/deploy-to-railway.sh
```

This script will:
- ✅ Install Railway CLI if needed
- ✅ Login to Railway
- ✅ Create project and PostgreSQL database
- ✅ Deploy all 4 services individually
- ✅ Set up environment variables
- ✅ Configure database schema

### **Option 2: Manual CLI Deployment**

#### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

#### **Step 2: Create Project & Database**
```bash
railway new SuperPage
railway add postgresql
```

#### **Step 3: Deploy Each Service**

```bash
# Deploy Ingestion Service
cd backend/ingestion_service
railway add --service superpage-ingestion
railway service superpage-ingestion
railway up

# Deploy Preprocessing Service
cd ../preprocessing_service
railway add --service superpage-preprocessing
railway service superpage-preprocessing
railway up

# Deploy Prediction Service
cd ../prediction_service
railway add --service superpage-prediction
railway service superpage-prediction
railway up

# Deploy Blockchain Service
cd ../blockchain_service
railway add --service superpage-blockchain
railway service superpage-blockchain
railway up
```

### **Option 3: Dashboard Deployment (If CLI Fails)**

⚠️ **Note**: Railway's GitHub integration may still deploy the entire repository. Use this only if CLI doesn't work.

1. Create **Empty Project** in Railway dashboard
2. For each service:
   - **+ New** → **Empty Service**
   - **Service Name**: `superpage-[service]`
   - **Settings** → **Source** → **Connect Repo**
   - **Root Directory**: `backend/[service]_service`
   - **Deploy**

### **4. Configure Environment Variables**

For **ALL services**, add these environment variables:

#### **Common Variables:**
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
FIRECRAWL_API_KEY=fc-62e1fc5b845c40948b28fd133fbef7cf
FRONTEND_URL=https://superpage-frontend.netlify.app
PORT=8000
```

#### **Blockchain Service Additional Variables:**
```bash
BLOCKCHAIN_PRIVATE_KEY=a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e
BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266
SUPERPAGE_CONTRACT_ADDRESS=0x45341d82d59b3C4C43101782d97a4dBb97a42dba
INFURA_PROJECT_ID=ea1e0f21469f412995bdaaa76ac1c266
ETHERSCAN_API_KEY=PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA
```

### **5. Set Up Database Schema**
1. Go to PostgreSQL service in Railway
2. **Data** tab → **Query**
3. Copy and paste contents of `scripts/setup-postgres-schema.sql`
4. **Run Query**

### **6. Get Service URLs**
After deployment, your services will be available at:
- `https://superpage-ingestion.up.railway.app`
- `https://superpage-preprocessing.up.railway.app`
- `https://superpage-prediction.up.railway.app`
- `https://superpage-blockchain.up.railway.app`

### **7. Test Services**
```bash
curl https://superpage-ingestion.up.railway.app/health
curl https://superpage-preprocessing.up.railway.app/health
curl https://superpage-prediction.up.railway.app/health
curl https://superpage-blockchain.up.railway.app/health
```

## 🎨 Frontend Deployment (Netlify)

After Railway backend is deployed, deploy the frontend:

1. Go to [netlify.com](https://netlify.com)
2. **New site from Git** → Select SuperPage repo
3. **Build settings:**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. **Environment variables:**
   ```bash
   VITE_API_URL=https://superpage-ingestion.up.railway.app
   VITE_PREDICTION_API_URL=https://superpage-prediction.up.railway.app
   VITE_BLOCKCHAIN_API_URL=https://superpage-blockchain.up.railway.app
   VITE_PREPROCESSING_API_URL=https://superpage-preprocessing.up.railway.app
   VITE_BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266
   VITE_SUPERPAGE_CONTRACT_ADDRESS=0x45341d82d59b3C4C43101782d97a4dBb97a42dba
   ```

📖 **Detailed Guide**: See `NETLIFY_DEPLOYMENT_GUIDE.md` for complete instructions

## 🔧 GitHub Actions Setup

Add these secrets to your GitHub repository:

```bash
# Get from Railway dashboard → Account Settings → Tokens
RAILWAY_TOKEN=your_railway_token

# Get from each service → Settings → Service ID
RAILWAY_INGESTION_SERVICE_ID=service_id
RAILWAY_PREPROCESSING_SERVICE_ID=service_id
RAILWAY_PREDICTION_SERVICE_ID=service_id
RAILWAY_BLOCKCHAIN_SERVICE_ID=service_id

# Get from Netlify
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id
```

## ✅ Verification Checklist

- [ ] PostgreSQL database created and running
- [ ] All 4 services deployed with correct root directories
- [ ] Environment variables set for all services
- [ ] Database schema created
- [ ] All health endpoints return 200 OK
- [ ] Frontend deployed to Netlify
- [ ] GitHub Actions secrets configured

## 🚨 Common Issues

**❌ "No start command found"**
- Ensure you're deploying individual services, not the root repository
- Check that Root Directory is set correctly (e.g., `backend/ingestion_service`)

**❌ "Build failed"**
- Verify the service has a Dockerfile
- Check requirements.txt exists in the service directory

**❌ "Service unhealthy"**
- Check environment variables are set
- Verify database connection
- Review service logs in Railway dashboard

## 📞 Need Help?

- **Full Guide**: `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)

---

**🎯 Key Point: Deploy each service individually with its own root directory!**
