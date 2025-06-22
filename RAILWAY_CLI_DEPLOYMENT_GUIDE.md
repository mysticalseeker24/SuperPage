# 🚂 Railway CLI Deployment Guide for SuperPage (Updated 2024) - PowerShell Edition

## 📋 Prerequisites

### 1. Install Railway CLI

**Windows (PowerShell) - Recommended:**
```powershell
# Option 1: Using Scoop (Recommended)
scoop install railway

# Option 2: Using npm
npm i -g @railway/cli

# Option 3: Using Chocolatey (if you have it)
choco install railway-cli

# Verify installation
railway --version
```

**Alternative Methods:**
```bash
# macOS
brew install railway

# Linux/WSL
bash <(curl -fsSL cli.new)
```

### 2. Authenticate with Railway

**PowerShell:**
```powershell
# Standard login (opens browser)
railway login

# For headless/SSH environments
railway login --browserless

# Verify authentication
railway whoami
```

## 🚀 SuperPage Deployment Steps

### Step 1: Create Railway Project & PostgreSQL Database

**PowerShell Commands:**
```powershell
# Navigate to project root
Set-Location "E:\Code and Shit\Projects\SuperPage"

# Alternative navigation (if path has spaces)
cd 'E:\Code and Shit\Projects\SuperPage'

# Create new project
railway init
# Enter project name: "SuperPage"
# Select your team (usually "Personal")

# Add PostgreSQL database first
railway add -d postgres
# This creates a PostgreSQL database service in your project

# Verify project creation
railway status
```

### Step 2: Deploy Each Service Individually

**IMPORTANT:** The key is to use `railway add` to create empty services, then deploy to them.

#### 🔍 **Ingestion Service**

**PowerShell Commands:**
```powershell
# Navigate to ingestion service
Set-Location backend\ingestion_service

# Link to Railway project (if not already linked)
railway link
# Select: SuperPage project

# Create empty service for ingestion
railway add --service superpage-ingestion --variables 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
# This creates an empty service named "superpage-ingestion" with database connection

# Link to the service
railway service
# Select: "superpage-ingestion"

# Deploy the service
railway up --detach

# Set additional environment variables
railway variables --set "FIRECRAWL_API_KEY=fc-62e1fc5b845c40948b28fd133fbef7cf"
railway variables --set "SERVICE_NAME=ingestion-service"
railway variables --set "LOG_LEVEL=INFO"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"

# Generate domain for the service
railway domain

# Verify deployment
railway status

# Go back to project root
Set-Location ..\..
```

#### 🔄 **Preprocessing Service**

**PowerShell Commands:**
```powershell
# Navigate to preprocessing service
Set-Location backend\preprocessing_service

# Link to same Railway project (if not already linked)
railway link
# Select: SuperPage project

# Create empty service for preprocessing
railway add -s superpage-preprocessing -v "DATABASE_URL=${{Postgres.DATABASE_URL}}"
# This creates an empty service with database connection

# Link to the service
railway service
# Select: "superpage-preprocessing"

# Deploy the service
railway up --detach

# Set additional environment variables
railway variables --set "SERVICE_NAME=preprocessing-service"
railway variables --set "LOG_LEVEL=INFO"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"

# Generate domain for the service
railway domain

# Verify deployment
railway status

# Go back to project root
Set-Location ..\..
```

#### 🤖 **Prediction Service**

**PowerShell Commands:**
```powershell
# Navigate to prediction service
Set-Location backend\prediction_service

# Link to same Railway project (if not already linked)
railway link
# Select: SuperPage project

# Create empty service for prediction
railway add -s superpage-prediction
# This creates an empty service for the prediction service

# Link to the service
railway service
# Select: "superpage-prediction"

# Deploy the service
railway up --detach

# Set environment variables
railway variables --set "MODEL_PATH=/app/models/latest/fundraising_model.pth"
railway variables --set "SCALER_PATH=/app/models/latest/scaler.pkl"
railway variables --set "SHAP_BACKGROUND_SAMPLES=100"
railway variables --set "SERVICE_NAME=prediction-service"
railway variables --set "LOG_LEVEL=INFO"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"

# Generate domain for the service
railway domain

# Verify deployment
railway status

# Go back to project root
Set-Location ..\..
```

