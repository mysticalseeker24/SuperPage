# 🚂 Railway CLI Commands Cheat Sheet

## ✅ Verified Railway CLI Commands (2024)

### **Project Management**
```bash
# Login to Railway
railway login

# Create new project
railway init

# Link to existing project
railway link

# View project status
railway status

# List all projects
railway list
```

### **Service Management**
```bash
# Create new service
railway add --service [service-name]

# Link to existing service
railway service [service-name]

# Deploy current directory
railway up

# View service logs
railway logs

# Redeploy service
railway redeploy
```

### **Database Management**
```bash
# Add PostgreSQL database
railway add --database postgres

# Add other databases
railway add --database mysql
railway add --database redis
railway add --database mongo

# Connect to database shell
railway connect [database-name]
```

### **Environment Variables**
```bash
# View all variables (current service)
railway variables

# Set single variable
railway variables --set "KEY=value"

# Set multiple variables
railway variables --set "KEY1=value1" --set "KEY2=value2"

# View variables in key-value format
railway variables --kv
```

### **Domain Management**
```bash
# Generate Railway domain
railway domain

# Add custom domain
railway domain yourdomain.com

# Set domain port
railway domain --port 8000
```

### **Development**
```bash
# Run command with Railway environment
railway run [command]

# Open shell with Railway variables
railway shell

# SSH into service
railway ssh
```

## 🎯 SuperPage Specific Commands

### **Complete Deployment Sequence**
```bash
# 1. Setup project
railway login
railway init
railway add --database postgres

# 2. Deploy ingestion service
cd backend/ingestion_service
railway add --service superpage-ingestion
railway service superpage-ingestion
railway up
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
railway variables --set "FIRECRAWL_API_KEY=fc-62e1fc5b845c40948b28fd133fbef7cf"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"
railway variables --set "PORT=8000"

# 3. Deploy preprocessing service
cd ../preprocessing_service
railway add --service superpage-preprocessing
railway service superpage-preprocessing
railway up
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
railway variables --set "FIRECRAWL_API_KEY=fc-62e1fc5b845c40948b28fd133fbef7cf"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"
railway variables --set "PORT=8000"

# 4. Deploy prediction service
cd ../prediction_service
railway add --service superpage-prediction
railway service superpage-prediction
railway up
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"
railway variables --set "PORT=8000"

# 5. Deploy blockchain service
cd ../blockchain_service
railway add --service superpage-blockchain
railway service superpage-blockchain
railway up
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
railway variables --set "BLOCKCHAIN_PRIVATE_KEY=a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e"
railway variables --set "BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266"
railway variables --set "SUPERPAGE_CONTRACT_ADDRESS=0x45341d82d59b3C4C43101782d97a4dBb97a42dba"
railway variables --set "INFURA_PROJECT_ID=ea1e0f21469f412995bdaaa76ac1c266"
railway variables --set "ETHERSCAN_API_KEY=PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA"
railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"
railway variables --set "PORT=8000"
```

### **Database Setup**
```bash
# 1. Link to PostgreSQL service
railway service postgres

# 2. View database connection details
railway variables

# 3. Connect to database (requires psql)
railway connect postgres

# 4. Or get URL and run schema manually
# Copy DATABASE_URL from railway variables output
# psql [DATABASE_URL] -f scripts/setup-postgres-schema.sql
```

### **Verification Commands**
```bash
# Check all services status
railway status

# Test health endpoints
curl https://superpage-ingestion.up.railway.app/health
curl https://superpage-preprocessing.up.railway.app/health
curl https://superpage-prediction.up.railway.app/health
curl https://superpage-blockchain.up.railway.app/health

# View logs for debugging
railway service superpage-ingestion
railway logs

# Check environment variables
railway service superpage-blockchain
railway variables
```

## 🚨 Common Mistakes to Avoid

### **❌ Incorrect Commands:**
```bash
# DON'T USE THESE:
railway service create [name]           # Old syntax
railway variables get [key]             # Doesn't exist
railway variables set KEY=value         # Wrong format
railway up --service [name]             # Service flag not needed
```

### **✅ Correct Commands:**
```bash
# USE THESE INSTEAD:
railway add --service [name]            # Create service
railway variables                       # View all variables
railway variables --set "KEY=value"     # Set variable
railway up                              # Deploy (after linking)
```

## 📞 Help Commands

```bash
# Get help for any command
railway --help
railway add --help
railway variables --help

# Check Railway CLI version
railway --version

# View current user
railway whoami
```

---

**🎯 Key Points:**
- Always link to service before deploying: `railway service [name]`
- Use `railway variables` (no get/set subcommands) to view variables
- Use `railway variables --set "KEY=value"` to set variables
- Deploy from the correct service directory with `railway up`
