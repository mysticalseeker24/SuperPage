# 🚂 Railway Quick Setup Guide

## ⚠️ Important: Individual Service Deployment

Railway requires each microservice to be deployed **individually** with its own root directory. Do NOT deploy the entire repository at once.

## 🚀 Step-by-Step Deployment

### **1. Create Railway Project**
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. **New Project** → **Empty Project**
4. Name: `SuperPage`

### **2. Add PostgreSQL Database**
1. In your project: **+ New** → **Database** → **Add PostgreSQL**
2. Railway automatically provisions the database
3. Note the connection string (available as `${{Postgres.DATABASE_URL}}`)

### **3. Deploy Each Service Individually**

#### **Service 1: Ingestion Service**
1. **+ New** → **GitHub Repo**
2. Select: `mysticalseeker24/SuperPage`
3. **Root Directory**: `backend/ingestion_service`
4. **Service Name**: `superpage-ingestion`
5. **Deploy**

#### **Service 2: Preprocessing Service**
1. **+ New** → **GitHub Repo**
2. Select: `mysticalseeker24/SuperPage`
3. **Root Directory**: `backend/preprocessing_service`
4. **Service Name**: `superpage-preprocessing`
5. **Deploy**

#### **Service 3: Prediction Service**
1. **+ New** → **GitHub Repo**
2. Select: `mysticalseeker24/SuperPage`
3. **Root Directory**: `backend/prediction_service`
4. **Service Name**: `superpage-prediction`
5. **Deploy**

#### **Service 4: Blockchain Service**
1. **+ New** → **GitHub Repo**
2. Select: `mysticalseeker24/SuperPage`
3. **Root Directory**: `backend/blockchain_service`
4. **Service Name**: `superpage-blockchain`
5. **Deploy**

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

1. Go to [netlify.com](https://netlify.com)
2. **New site from Git** → Select SuperPage repo
3. **Build settings:**
   - **Build command**: `cd frontend && npm run build`
   - **Publish directory**: `frontend/dist`
4. **Environment variables:**
   ```bash
   VITE_API_URL=https://superpage-ingestion.up.railway.app
   VITE_PREDICTION_API_URL=https://superpage-prediction.up.railway.app
   VITE_BLOCKCHAIN_API_URL=https://superpage-blockchain.up.railway.app
   VITE_PREPROCESSING_API_URL=https://superpage-preprocessing.up.railway.app
   ```

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
