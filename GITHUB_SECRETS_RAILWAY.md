# 🔐 GitHub Secrets Setup for Railway Deployment

## Required Secrets for CI/CD Pipeline

To enable automated deployment to Railway, configure these secrets in your GitHub repository.

## 📍 How to Add GitHub Secrets

1. Go to your GitHub repository: `https://github.com/mysticalseeker24/SuperPage`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret below

## 🚂 Railway Configuration Secrets

### **1. Railway API Token**

#### **Get Railway Token:**
1. Go to [railway.app](https://railway.app)
2. Sign in to your account
3. **Account Settings** → **Tokens**
4. **Create Token** → Copy the token

#### **Add to GitHub:**
```bash
Secret Name: RAILWAY_TOKEN
Secret Value: your_railway_token_here
```

### **2. Railway Service IDs**

After deploying your services to Railway, get each service ID:

#### **Get Service IDs:**
1. Go to your Railway project dashboard
2. Click on each service
3. **Settings** → **Service** → Copy **Service ID**

#### **Add to GitHub:**
```bash
# Ingestion Service
Secret Name: RAILWAY_INGESTION_SERVICE_ID
Secret Value: service_id_from_railway_dashboard

# Preprocessing Service  
Secret Name: RAILWAY_PREPROCESSING_SERVICE_ID
Secret Value: service_id_from_railway_dashboard

# Prediction Service
Secret Name: RAILWAY_PREDICTION_SERVICE_ID
Secret Value: service_id_from_railway_dashboard

# Blockchain Service
Secret Name: RAILWAY_BLOCKCHAIN_SERVICE_ID
Secret Value: service_id_from_railway_dashboard
```

## 🎨 Netlify Configuration Secrets

### **3. Netlify Authentication**

#### **Get Netlify Token:**
1. Go to [netlify.com](https://netlify.com)
2. **User Settings** → **Applications**
3. **Personal Access Tokens** → **New access token**
4. Copy the token

#### **Get Netlify Site ID:**
1. Go to your deployed site in Netlify
2. **Site Settings** → **General** → **Site Information**
3. Copy the **Site ID**

#### **Add to GitHub:**
```bash
# Netlify Authentication Token
Secret Name: NETLIFY_AUTH_TOKEN
Secret Value: your_netlify_token_here

# Netlify Site ID
Secret Name: NETLIFY_SITE_ID
Secret Value: your_netlify_site_id_here
```

## 🔧 Quick Setup Using Railway CLI

You can use the provided script to automatically configure Railway:

```bash
# Make script executable
chmod +x scripts/setup-railway-env.sh

# Run setup script
./scripts/setup-railway-env.sh
```

The script will:
- ✅ Install Railway CLI if needed
- ✅ Login to Railway
- ✅ Set up environment variables for all services
- ✅ Configure database connections
- ✅ Generate GitHub secrets for you

## 📋 Complete Secrets Checklist

### **Required for Railway Deployment:**
- [ ] `RAILWAY_TOKEN`
- [ ] `RAILWAY_INGESTION_SERVICE_ID`
- [ ] `RAILWAY_PREPROCESSING_SERVICE_ID`
- [ ] `RAILWAY_PREDICTION_SERVICE_ID`
- [ ] `RAILWAY_BLOCKCHAIN_SERVICE_ID`

### **Required for Netlify Deployment:**
- [ ] `NETLIFY_AUTH_TOKEN`
- [ ] `NETLIFY_SITE_ID`

## 🚀 Deployment Flow

Once all secrets are configured:

1. **Push to main branch** → Triggers GitHub Actions
2. **Backend tests** → Run pytest for all services
3. **Frontend tests** → Run ESLint and build
4. **Railway deployment** → Deploy all 4 services
5. **Netlify deployment** → Deploy frontend
6. **Health checks** → Verify all services are running

## 🔍 Verification

### **Test the CI/CD Pipeline:**
1. Make a small change to `README.md`
2. Commit and push to main branch:
   ```bash
   git add README.md
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```
3. Go to **Actions** tab in GitHub
4. Watch the deployment pipeline run
5. Verify all steps complete successfully

### **Check Deployed Services:**
```bash
# Test Railway services
curl https://superpage-ingestion.up.railway.app/health
curl https://superpage-preprocessing.up.railway.app/health
curl https://superpage-prediction.up.railway.app/health
curl https://superpage-blockchain.up.railway.app/health

# Test Netlify frontend
curl https://superpage-frontend.netlify.app
```

## 🔒 Security Best Practices

### **✅ Do:**
- Use GitHub Secrets for all sensitive data
- Rotate API tokens regularly
- Limit token permissions to minimum required
- Monitor deployment logs for any exposed secrets

### **❌ Don't:**
- Commit secrets to code
- Share tokens in chat or email
- Use production tokens for development
- Store secrets in environment files

## 🚨 Troubleshooting

### **Common Issues:**

**❌ "Invalid Railway token"**
- Verify `RAILWAY_TOKEN` is correct
- Check token hasn't expired
- Ensure token has proper permissions

**❌ "Service not found"**
- Verify service IDs are correct
- Ensure services are deployed to Railway
- Check service names match exactly

**❌ "Netlify deployment failed"**
- Verify `NETLIFY_AUTH_TOKEN` is valid
- Check `NETLIFY_SITE_ID` matches your site
- Ensure site is connected to correct repository

**❌ "Health checks failed"**
- Services may need more time to start
- Check Railway service logs
- Verify environment variables are set correctly

### **Debug Commands:**
```bash
# Check Railway services
railway status

# View service logs
railway logs --service superpage-ingestion

# Check environment variables
railway variables --service superpage-ingestion

# Test local deployment
railway run --service superpage-ingestion
```

## 📞 Support Resources

### **Railway:**
- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Status**: [status.railway.app](https://status.railway.app)

### **Netlify:**
- **Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **Support**: [support.netlify.com](https://support.netlify.com)

### **GitHub Actions:**
- **Documentation**: [docs.github.com/en/actions](https://docs.github.com/en/actions)

---

**🎯 Once all secrets are configured, your SuperPage deployment will be fully automated with Railway!**

**Estimated Setup Time:** 10-15 minutes
**Total Monthly Cost:** ~$20 (Railway paid plan)
**Deployment Time:** 5-10 minutes per push
