# SuperPage 🚀

> A real-time, decentralized Fundraise Prediction Agent powered by federated learning

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)](https://reactjs.org/)

## 🌟 Overview

SuperPage is a privacy-first, decentralized fundraising prediction platform that leverages federated learning to provide real-time insights into startup funding success probability. Built with a microservices architecture, it combines machine learning, blockchain technology, and modern web frameworks to deliver accurate predictions while preserving data privacy.

## 🏗️ Architecture

```
SuperPage/
├── services/           # Microservices
│   ├── ml-service/    # ML prediction engine
│   ├── api-gateway/   # API gateway & routing
│   ├── data-service/  # Data processing & storage
│   └── fl-coordinator/ # Federated learning coordinator
├── frontend/          # React web application
├── contracts/         # Smart contracts (Hardhat)
├── Dataset/          # ML training datasets
├── docker/           # Docker configurations
└── .github/          # CI/CD workflows
```

## 🚀 Features

- **Real-time Predictions**: Get instant fundraising success probability scores
- **Privacy-First**: Federated learning ensures data never leaves your environment
- **Decentralized**: Blockchain integration for transparent and trustless operations
- **Modular Design**: Microservices architecture for scalability and maintainability
- **Modern Stack**: FastAPI, React, Flower FL, and Ethereum smart contracts

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **Flower** - Federated learning framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and session management
- **Docker** - Containerization

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool

### Blockchain
- **Hardhat** - Ethereum development environment
- **Sepolia Testnet** - Testing network
- **Solidity** - Smart contract language

### DevOps
- **GitHub Actions** - CI/CD pipeline
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancer

## 📊 ML Features

Our prediction model uses 9 key features:
- **ProjectID**: Unique identifier
- **TeamExperience**: Years of combined team experience
- **PitchQuality**: NLP-scored pitch quality (0-1)
- **TokenomicsScore**: Tokenomics evaluation score (0-1)
- **Traction**: Normalized user/community metrics
- **CommunityEngagement**: Social media engagement score
- **PreviousFunding**: Historical funding amount (USD)
- **RaiseSuccessProb**: Predicted success probability (0-1)
- **SuccessLabel**: Binary success indicator

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mysticalseeker24/SuperPage.git
   cd SuperPage
   ```

2. **Set up the backend services**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📁 Project Structure

```
SuperPage/
├── services/
│   ├── ml-service/
│   │   ├── app/
│   │   │   ├── models/
│   │   │   ├── api/
│   │   │   └── core/
│   │   ├── tests/
│   │   └── Dockerfile
│   ├── api-gateway/
│   ├── data-service/
│   └── fl-coordinator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── public/
├── contracts/
│   ├── contracts/
│   ├── scripts/
│   └── test/
├── Dataset/
│   ├── dummy_dataset_aligned.csv
│   ├── startup_funding_aligned.csv
│   └── vc_investments_aligned.csv
└── docker/
    ├── docker-compose.yml
    └── nginx/
```

## 🧪 Testing

```bash
# Run all tests
make test

# Run specific service tests
cd services/ml-service && python -m pytest

# Run frontend tests
cd frontend && npm test
```

## 🚀 Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Flower team for the federated learning framework
- FastAPI community for the excellent web framework
- React team for the frontend framework
- Ethereum community for blockchain infrastructure

## 📞 Contact

- GitHub: [@mysticalseeker24](https://github.com/mysticalseeker24)
- Project Link: [https://github.com/mysticalseeker24/SuperPage](https://github.com/mysticalseeker24/SuperPage)

---

**Built with ❤️ for the decentralized future**
