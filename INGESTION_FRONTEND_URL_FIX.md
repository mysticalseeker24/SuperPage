# 🔧 Ingestion Service FRONTEND_URL Fix

## ❌ **Error Encountered:**
```
NameError: name 'FRONTEND_URL' is not defined
```

## 🔍 **Root Cause:**
The `FRONTEND_URL` environment variable was being used in the CORS middleware configuration before it was defined. The variable was referenced on line 97 but not defined until line 116.

## ✅ **Fix Applied:**

### **Variable Order Fix** (`main.py`)
Moved environment variables to the top, before FastAPI app initialization:

```python
# Environment variables (must be defined before use)
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL")  # PostgreSQL for Railway
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")  # Fallback for development
DATABASE_NAME = os.getenv("DATABASE_NAME", "superpage")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="SuperPage Ingestion Service",
    description="StartUp data ingestion service using Firecrawl MCP SDK",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware with frontend URL configuration
allowed_origins = [
    FRONTEND_URL,  # Now properly defined
    "http://localhost:3000",  # Local development
    "https://superpage-frontend.netlify.app",  # Production frontend
    "https://*.netlify.app",  # Netlify preview deployments
]
```

## 🚀 **Redeploy Instructions:**

### **PowerShell Commands:**
```powershell
# Navigate to ingestion service
Set-Location backend\ingestion_service

# Redeploy with variable order fix
railway up --detach

# Monitor deployment logs
railway logs --follow

# Check for successful startup
railway logs | Select-String "Application startup complete"
```

## 📊 **Expected Results:**

### **Successful Startup:**
✅ **Environment variables loaded** in correct order  
✅ **CORS middleware configured** with proper FRONTEND_URL  
✅ **FastAPI app initializes** without NameError  
✅ **Database connection configured** (PostgreSQL for Railway)  
✅ **Firecrawl client initialized** with API key  
✅ **Service starts successfully**  

### **Service Logs:**
```
🔧 Environment loaded - FIRECRAWL_API_KEY: ✅ Set
✅ Firecrawl client initialized successfully with API key: fc-62e1fc5...
🔧 Web3 sites config loaded: ✅ 15 sites
[INFO] Using PostgreSQL database for Railway deployment
[INFO] PostgreSQL connection configured successfully
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8080
```

## 🔍 **Verification Commands:**

### **Health Check:**
```powershell
# Test health endpoint
Invoke-RestMethod -Uri "https://your-ingestion-service.railway.app/health"

# Expected response:
{
  "status": "ok",
  "service": "ingestion-service",
  "version": "1.0.0",
  "dependencies": {
    "firecrawl_configured": true,
    "firecrawl_client_initialized": true,
    "database_connected": true,
    "database_type": "postgresql",
    "web3_sites_configured": true,
    "web3_sites_count": 15
  }
}
```

### **CORS Test:**
```powershell
# Test CORS headers
Invoke-WebRequest -Uri "https://your-ingestion-service.railway.app/health" `
    -Headers @{"Origin"="https://superpage-frontend.netlify.app"} `
    -Method OPTIONS
```

## 📝 **Key Fix:**

This was the same issue we encountered with the preprocessing service - environment variables being used before definition. The fix ensures:

1. **Proper Variable Order**: Environment variables defined before use
2. **CORS Configuration**: Frontend URL properly available for CORS setup
3. **Clean Startup**: No NameError exceptions during initialization
4. **Railway Compatibility**: All environment variables properly loaded

## 🎯 **All Services Status:**

After this fix, all SuperPage backend services should be running:

- **✅ Ingestion Service**: Fixed and deploying
- **✅ Preprocessing Service**: Running (with tokenizer fix)
- **✅ Prediction Service**: Running (with mock model)
- **✅ Blockchain Service**: Running (with env var fix)

The ingestion service should now deploy successfully! 🚀
