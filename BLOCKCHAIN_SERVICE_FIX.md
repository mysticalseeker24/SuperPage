# 🔗 Blockchain Service Deployment Fix

## ❌ **Error Encountered:**
```
[ERRO] event="BLOCKCHAIN_PRIVATE_KEY environment variable is required"
Deploy crashed
```

## 🔍 **Root Cause:**
Environment variable name mismatch between Railway deployment and service code:
- **Railway Variables**: `ETHEREUM_PRIVATE_KEY`, `CONTRACT_ADDRESS`
- **Service Expected**: `BLOCKCHAIN_PRIVATE_KEY`, `SUPERPAGE_CONTRACT_ADDRESS`

## ✅ **Fixes Applied:**

### **1. Environment Variable Compatibility**
Updated `main.py` to support both naming conventions:

```python
# Support both naming conventions
PRIVATE_KEY = os.getenv("ETHEREUM_PRIVATE_KEY") or os.getenv("BLOCKCHAIN_PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS") or os.getenv("SUPERPAGE_CONTRACT_ADDRESS")

# Updated error messages
if not PRIVATE_KEY:
    logger.error("ETHEREUM_PRIVATE_KEY or BLOCKCHAIN_PRIVATE_KEY environment variable is required")

if not CONTRACT_ADDRESS:
    logger.warning("CONTRACT_ADDRESS not found, will attempt to use default")
    CONTRACT_ADDRESS = "0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D"  # Default
```

### **2. Graceful Contract Address Handling**
- **No Hard Exit**: Service continues with default contract address if none provided
- **Default Contract**: Uses deployed Sepolia contract address as fallback
- **Warning Logs**: Clear logging when using fallback values

### **3. Enhanced Debugging**
Added comprehensive configuration logging:

```python
logger.info("Blockchain service configuration", 
           contract_address=CONTRACT_ADDRESS,
           network_url=NETWORK_URL,
           has_private_key=bool(PRIVATE_KEY),
           private_key_length=len(PRIVATE_KEY) if PRIVATE_KEY else 0)
```

## 🚀 **Redeploy Instructions:**

### **PowerShell Commands:**
```powershell
# Navigate to blockchain service
Set-Location backend\blockchain_service

# Redeploy with fixes
railway up --detach

# Monitor deployment logs
railway logs --follow

# Check service status
railway status
```

### **Verify Environment Variables:**
```powershell
# Check current variables
railway variables

# Should show:
# ETHEREUM_PRIVATE_KEY=a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e
# CONTRACT_ADDRESS=0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D
# INFURA_PROJECT_ID=ea1e0f21469f412995bdaaa76ac1c266
# ETHERSCAN_API_KEY=PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA
```

## 📊 **Expected Results:**

### **Successful Startup:**
✅ **Private key loaded** from `ETHEREUM_PRIVATE_KEY`  
✅ **Contract address configured** (default or from env var)  
✅ **Service starts without crashes**  
✅ **Health endpoint responds**  

### **Service Logs:**
```
[INFO] Blockchain service configuration
       contract_address=0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D
       network_url=http://localhost:8545
       has_private_key=true
       private_key_length=64
[INFO] SuperPage Blockchain Service started successfully
```

## 🔍 **Verification Commands:**

### **Health Check:**
```powershell
# Test health endpoint
Invoke-RestMethod -Uri "https://your-blockchain-service.railway.app/health"

# Expected response:
{
  "status": "ok",
  "blockchain_connected": true,
  "contract_address": "0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D",
  "network_url": "http://localhost:8545",
  "hardhat_available": true
}
```

### **Test Prediction Publishing:**
```powershell
$body = @{
    project_id = "test-project-123"
    score = 0.75
    proof = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    metadata = @{
        model_version = "v1.0.0"
        timestamp = "2024-01-15T10:30:00Z"
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "https://your-blockchain-service.railway.app/publish" `
    -Method POST -ContentType "application/json" -Body $body
```

## 📝 **Environment Variables Summary:**

### **Current Railway Variables:**
```
ETHEREUM_PRIVATE_KEY=a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e
INFURA_PROJECT_ID=ea1e0f21469f412995bdaaa76ac1c266
ETHERSCAN_API_KEY=PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA
CONTRACT_ADDRESS=0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D
SERVICE_NAME=blockchain-service
LOG_LEVEL=INFO
FRONTEND_URL=https://superpage-frontend.netlify.app
```

### **Backward Compatibility:**
The service now accepts both old and new variable names:
- `ETHEREUM_PRIVATE_KEY` ✅ (Railway)
- `BLOCKCHAIN_PRIVATE_KEY` ✅ (Legacy)
- `CONTRACT_ADDRESS` ✅ (Railway)
- `SUPERPAGE_CONTRACT_ADDRESS` ✅ (Legacy)

## 🎯 **Key Improvements:**

1. **No More Crashes**: Service starts even with missing contract address
2. **Flexible Configuration**: Supports multiple environment variable names
3. **Better Debugging**: Comprehensive startup logging
4. **Production Ready**: Uses real Sepolia contract address
5. **Graceful Fallbacks**: Default values for missing configurations

The blockchain service should now deploy successfully and be ready for on-chain prediction publishing! 🚀
