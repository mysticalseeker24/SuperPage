# 🔗 Railway Service URL Verification Guide

## 🎯 **Get Your Railway Service URLs**

Since all your Railway services run on port 8080, here's how to get the correct URLs for frontend integration:

### **Method 1: Railway CLI Status**
```powershell
# Check all services and their URLs
railway status

# Expected output:
# ┌─────────────────────────────────────────────────────────────────┐
# │                        SuperPage Services                       │
# ├─────────────────────┬─────────────────────────────────────────────┤
# │ Service             │ URL                                         │
# ├─────────────────────┼─────────────────────────────────────────────┤
# │ superpage-ingestion │ https://superpage-ingestion-abc123.up.railway.app │
# │ superpage-preprocessing │ https://superpage-preprocessing-def456.up.railway.app │
# │ superpage-prediction │ https://superpage-prediction-ghi789.up.railway.app │
# │ superpage-blockchain │ https://superpage-blockchain-jkl012.up.railway.app │
# └─────────────────────┴─────────────────────────────────────────────┘
```

### **Method 2: Railway Dashboard**
```powershell
# Open Railway dashboard in browser
railway open

# Then copy URLs from each service's overview page
```

### **Method 3: Individual Service Check**
```powershell
# Check each service individually
Set-Location backend\ingestion_service
railway status
# Copy the URL shown

Set-Location ..\preprocessing_service
railway status
# Copy the URL shown

Set-Location ..\prediction_service
railway status
# Copy the URL shown

Set-Location ..\blockchain_service
railway status
# Copy the URL shown
```

## ✅ **Verify Service URLs Work**

Test each service URL to ensure they're responding:

### **Health Check Commands:**
```powershell
# Test Ingestion Service
Invoke-RestMethod -Uri "https://superpage-ingestion-[your-id].up.railway.app/health"

# Test Preprocessing Service  
Invoke-RestMethod -Uri "https://superpage-preprocessing-[your-id].up.railway.app/health"

# Test Prediction Service
Invoke-RestMethod -Uri "https://superpage-prediction-[your-id].up.railway.app/health"

# Test Blockchain Service
Invoke-RestMethod -Uri "https://superpage-blockchain-[your-id].up.railway.app/health"
```

### **Expected Health Response:**
```json
{
  "status": "ok",
  "service": "ingestion-service",
  "version": "1.0.0",
  "dependencies": {
    "firecrawl_configured": true,
    "database_connected": true,
    "database_type": "postgresql"
  }
}
```

## 🔧 **Update Netlify Environment Variables**

Once you have your Railway URLs, update Netlify:

### **Step 1: Go to Netlify Dashboard**
1. Visit: https://app.netlify.com
2. Select your SuperPage site
3. Go to **Site Settings → Environment Variables**

### **Step 2: Add/Update Variables**
Replace `[your-id]` with your actual Railway service IDs:

```
REACT_APP_INGESTION_URL = https://superpage-ingestion-[your-id].up.railway.app
REACT_APP_PREPROCESSING_URL = https://superpage-preprocessing-[your-id].up.railway.app
REACT_APP_PREDICTION_URL = https://superpage-prediction-[your-id].up.railway.app
REACT_APP_BLOCKCHAIN_URL = https://superpage-blockchain-[your-id].up.railway.app
```

### **Step 3: Trigger Redeploy**
1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy → Deploy site**
3. Wait for deployment to complete

## 🧪 **Test Frontend Integration**

### **Browser Console Test:**
1. Open your Netlify site
2. Open browser Developer Tools (F12)
3. Go to **Console** tab
4. Look for API request logs like:
   ```
   🚀 API Request: GET https://superpage-prediction-abc123.up.railway.app/health
   ✅ API Response: 200 https://superpage-prediction-abc123.up.railway.app/health
   ```

### **Network Tab Test:**
1. Go to **Network** tab in Developer Tools
2. Refresh the page
3. Look for successful requests to your Railway URLs
4. Check for any failed requests (red entries)

## 🔍 **Troubleshooting**

### **Issue: Service URL Returns 404**
```
GET https://service.up.railway.app/health 404 (Not Found)
```

**Solutions:**
1. **Check service is deployed:**
   ```powershell
   railway status
   ```

2. **Check service logs:**
   ```powershell
   Set-Location backend\[service-name]
   railway logs
   ```

3. **Redeploy if needed:**
   ```powershell
   railway up --detach
   ```

### **Issue: CORS Errors**
```
Access to fetch blocked by CORS policy
```

**Solution:**
```powershell
# Update FRONTEND_URL for each service
Set-Location backend\ingestion_service
railway variables --set "FRONTEND_URL=https://your-netlify-site.netlify.app"

Set-Location ..\preprocessing_service
railway variables --set "FRONTEND_URL=https://your-netlify-site.netlify.app"

Set-Location ..\prediction_service
railway variables --set "FRONTEND_URL=https://your-netlify-site.netlify.app"

Set-Location ..\blockchain_service
railway variables --set "FRONTEND_URL=https://your-netlify-site.netlify.app"
```

### **Issue: Service Sleeping**
Railway services may sleep after inactivity.

**Solution:**
1. **Make a request to wake up:**
   ```powershell
   Invoke-RestMethod -Uri "https://your-service.up.railway.app/health"
   ```

2. **Check logs for startup:**
   ```powershell
   railway logs --follow
   ```

## 📋 **Quick Checklist**

✅ **Get all 4 Railway service URLs**  
✅ **Test each URL responds to /health**  
✅ **Update Netlify environment variables**  
✅ **Trigger Netlify redeploy**  
✅ **Test frontend API calls in browser console**  
✅ **Fix any CORS issues**  
✅ **Verify end-to-end prediction flow**  

## 🎯 **Example Working URLs**

Your URLs will look like this (with different random IDs):

```
✅ Ingestion: https://superpage-ingestion-production-a1b2.up.railway.app
✅ Preprocessing: https://superpage-preprocessing-production-c3d4.up.railway.app  
✅ Prediction: https://superpage-prediction-production-e5f6.up.railway.app
✅ Blockchain: https://superpage-blockchain-production-g7h8.up.railway.app
```

All services automatically run on port 8080 internally but are accessible via standard HTTPS (port 443) externally.

Your SuperPage frontend will now connect seamlessly to your Railway backend! 🚀