#### ⛓️ **Blockchain Service**

**PowerShell Commands:**
```powershell
# Navigate to blockchain service
Set-Location backend\blockchain_service

# Link to same Railway project (if not already linked)
railway link
# Select: SuperPage project

# Create empty service for blockchain
railway add -s superpage-blockchain
# This creates an empty service for the blockchain service

# Link to the service
railway service
# Select: "superpage-blockchain"

# Deploy the service
railway up --detach

# Set environment variables
railway variables --set "ETHEREUM_PRIVATE_KEY=a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e"
railway variables --set "INFURA_PROJECT_ID=ea1e0f21469f412995bdaaa76ac1c266"
railway variables --set "ETHERSCAN_API_KEY=PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA"
railway variables --set "CONTRACT_ADDRESS=0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D"
railway variables --set "SERVICE_NAME=blockchain-service"
railway variables --set "LOG_LEVEL=INFO"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"

# Generate domain for the service
railway domain

# Verify deployment
railway status

# Go back to project root
Set-Location ..\..
```

## 🔧 Useful Railway CLI Commands

### Check Deployment Status
**PowerShell Commands:**
```powershell
# View all services in project
railway status

# View logs for specific service
Set-Location backend\prediction_service
railway logs

# View live logs (follow mode)
railway logs --follow

# View build logs
railway logs --build

# View deployment logs
railway logs --deployment

# Return to project root
Set-Location ..\..
```

### Manage Environment Variables
**PowerShell Commands:**
```powershell
# List all variables for current service
railway variables

# Set a variable (CORRECT SYNTAX)
railway variables --set "KEY=value"

# Set multiple variables at once
railway variables --set "KEY1=value1" --set "KEY2=value2"

# Show variables in key=value format
railway variables --kv

# Delete a variable
railway variables --unset KEY
```

### Redeploy Services
**PowerShell Commands:**
```powershell
# Redeploy current service
railway redeploy

# Deploy with build logs
railway up

# Deploy without waiting for logs
railway up --detach

# Deploy with verbose output
railway up --verbose

# Force rebuild and deploy
railway up --force
```

### Service Management
**PowerShell Commands:**
```powershell
# Switch between services
railway service

# Link to different project
railway link

# Check current project info
railway status

# Connect to PostgreSQL database
railway connect Postgres

# Generate domain for current service
railway domain

# Open Railway dashboard in browser
railway open
```

### Database Management
**PowerShell Commands:**
```powershell
# Add PostgreSQL database
railway add -d postgres

# Connect to database shell
railway connect Postgres

# List all services including database
railway status

# Get database connection string
railway variables | Select-String "DATABASE_URL"
```

## 📊 Verify Deployments

### Health Check All Services
**PowerShell Commands:**
```powershell
# Get service URLs from Railway dashboard, then test:
Invoke-RestMethod -Uri "https://superpage-ingestion.up.railway.app/health"
Invoke-RestMethod -Uri "https://superpage-preprocessing.up.railway.app/health"
Invoke-RestMethod -Uri "https://superpage-prediction.up.railway.app/health"
Invoke-RestMethod -Uri "https://superpage-blockchain.up.railway.app/health"

# Alternative using curl (if installed)
curl https://superpage-ingestion.up.railway.app/health
curl https://superpage-preprocessing.up.railway.app/health
curl https://superpage-prediction.up.railway.app/health
curl https://superpage-blockchain.up.railway.app/health
```

