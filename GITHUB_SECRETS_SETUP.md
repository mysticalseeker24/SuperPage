# 🔐 GitHub Secrets Setup Guide

## Required Secrets for CI/CD Pipeline

To enable the automated deployment pipeline, you need to configure the following secrets in your GitHub repository.

### 📍 How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret below

### 🔑 Required Secrets

#### **Render API Configuration**

```bash
# Render API Key (get from Render Dashboard → Account Settings → API Keys)
RENDER_API_KEY=rnd_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Service IDs (get from each service URL: https://dashboard.render.com/web/srv_xxxxx)
RENDER_SERVICE_ID_INGESTION=srv_xxxxxxxxxxxxxxxxxx
RENDER_SERVICE_ID_PREPROCESSING=srv_xxxxxxxxxxxxxxxxxx
RENDER_SERVICE_ID_PREDICTION=srv_xxxxxxxxxxxxxxxxxx
RENDER_SERVICE_ID_BLOCKCHAIN=srv_xxxxxxxxxxxxxxxxxx
```

#### **Netlify Configuration**

```bash
# Netlify Auth Token (get from Netlify → User Settings → Applications → Personal Access Tokens)
NETLIFY_AUTH_TOKEN=nfp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Netlify Site ID (get from Site Settings → General → Site Information)
NETLIFY_SITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 📋 Step-by-Step Setup

#### **1. Get Render API Key**
1. Login to [Render Dashboard](https://dashboard.render.com)
2. Go to **Account Settings** → **API Keys**
3. Click **Create API Key**
4. Copy the key and add as `RENDER_API_KEY` secret

#### **2. Get Render Service IDs**
1. Deploy your services to Render first using the `render.yaml`
2. For each service, go to the service dashboard
3. Copy the service ID from the URL: `https://dashboard.render.com/web/srv_xxxxx`
4. Add each as a secret:
   - `RENDER_SERVICE_ID_INGESTION`
   - `RENDER_SERVICE_ID_PREPROCESSING`
   - `RENDER_SERVICE_ID_PREDICTION`
   - `RENDER_SERVICE_ID_BLOCKCHAIN`

#### **3. Get Netlify Auth Token**
1. Login to [Netlify](https://app.netlify.com)
2. Go to **User Settings** → **Applications**
3. Click **New access token** under **Personal access tokens**
4. Copy the token and add as `NETLIFY_AUTH_TOKEN` secret

#### **4. Get Netlify Site ID**
1. Deploy your frontend to Netlify first
2. Go to **Site Settings** → **General** → **Site Information**
3. Copy the **Site ID** and add as `NETLIFY_SITE_ID` secret

### 🔄 Deployment Flow

Once secrets are configured:

1. **Push to main branch** → Triggers CI/CD pipeline
2. **Backend tests** → Run pytest for all services
3. **Frontend tests** → Run ESLint and build
4. **Docker build** → Build and push images to GHCR
5. **Render deploy** → Trigger deployment via API
6. **Netlify deploy** → Deploy frontend
7. **Health checks** → Verify all services are running

### 🔍 Troubleshooting

#### **Common Issues:**

**❌ "Invalid API key"**
- Check `RENDER_API_KEY` is correct
- Ensure API key has proper permissions

**❌ "Service not found"**
- Verify `RENDER_SERVICE_ID_*` values are correct
- Ensure services are deployed to Render first

**❌ "Netlify deployment failed"**
- Check `NETLIFY_AUTH_TOKEN` is valid
- Verify `NETLIFY_SITE_ID` matches your site

**❌ "Health checks failed"**
- Services may need more time to start
- Check service logs in Render dashboard
- Verify environment variables are set correctly

### 📝 Verification

After setting up secrets, test the pipeline:

1. Make a small change to README.md
2. Commit and push to main branch
3. Go to **Actions** tab in GitHub
4. Watch the deployment pipeline run
5. Check that all steps complete successfully

### 🔒 Security Notes

- **Never commit secrets to code**
- **Use GitHub Secrets for all sensitive data**
- **Rotate API keys regularly**
- **Limit API key permissions to minimum required**

### 📞 Support

If you encounter issues:
1. Check the **Actions** tab for detailed error logs
2. Verify all secrets are set correctly
3. Ensure services are deployed to Render/Netlify first
4. Check service logs in respective dashboards

---

**🎯 Once all secrets are configured, your SuperPage deployment will be fully automated!**
