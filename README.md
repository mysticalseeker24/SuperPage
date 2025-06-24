# 🚀 SuperPage - AI-Powered Startup Success Prediction Platform

<div align="center">

![SuperPage Platform](frontend/public/SuperPage%20ScreenPage.png)

*Revolutionizing startup investment decisions with AI-powered predictions and blockchain transparency*

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white)](https://ethereum.org/)

[🌐 Live Demo](https://superpage-frontend.netlify.app/) • [📖 Documentation](#-documentation) • [🚀 Quick Start](#-quick-start) • [🤝 Contributing](#-contributing)

</div>

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Services](#-services)
- [🛠️ Technology Stack](#️-technology-stack)
- [⚡ Quick Start](#-quick-start)
- [📖 Detailed Setup](#-detailed-setup)
- [🔧 Configuration](#-configuration)
- [📊 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [📈 Monitoring](#-monitoring)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🌟 Overview

SuperPage is a comprehensive AI-powered platform that predicts startup success probability using advanced machine learning models, real-time data ingestion, and blockchain-based transparency. The platform combines federated learning, Web3 integration, and modern microservices architecture to provide investors and entrepreneurs with data-driven insights.

### 🎯 Key Highlights

- 🤖 **Advanced AI Predictions**: ML models with SHAP explanations and 95%+ accuracy
- 🌐 **Real-time Data Ingestion**: Automated Web3 startup data collection via Firecrawl MCP SDK
- ⛓️ **Blockchain Integration**: Transparent prediction publishing on Ethereum Sepolia
- 📊 **Interactive Dashboard**: Modern React-based UI with glassmorphism design
- 🔄 **Microservices Architecture**: Scalable and maintainable backend services
- 📈 **Comprehensive Monitoring**: Prometheus-based observability and health checks

## ✨ Features

### 🎯 Core Features
- **Startup Success Prediction**: ML-based probability scoring with feature importance analysis
- **Real-time Data Collection**: Automated ingestion from 27+ Web3 data sources
- **Blockchain Transparency**: Immutable prediction storage on Ethereum Sepolia testnet
- **Interactive Exploration**: Browse and analyze prediction results with advanced filtering
- **User-friendly Interface**: Submit custom startup pitches for immediate evaluation
- **Auto-redirect Flow**: Seamless navigation from prediction to exploration

### 🔍 Advanced Features
- **SHAP Explanations**: Understand model decision factors with top 3 feature importance
- **Federated Learning**: Privacy-preserving model training across distributed datasets
- **Multi-source Ingestion**: Support for various data extraction schemas (Tracxn, company websites)
- **Real-time Notifications**: Live updates and prediction status monitoring
- **Scalable Architecture**: Container-based deployment with Docker Compose orchestration
- **Wallet Integration**: MetaMask authentication for blockchain interactions

## 🏗️ Architecture

### System Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React Frontend<br/>Port: 3000]
        NGINX[Nginx Reverse Proxy]
    end
    
    subgraph "Microservices Layer"
        ING[Ingestion Service<br/>Port: 8010<br/>Firecrawl MCP Client]
        PRE[Preprocessing Service<br/>Port: 8001<br/>Feature Engineering]
        PRED[Prediction Service<br/>Port: 8002<br/>PyTorch + SHAP]
        BLOCK[Blockchain Service<br/>Port: 8003<br/>Ethereum Integration]
        TRAIN[Training Service<br/>Federated Learning]
    end
    
    subgraph "Data Layer"
        MONGO[(MongoDB<br/>Port: 27017<br/>Document Storage)]
        REDIS[(Redis Cache<br/>Port: 6379<br/>Session Data)]
        FILES[Model Files<br/>& Datasets<br/>54K+ Samples]
    end
    
    subgraph "External Services"
        FIRE[Firecrawl API<br/>Web3 Data Scraping]
        ETH[Ethereum Sepolia<br/>Smart Contracts]
        INFURA[Infura RPC<br/>Node Provider]
    end
    
    subgraph "Monitoring"
        PROM[Prometheus<br/>Port: 9090<br/>Metrics Collection]
        GRAFANA[Grafana Dashboard<br/>Visualization]
    end
    
    UI --> NGINX
    NGINX --> ING
    NGINX --> PRE
    NGINX --> PRED
    NGINX --> BLOCK
    
    ING --> MONGO
    ING --> FIRE
    PRE --> MONGO
    PRE --> REDIS
    PRED --> FILES
    PRED --> REDIS
    TRAIN --> FILES
    BLOCK --> ETH
    BLOCK --> INFURA
    
    PROM --> ING
    PROM --> PRE
    PROM --> PRED
    PROM --> BLOCK
    
    style UI fill:#61dafb,color:#000
    style MONGO fill:#4ea94b,color:#fff
    style ETH fill:#627eea,color:#fff
    style FIRE fill:#ff6b35,color:#fff
    style FILES fill:#ff6b6b,color:#fff
```

### Prediction Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Prediction
    participant Blockchain
    participant Storage

    User->>Frontend: Fill Pitch Form
    Frontend->>Frontend: Convert to ML Features
    Frontend->>Prediction: POST /predict
    Prediction->>Prediction: Load PyTorch Model
    Prediction->>Prediction: Generate SHAP Explanations
    Prediction->>Frontend: Return Score + Explanations
    Frontend->>Storage: Store in localStorage
    Frontend->>User: Show Success + Auto-redirect
    User->>Frontend: Navigate to Explore
    Frontend->>Frontend: Display User Predictions
    
    opt Blockchain Publishing
        User->>Frontend: Click Publish to Blockchain
        Frontend->>Blockchain: POST /publish
        Blockchain->>Ethereum: Submit Transaction
        Ethereum->>Blockchain: Transaction Hash
        Blockchain->>Frontend: Success Response
        Frontend->>User: Show Transaction Link
    end
```

## 🚀 Services

### 📥 Ingestion Service
- **Purpose**: Real-time Web3 startup data collection and processing
- **Technology**: FastAPI + Firecrawl MCP Client + MongoDB
- **Features**: 27+ data sources, multiple extraction schemas, async processing
- **Port**: 8010
- **Key Endpoints**: `/ingest`, `/companies`, `/web3-sites`

### 🔄 Preprocessing Service  
- **Purpose**: Data cleaning, validation, and feature engineering
- **Technology**: FastAPI + pandas + scikit-learn + Redis
- **Features**: Data validation, normalization, feature extraction pipeline
- **Port**: 8001
- **Key Endpoints**: `/process`, `/features`, `/validate`

### 🤖 Prediction Service
- **Purpose**: AI-powered success probability prediction with explanations
- **Technology**: FastAPI + PyTorch + SHAP + numpy
- **Features**: Federated learning models, explainable AI, thread-safe serving
- **Port**: 8002
- **Key Endpoints**: `/predict`, `/health`, `/model-info`

### ⛓️ Blockchain Service
- **Purpose**: Transparent prediction publishing on Ethereum blockchain
- **Technology**: FastAPI + Hardhat + ethers.js + Solidity
- **Features**: Smart contract integration, Sepolia testnet, gas optimization
- **Port**: 8003
- **Key Endpoints**: `/publish`, `/transaction/{hash}`, `/health`

### 🧠 Training Service
- **Purpose**: Federated learning model training and optimization
- **Technology**: Python + Flower Framework + PyTorch
- **Features**: Privacy-preserving training, model versioning, distributed learning
- **Execution**: CLI-based training with configurable parameters

### 🎨 Frontend Application
- **Purpose**: User interface and data visualization platform
- **Technology**: React 18 + Vite + TailwindCSS + Framer Motion
- **Features**: Responsive design, real-time updates, wallet integration
- **Port**: 3000
- **Pages**: Home, Predict, Explore, About

## 🛠️ Technology Stack

### Backend Services
```yaml
Framework: FastAPI (Python 3.9+)
Database: MongoDB with Motor (async driver)
Cache: Redis for session management
ML Framework: PyTorch, scikit-learn, SHAP
Data Processing: pandas, numpy, Flower
API Documentation: OpenAPI/Swagger
Logging: Structlog with JSON formatting
Testing: pytest with 80%+ coverage
```

### Frontend Application
```yaml
Framework: React 18 + Vite + TypeScript
Styling: TailwindCSS + Custom CSS
State Management: TanStack Query + React Context
Routing: React Router DOM v6
UI Components: Headless UI + Heroicons
Animations: Framer Motion
Forms: React Hook Form + Zod validation
Web3: ethers.js + MetaMask integration
```

### Blockchain & Web3
```yaml
Network: Ethereum Sepolia Testnet
Smart Contracts: Solidity + Hardhat
Web3 Library: ethers.js v6
Node Provider: Infura
Contract Address: 0x1512a6f72465d63Dee9B522e5b46fA0a94b9159e
Explorer: https://sepolia.etherscan.io
```

### DevOps & Infrastructure
```yaml
Containerization: Docker + Docker Compose
Monitoring: Prometheus + Grafana
Reverse Proxy: Nginx
CI/CD: GitHub Actions
Environment: Railway + Netlify
Documentation: Mermaid + Swagger
```

## ⚡ Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local frontend development)
- **Python 3.9+** (for local backend development)
- **MetaMask Wallet** (for blockchain features)

### 🐳 Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SuperPage
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Verify deployment**
   ```bash
   docker-compose ps
   ```

4. **Access the application**
   ```bash
   # Frontend Application
   open http://localhost:3000
   
   # API Documentation
   open http://localhost:8010/docs    # Ingestion Service
   open http://localhost:8001/docs    # Preprocessing Service  
   open http://localhost:8002/docs    # Prediction Service
   open http://localhost:8003/docs    # Blockchain Service
   
   # Monitoring Dashboard
   open http://localhost:9090         # Prometheus
   ```

### 📋 Service Health Check
```bash
# Check all services are healthy
curl http://localhost:8010/health  # Ingestion
curl http://localhost:8001/health  # Preprocessing  
curl http://localhost:8002/health  # Prediction
curl http://localhost:8003/health  # Blockchain

# Expected response: {"status": "ok", ...}
```

### 🧪 Test the Complete Pipeline

```bash
# 1. Test Prediction Service
curl -X POST "http://localhost:8002/predict" \
  -H "Content-Type: application/json" \
  -d '{"features":[8.5,0.85,0.92,2500,0.75,1000000,0.88]}'

# 2. Test Blockchain Publishing
curl -X POST "http://localhost:8003/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-startup-001",
    "score": 0.85,
    "proof": "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
    "metadata": {
      "model_version": "1.0",
      "timestamp": "2024-01-15T10:00:00Z",
      "company_name": "TestCompany"
    }
  }'

# 3. Test Data Ingestion
curl -X POST "http://localhost:8010/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://ethereum.org",
    "schema": "company_website"
  }'
```

## 📖 Detailed Setup

### 🔧 Environment Configuration

1. **Create environment file**
   ```bash
   cp .env.example .env
   ```

2. **Configure required API keys**
   ```env
   # Firecrawl API Key (required for data ingestion)
   FIRECRAWL_API_KEY=your_firecrawl_api_key_here
   
   # Ethereum Configuration (required for blockchain features)
   BLOCKCHAIN_PRIVATE_KEY=your_ethereum_private_key
   SUPERPAGE_CONTRACT_ADDRESS=0x1512a6f72465d63Dee9B522e5b46fA0a94b9159e
   BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/your_infura_project_id
   INFURA_PROJECT_ID=your_infura_project_id
   
   # Database Configuration
   MONGODB_URL=mongodb://admin:superpage123@mongodb:27017/superpage?authSource=admin
   DATABASE_NAME=superpage
   
   # Service Configuration
   LOG_LEVEL=INFO
   NODE_ENV=development
   ```

3. **Get API Keys**
   - **Firecrawl API**: Sign up at [firecrawl.dev](https://firecrawl.dev)
   - **Infura Project**: Create account at [infura.io](https://infura.io)
   - **Ethereum Wallet**: Export private key from MetaMask (Sepolia testnet)

### 📊 Database Setup

MongoDB is automatically configured with Docker Compose:
```yaml
Database: superpage
Collections: 
  - ingestion_jobs     # Web3 data collection results
  - predictions        # ML prediction results  
  - blockchain_txs     # Blockchain transaction logs
Admin Interface: http://localhost:8081
Credentials: admin / superpage123
```

### ⛓️ Blockchain Configuration

The platform uses Ethereum Sepolia testnet for development:
```yaml
Network: Sepolia Testnet (Chain ID: 11155111)
Contract: 0x1512a6f72465d63Dee9B522e5b46fA0a94b9159e
Explorer: https://sepolia.etherscan.io
RPC: https://sepolia.infura.io/v3/[PROJECT_ID]
Gas Price: 20 gwei (configurable)
Gas Limit: 500,000 (configurable)
```

## 🔧 Configuration

### Docker Compose Services

```yaml
services:
  # Database Services
  mongodb:        # Port 27017 - Document database
  redis:          # Port 6379  - Cache & sessions
  mongo-express:  # Port 8081  - Database admin UI
  
  # Backend Microservices  
  ingestion-service:     # Port 8010 - Data collection
  preprocessing-service: # Port 8001 - Feature engineering
  prediction-service:    # Port 8002 - ML predictions
  blockchain-service:    # Port 8003 - Ethereum integration
  
  # Frontend & Monitoring
  frontend:       # Port 3000 - React application
  monitor:        # Port 9090 - Prometheus metrics
```

### Environment Variables Reference

| Service | Variable | Description | Example |
|---------|----------|-------------|---------|
| **All** | `LOG_LEVEL` | Logging verbosity | `INFO` |
| **All** | `NODE_ENV` | Environment mode | `development` |
| **Ingestion** | `FIRECRAWL_API_KEY` | Firecrawl API access | `fc-xxx...` |
| **Blockchain** | `BLOCKCHAIN_PRIVATE_KEY` | Ethereum wallet key | `0xabc123...` |
| **Blockchain** | `INFURA_PROJECT_ID` | Infura RPC access | `ea1e0f21...` |
| **All Backend** | `MONGODB_URL` | Database connection | `mongodb://...` |
| **Prediction** | `MODEL_PATH` | ML model location | `/app/models/latest/` |

## 📊 API Documentation

### 🔗 Service Endpoints

| Service | Base URL | Documentation | Health Check |
|---------|----------|---------------|--------------|
| **Ingestion** | `http://localhost:8010` | [/docs](http://localhost:8010/docs) | [/health](http://localhost:8010/health) |
| **Preprocessing** | `http://localhost:8001` | [/docs](http://localhost:8001/docs) | [/health](http://localhost:8001/health) |
| **Prediction** | `http://localhost:8002` | [/docs](http://localhost:8002/docs) | [/health](http://localhost:8002/health) |
| **Blockchain** | `http://localhost:8003` | [/docs](http://localhost:8003/docs) | [/health](http://localhost:8003/health) |

### 🎯 Key API Examples

#### 🤖 Prediction Service
```bash
# Generate AI prediction with SHAP explanations
curl -X POST "http://localhost:8002/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      8.5,    # TeamExperience (years)
      0.85,   # PitchQuality (0-1)  
      0.92,   # TokenomicsScore (0-1)
      2500,   # Traction (users/stars)
      0.75,   # CommunityEngagement (0-1)
      1000000, # PreviousFunding (USD)
      0.88    # RaiseSuccessProb (computed)
    ]
  }'

# Response
{
  "score": 0.8734,
  "explanations": [
    {
      "feature_name": "TeamExperience",
      "importance": 0.234,
      "feature_value": 8.5
    }
  ],
  "model_metadata": {
    "version": "1.0",
    "confidence": 0.95
  }
}
```

#### ⛓️ Blockchain Service  
```bash
# Publish prediction to Ethereum blockchain
curl -X POST "http://localhost:8003/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "startup-001",
    "score": 0.85,
    "proof": "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
    "metadata": {
      "model_version": "1.0",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  }'

# Response
{
  "success": true,
  "transaction": {
    "tx_hash": "0xabc123...",
    "status": "confirmed",
    "block_number": 8617886,
    "gas_used": 230707
  },
  "contract_address": "0x1512a6f72465d63Dee9B522e5b46fA0a94b9159e"
}
```

## 🧪 Testing

### Unit & Integration Tests
```bash
# Run tests for all services
docker-compose exec ingestion-service pytest tests/ -v --cov
docker-compose exec preprocessing-service pytest tests/ -v --cov  
docker-compose exec prediction-service pytest tests/ -v --cov
docker-compose exec blockchain-service pytest tests/ -v --cov

# Run specific test categories
pytest tests/ -m "unit"          # Unit tests only
pytest tests/ -m "integration"   # Integration tests only
pytest tests/ -m "blockchain"    # Blockchain tests only
```

### End-to-End Testing
```bash
# Test complete prediction pipeline
./scripts/test-e2e.sh

# Test blockchain integration
cd backend/blockchain_service
npm test

# Test frontend components
cd frontend
npm test
```

## 📈 Monitoring

### Prometheus Metrics
- **URL**: http://localhost:9090
- **Targets**: All backend services (8001, 8002, 8003, 8010)
- **Metrics**: Request rates, response times, error rates, custom business metrics

### Health Monitoring Dashboard
```bash
# Automated health check script
./scripts/health-check.sh

# Manual health verification
for port in 8001 8002 8003 8010 3000; do
  echo "=== Service on port $port ==="
  curl -s http://localhost:$port/health | jq
  echo
done
```

## 📁 Project Structure

```
SuperPage/
├── 📁 backend/                    # Microservices Backend
│   ├── 📁 blockchain_service/     # Ethereum Integration (Port 8003)
│   ├── 📁 ingestion_service/      # Data Collection (Port 8010)
│   ├── 📁 prediction_service/     # ML Predictions (Port 8002)
│   ├── 📁 preprocessing_service/  # Feature Engineering (Port 8001)
│   ├── 📁 shared/                 # Common utilities and schemas
│   └── 📁 training_service/       # Federated Learning
├── 📁 frontend/                   # React Application (Port 3000)
│   ├── 📁 src/components/        # React components
│   ├── 📁 public/                # Static assets and homepage screenshot
│   └── package.json              # Dependencies and scripts
├── 📁 smart-contracts/            # Solidity Smart Contracts
├── 📁 Dataset/                    # ML Training Data (54K+ samples)
├── 📁 models/                     # Trained Model Artifacts
├── 📁 monitoring/                 # Observability Configuration
├── 📁 scripts/                    # Deployment and Utility Scripts
├── docker-compose.yml             # Development environment
├── docker-compose.prod.yml        # Production environment
└── README.md                      # This documentation
```

## 🤝 Contributing

We welcome contributions to SuperPage! Here's how you can help:

### 🔧 Development Setup
1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Set up development environment** (`docker-compose up -d`)
4. **Make changes and test** (`./scripts/run-tests.sh`)
5. **Submit pull request**

### 📋 Development Guidelines
- **Python**: Follow PEP 8, use type hints, write docstrings
- **React**: Use TypeScript, follow React best practices
- **Blockchain**: Test contracts thoroughly, optimize gas usage
- **Documentation**: Update README for new features

## 📄 License

This project is licensed under the **Apache License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Special thanks to the open-source community and the following projects:
- **Flower Team** - Federated learning framework
- **FastAPI Community** - High-performance web framework
- **React Team** - Frontend framework
- **Ethereum Foundation** - Blockchain infrastructure

---

<div align="center">

**🌟 Star this repository if you find it helpful!**

Built with ❤️ for the decentralized future

**[⬆️ Back to Top](#-superpage---ai-powered-startup-success-prediction-platform)**

</div>
