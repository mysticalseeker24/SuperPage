# SuperPage Complete System Startup Guide

This guide will help you run the entire SuperPage system with all services working together.

## 🎯 System Overview

SuperPage consists of 5 microservices + smart contracts:
- **Ingestion Service** (Port 8000) - Web3 data scraping
- **Preprocessing Service** (Port 8001) - ML feature extraction  
- **Training Service** (CLI) - Federated learning
- **Prediction Service** (Port 8002) - Real-time inference
- **Blockchain Service** (Port 8003) - Smart contract integration
- **Smart Contracts** - Sepolia testnet deployment

## 🔧 Environment Configuration ✅

All environment variables have been configured with your credentials:

### ✅ MongoDB Atlas
- **Connection**: `mongodb+srv://sakshammishra2402:***@cluster0.zjhsmyu.mongodb.net/`
- **Database**: `superpage`

### ✅ Firecrawl API
- **API Key**: `fc-62e1fc5b845c40948b28fd133fbef7cf`

### ✅ Ethereum/Sepolia
- **Private Key**: `a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e`
- **Infura Project ID**: `ea1e0f21469f412995bdaaa76ac1c266`
- **Contract Address**: `0x45341d82d59b3C4C43101782d97a4dBb97a42dba`
- **Etherscan API**: `PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA`

### ✅ Smart Contract Deployed
- **Network**: Sepolia Testnet
- **Address**: `0x45341d82d59b3C4C43101782d97a4dBb97a42dba`
- **Explorer**: https://sepolia.etherscan.io/address/0x45341d82d59b3C4C43101782d97a4dBb97a42dba

## 🚀 System Startup Instructions

### Step 1: Install Dependencies

```bash
# Root dependencies
pip install -r requirements.txt

# Service-specific dependencies
cd backend/ingestion_service && pip install -r requirements.txt && cd ../..
cd backend/preprocessing_service && pip install -r requirements.txt && cd ../..
cd backend/prediction_service && pip install -r requirements.txt && cd ../..
cd backend/blockchain_service && pip install -r requirements.txt && npm install && cd ../..
cd smart-contracts && npm install && cd ..
```

### Step 2: Train the ML Model (Required First)

```bash
cd backend/training_service
python train_federated.py --rounds 5 --lr 0.001 --batch-size 32
cd ../..
```

This will create the model files needed by the prediction service:
- `backend/training_service/models/latest/fundraising_model.pth`
- `backend/training_service/models/latest/scaler.pkl`

### Step 3: Start All Services

Open 5 separate terminals and run each service:

#### Terminal 1: Ingestion Service (Port 8000)
```bash
cd backend/ingestion_service
python main.py
```

#### Terminal 2: Preprocessing Service (Port 8001)
```bash
cd backend/preprocessing_service
python main.py
```

#### Terminal 3: Prediction Service (Port 8002)
```bash
cd backend/prediction_service
python main.py
```

#### Terminal 4: Blockchain Service (Port 8003)
```bash
cd backend/blockchain_service
python main.py
```

#### Terminal 5: Monitor Logs (Optional)
```bash
# Watch all service logs
tail -f backend/*/logs/*.log
```

## 🧪 Test the Complete Pipeline

### 1. Test Individual Services

```bash
# Test Ingestion Service
curl -X POST "http://localhost:8000/ingest" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/web3-project", "project_id": "test-project-1"}'

# Test Preprocessing Service
curl -X GET "http://localhost:8001/features/test-project-1"

# Test Prediction Service
curl -X POST "http://localhost:8002/predict" \
  -H "Content-Type: application/json" \
  -d '{"features": [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]}'

# Test Blockchain Service
curl -X POST "http://localhost:8003/publish" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "test-project-1", "score": 0.75, "proof": "proof-hash-123", "metadata": {"model_version": "1.0"}}'
```

### 2. Test Complete Data Flow

```bash
# 1. Ingest Web3 project data
curl -X POST "http://localhost:8000/ingest" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/ethereum/ethereum-org-website", "project_id": "ethereum-org"}'

# 2. Process features
curl -X GET "http://localhost:8001/features/ethereum-org"

# 3. Make prediction
curl -X POST "http://localhost:8002/predict" \
  -H "Content-Type: application/json" \
  -d '{"features": [8.5, 0.95, 0.88, 15000, 0.85, 2000000, 0.92]}'

# 4. Publish to blockchain
curl -X POST "http://localhost:8003/publish" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "ethereum-org", "score": 0.92, "proof": "0x1234567890abcdef", "metadata": {"confidence": 0.95}}'
```

## 📊 Service Health Checks

```bash
# Check all services are running
curl http://localhost:8000/health  # Ingestion
curl http://localhost:8001/health  # Preprocessing  
curl http://localhost:8002/health  # Prediction
curl http://localhost:8003/health  # Blockchain
```

## 🔍 Monitoring and Logs

### Service URLs:
- **Ingestion Service**: http://localhost:8000/docs
- **Preprocessing Service**: http://localhost:8001/docs
- **Prediction Service**: http://localhost:8002/docs
- **Blockchain Service**: http://localhost:8003/docs

### Smart Contract:
- **Sepolia Explorer**: https://sepolia.etherscan.io/address/0x45341d82d59b3C4C43101782d97a4dBb97a42dba

## 🐛 Troubleshooting

### Common Issues:

1. **Model Not Found Error (Prediction Service)**
   ```bash
   cd backend/training_service
   python train_federated.py --rounds 3
   ```

2. **MongoDB Connection Error**
   - Check MongoDB Atlas connection string
   - Verify network access in MongoDB Atlas

3. **Blockchain Service Errors**
   - Ensure Sepolia ETH balance > 0
   - Check Infura project limits

4. **Port Already in Use**
   ```bash
   # Find and kill process using port
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   ```

## 🎉 Success Indicators

When everything is working correctly, you should see:
- ✅ All 4 services responding to health checks
- ✅ MongoDB collections populated with data
- ✅ ML model making predictions with SHAP explanations
- ✅ Blockchain transactions confirmed on Sepolia
- ✅ Smart contract storing predictions immutably

## 📈 Next Steps

1. **Scale Services**: Use Docker Compose for production deployment
2. **Add Frontend**: React dashboard for system monitoring
3. **CI/CD Pipeline**: GitHub Actions for automated testing
4. **Monitoring**: Add Prometheus/Grafana for metrics
5. **Security**: Implement API authentication and rate limiting

---

**🚀 Your SuperPage system is now fully configured and ready to run!**
