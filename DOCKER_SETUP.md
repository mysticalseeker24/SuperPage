# SuperPage Docker Multi-Agent System

Complete Docker Compose setup for running the entire SuperPage system as a coordinated multi-agent system.

## 🎯 Why Docker Compose is Superior

### **Single Command Deployment**
```bash
# Start entire system
./start-superpage.sh

# Or manually
docker-compose up
```

### **Automatic Service Orchestration**
- **Dependency Management**: Services start in correct order
- **Health Checks**: Automatic service health monitoring
- **Network Isolation**: Secure inter-service communication
- **Resource Management**: CPU/memory limits and scaling

### **Environment Consistency**
- **Development**: Local development with hot reload
- **Production**: Optimized for production deployment
- **Testing**: Isolated test environment

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 20GB disk space

### 1. Clone and Setup
```bash
git clone https://github.com/mysticalseeker24/SuperPage.git
cd SuperPage
```

### 2. Start the System
```bash
# Linux/Mac
chmod +x start-superpage.sh
./start-superpage.sh development

# Windows
start-superpage.bat development
```

### 3. Verify Services
```bash
# Check all services are healthy
curl http://localhost:8010/health  # Ingestion
curl http://localhost:8001/health  # Preprocessing
curl http://localhost:8002/health  # Prediction
curl http://localhost:8003/health  # Blockchain
```

## 📋 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ingestion     │───▶│  Preprocessing  │───▶│   Prediction    │
│   Service       │    │    Service      │    │    Service      │
│   Port 8000     │    │   Port 8001     │    │   Port 8002     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    MongoDB      │    │   Training      │    │   Blockchain    │
│   Database      │    │   Service       │    │    Service      │
│   Port 27017    │    │   (CLI/Batch)   │    │   Port 8003     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuration Files

### **docker-compose.yml** (Development)
- Local MongoDB instance
- Development environment variables
- Volume mounts for hot reload
- Debug logging enabled

### **docker-compose.prod.yml** (Production)
- MongoDB Atlas integration
- Production optimizations
- Resource limits and scaling
- Load balancer (Nginx)

### **docker-compose.override.yml** (Development Tools)
- Mongo Express (Database UI)
- Redis caching
- Development utilities

## 🌍 Environment Configurations

### Development Mode
```bash
./start-superpage.sh development
```
- **Database**: Local MongoDB container
- **Logging**: Debug level
- **Tools**: Mongo Express, Prometheus
- **Hot Reload**: Enabled for all services

### Production Mode
```bash
./start-superpage.sh production
```
- **Database**: MongoDB Atlas
- **Logging**: Info level
- **Scaling**: Multiple replicas
- **Load Balancer**: Nginx

### Test Mode
```bash
./start-superpage.sh test
```
- **Database**: Isolated test database
- **Data**: Clean test datasets
- **Validation**: Automated testing

## 📊 Service Details

### **Training Service**
- **Purpose**: Train federated learning model
- **Execution**: Runs once to create model files
- **Output**: Model artifacts in shared volume
- **Dependencies**: MongoDB, Dataset files

### **Ingestion Service** (Port 8010)
- **Purpose**: Web3 data scraping via Firecrawl
- **API**: FastAPI with async processing
- **Storage**: Raw data in MongoDB
- **Health Check**: `/health` endpoint

### **Preprocessing Service** (Port 8001)
- **Purpose**: ML feature extraction
- **Models**: DistilBERT tokenizer, MinMaxScaler
- **Input**: Raw data from MongoDB
- **Output**: Feature vectors for ML

### **Prediction Service** (Port 8002)
- **Purpose**: Real-time inference with SHAP
- **Model**: PyTorch tabular regression
- **Features**: 7-dimensional feature vectors
- **Output**: Predictions with explanations

### **Blockchain Service** (Port 8003)
- **Purpose**: Smart contract integration
- **Network**: Sepolia testnet
- **Contract**: `0x45341d82d59b3C4C43101782d97a4dBb97a42dba`
- **Function**: Immutable prediction storage

## 🔍 Monitoring & Debugging

### Service Logs
```bash
# Follow all logs
docker-compose logs -f

# Specific service
docker-compose logs -f prediction-service

# Recent logs only
docker-compose logs --tail=50
```

### Health Monitoring
```bash
# Check service health
./start-superpage.sh health

# Manual health checks
curl http://localhost:8010/health
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
```

### Database Access
```bash
# MongoDB Express (Development)
http://localhost:8081

# Direct MongoDB access
docker exec -it superpage-mongodb mongosh
```

## 🧪 Testing the System

### Complete Pipeline Test
```bash
# 1. Ingest data
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

### Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test prediction service
ab -n 100 -c 10 -T 'application/json' -p test-payload.json http://localhost:8002/predict
```

## 🔧 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port
netstat -tulpn | grep :8000
# Kill process
sudo kill -9 <PID>
```

**MongoDB Connection Failed**
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

**Model Not Found (Prediction Service)**
```bash
# Ensure training completed
docker-compose logs training-service

# Check model files
docker exec -it superpage-prediction ls -la /app/models/latest/
```

**Blockchain Service Errors**
```bash
# Check Sepolia ETH balance
# Check Infura rate limits
# Verify contract address
```

### Performance Optimization

**Memory Issues**
```bash
# Increase Docker memory limit
# Reduce batch sizes in training
# Scale down replicas
```

**Slow Startup**
```bash
# Pre-pull images
docker-compose pull

# Build images in parallel
docker-compose build --parallel
```

## 📈 Scaling & Production

### Horizontal Scaling
```bash
# Scale specific services
docker-compose up -d --scale prediction-service=3
docker-compose up -d --scale preprocessing-service=2
```

### Resource Limits
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'
      memory: 1G
```

### Load Balancing
- Nginx configuration included
- Round-robin load balancing
- Health check integration
- SSL termination support

## 🎉 Benefits Achieved

✅ **Single Command Deployment**: `./start-superpage.sh`
✅ **Automatic Orchestration**: Services start in correct order
✅ **Health Monitoring**: Built-in health checks
✅ **Environment Consistency**: Same setup across dev/prod
✅ **Resource Management**: CPU/memory limits
✅ **Network Security**: Isolated service communication
✅ **Scalability**: Easy horizontal scaling
✅ **Monitoring**: Comprehensive logging and metrics

**Your SuperPage multi-agent system is now production-ready! 🚀**