### Test Prediction Endpoint
**PowerShell Commands:**
```powershell
# Using Invoke-RestMethod (PowerShell native)
$body = @{
    features = @(0.75, 8.5, 0.82, 0.91, 15000, 0.35, 2500000.0)
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://superpage-prediction.up.railway.app/predict" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Alternative using curl (if installed)
curl -X POST https://superpage-prediction.up.railway.app/predict `
  -H "Content-Type: application/json" `
  -d '{"features": [0.75, 8.5, 0.82, 0.91, 15000, 0.35, 2500000.0]}'
```

## 🔍 Troubleshooting

### View Build Logs
**PowerShell Commands:**
```powershell
Set-Location backend\prediction_service
railway logs --deployment

# View specific deployment logs
railway logs --build

# View real-time logs
railway logs --follow
```

### Check Service Status
**PowerShell Commands:**
```powershell
# Check overall project status
railway status

# Check specific service status
railway service
railway status

# Check if properly linked
railway whoami
```

### Restart Service
**PowerShell Commands:**
```powershell
# Redeploy current service
railway redeploy

# Force rebuild and redeploy
railway up --force

# Restart without rebuild
railway restart
```

### Update Environment Variables
**PowerShell Commands:**
```powershell
# Update a single variable (CORRECT SYNTAX)
railway variables --set "DATABASE_URL=new_database_url"

# Update multiple variables
railway variables --set "LOG_LEVEL=DEBUG" --set "WORKERS=4"

# View current variables
railway variables

# Remove a variable
railway variables --unset VARIABLE_NAME
```

## 📝 Important Notes

1. **Use `railway add` to create services first** - This prevents "No services found" error
2. **PostgreSQL database is shared** - All services use `${{Postgres.DATABASE_URL}}` reference
3. **Each service deploys from its own directory** - Railway detects the Dockerfile in each service folder
4. **Environment variables are per-service** - Set them for each service individually
5. **Railway assigns random URLs** - Use `railway domain` to generate public URLs
6. **Multi-stage Dockerfiles are optimized** - Should build under 4GB limit
7. **Health checks are included** - Railway will monitor service health automatically

## 🔍 Troubleshooting "No services found" Error

If you get "No services found" when running `railway service`:

**PowerShell Commands:**
```powershell
# Option 1: Create service first, then deploy
railway add -s my-service-name
railway service  # Now you should see the service
railway up

# Option 2: Deploy directly (creates service automatically)
railway up
# Railway will prompt: "No service linked. Create a new service?"
# Answer: Yes and provide a name

# Option 3: Check if you're linked to the right project
railway status
railway link  # Re-link if needed

# Option 4: Verify authentication and project access
railway whoami
railway projects  # List available projects
```

## 🎯 Expected Results

After successful deployment:
- ✅ 1 PostgreSQL database service
- ✅ 4 application services running on Railway
- ✅ All services under 4GB size limit
- ✅ Health endpoints responding
- ✅ Environment variables configured
- ✅ Public domains generated for each service
- ✅ Ready for frontend integration

## 📊 Get Service URLs

After deployment, get your service URLs:

**PowerShell Commands:**
```powershell
# Check project status to see all services
railway status

# Visit Railway dashboard in browser
railway open

# Get specific service URL (if domain is generated)
railway domain

# List all services with their URLs
railway services
```

## 🎯 PowerShell-Specific Tips

### Path Navigation
```powershell
# Use backslashes for Windows paths
Set-Location backend\ingestion_service

# Or use quotes for paths with spaces
Set-Location 'E:\Code and Shit\Projects\SuperPage'

# Use Tab completion for faster navigation
Set-Location back<TAB>\ing<TAB>
```

### Environment Variables
```powershell
# View Railway variables in PowerShell format
railway variables --kv | Out-String

# Set variables with proper escaping (CORRECT SYNTAX)
railway variables --set "API_KEY=your-key-here"
```

### Testing APIs
```powershell
# Use PowerShell's native web requests
$response = Invoke-RestMethod -Uri "https://your-service.railway.app/health"
$response | ConvertTo-Json -Depth 3
```

Your SuperPage backend will be fully deployed and ready for production! 🚀
