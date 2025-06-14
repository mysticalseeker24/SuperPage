# SuperPage Frontend Setup Guide

> Complete guide to set up and run the SuperPage React frontend

## 🎯 Overview

The SuperPage frontend is a modern React application that provides an intuitive interface for Web3 fundraising prediction. Built with CSS-in-JS and Framer Motion (no Tailwind), it features **mandatory wallet authentication**, complete page routing, responsive design, and seamless integration with all backend microservices and MetaMask for blockchain functionality.

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm 9+**
- **MetaMask** browser extension
- **SuperPage backend services** running (see main README)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will be available at: **http://localhost:3000**

### 3. Connect MetaMask

1. Open the application in your browser
2. Click "Connect MetaMask" 
3. Approve the connection in MetaMask
4. Switch to Sepolia testnet when prompted

## 🔧 Configuration

### Environment Variables (Optional)

Create `frontend/.env.local` for custom configuration:

```env
# Backend API URLs (defaults to localhost)
VITE_INGESTION_API_URL=http://localhost:8010
VITE_PREPROCESSING_API_URL=http://localhost:8001
VITE_PREDICTION_API_URL=http://localhost:8002
VITE_BLOCKCHAIN_API_URL=http://localhost:8003

# Blockchain Configuration
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
VITE_CONTRACT_ADDRESS=0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D
```

### Backend Service Requirements

The frontend requires these backend services to be running:

- **Ingestion Service**: Port 8010
- **Preprocessing Service**: Port 8001  
- **Prediction Service**: Port 8002
- **Blockchain Service**: Port 8003

## 🎨 Features

### 🔐 Wallet-First Authentication
- **Mandatory Connection**: Site access requires MetaMask wallet connection
- **Beautiful Gate**: Glassmorphism authentication screen with animations
- **Auto-Detection**: Checks for existing wallet connections on load
- **MetaMask Installation**: Prompts and guides users to install MetaMask
- **Network Detection**: Auto-switch to Sepolia testnet
- **Connection Persistence**: Remembers wallet state across sessions
- **Security Enforcement**: Automatic logout and page reload on disconnection
- **Error Handling**: Comprehensive error messages and recovery options

### 📊 Prediction Interface
- **Interactive Form**: 7-feature input matching ML model
- **Real-time Validation**: Form validation with helpful messages
- **Slider Controls**: Intuitive range inputs for numeric values
- **Progress Indicators**: Visual feedback during processing

### 🤖 AI Predictions
- **SHAP Explanations**: Top 3 feature importance display
- **Success Probability**: Visual percentage with progress bar
- **Feature Analysis**: Detailed breakdown of contributing factors
- **Confidence Indicators**: Model certainty visualization

### ⛓️ Blockchain Publishing
- **Smart Contract Integration**: Publish predictions to Sepolia
- **Transaction Tracking**: Etherscan links for verification
- **Cryptographic Proofs**: Hash-based authenticity
- **Gas Optimization**: Efficient contract interactions

### 🔍 Service Monitoring
- **Real-time Health Checks**: Monitor all backend services
- **Status Dashboard**: Visual service status indicators
- **Auto-refresh**: 30-second health check intervals
- **Error Reporting**: Detailed error messages

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Layout.jsx           # Main layout with navigation
│   │   ├── Router.jsx           # React Router configuration
│   │   ├── HomePage.jsx         # Landing page with hero section
│   │   ├── PredictPage.jsx      # Prediction interface page
│   │   ├── ExplorePage.jsx      # Community predictions page
│   │   ├── AboutPage.jsx        # About page with markdown
│   │   ├── NotFoundPage.jsx     # 404 error page
│   │   ├── WalletConnect.jsx    # Wallet connection UI
│   │   ├── PitchForm.jsx        # Prediction form
│   │   ├── PredictionCard.jsx   # Results display
│   │   ├── StartupsList.jsx     # Community predictions list
│   │   └── ServiceStatus.jsx    # Health monitoring
│   ├── hooks/              # Custom React hooks
│   │   └── useWallet.js        # Wallet connection logic
│   ├── services/           # API integration
│   │   └── api.js             # Backend service calls
│   ├── api/                # Centralized API client
│   │   └── clients.js         # Axios client with interceptors
│   ├── App.jsx            # Root component with React Query
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles (no Tailwind)
├── public/                # Static assets
│   └── about.md          # About page markdown content
├── package.json          # Dependencies (no Tailwind)
├── vite.config.js       # Vite configuration
├── .eslintrc.cjs        # ESLint configuration
└── README.md            # Frontend documentation
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
cd frontend
docker build -t superpage-frontend .
```

### Run Container

```bash
docker run -p 3000:80 superpage-frontend
```

### Docker Compose (Recommended)

The frontend is included in the main docker-compose.yml:

```bash
# From project root
docker-compose up frontend
```

## 🔗 API Integration

### Service Endpoints

The frontend communicates with these backend services:

- **POST /api/prediction/predict** - Get AI prediction with SHAP explanations
- **POST /api/blockchain/publish** - Publish prediction to smart contract
- **GET /api/*/health** - Health check endpoints

### Feature Mapping

Form inputs are converted to ML features:

1. **Team Experience** → `TeamExperience` (0.5-15.0 years)
2. **Pitch Description** → `PitchQuality` (0.0-1.0 NLP score)
3. **Tokenomics URL** → `TokenomicsScore` (0.0-1.0 validity)
4. **Traction** → `Traction` (1-25000 normalized)
5. **Community Engagement** → `CommunityEngagement` (0.0-0.5)
6. **Previous Funding** → `PreviousFunding` (0-100M USD)
7. **Calculated** → `RaiseSuccessProb` (0.0-1.0 computed)

## 🎯 User Flow

### 1. Wallet Authentication Gate
1. User opens application
2. **WalletGate** blocks access until wallet connected
3. System checks for existing MetaMask installation
4. If not installed, shows installation prompt with direct link
5. User clicks "Connect MetaMask Wallet"
6. MetaMask popup for connection approval
7. Auto-switch to Sepolia testnet if needed
8. **Access granted** - user enters full application
9. Wallet address displayed in header with connection indicator

### 2. Prediction Process
1. Fill out 7-feature pitch form
2. Real-time validation feedback
3. Submit for AI prediction
4. View results with SHAP explanations
5. Optionally publish to blockchain

### 3. Results Display
1. Success probability percentage
2. Top 3 contributing factors
3. Feature importance visualization
4. Project details summary
5. Blockchain publishing option

## 🐛 Troubleshooting

### Common Issues

**MetaMask Not Detected**
- Install MetaMask browser extension
- Refresh the page after installation

**Network Issues**
- Ensure you're on Sepolia testnet
- Check if backend services are running
- Verify API endpoints in browser network tab

**Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

**Service Connection Errors**
- Check backend services are running on correct ports
- Verify CORS settings in backend services
- Check browser console for detailed error messages

### Health Check

Use the service status indicator in the bottom-left corner to monitor backend service health.

## 📱 Mobile Support

The frontend is fully responsive and supports:
- **Mobile browsers** with MetaMask mobile app
- **Tablet interfaces** with optimized layouts
- **Desktop browsers** with full feature set

## 🔒 Security

- **CSP Headers**: Content Security Policy protection
- **HTTPS Ready**: SSL/TLS support for production
- **Wallet Security**: No private key storage
- **API Validation**: Input sanitization and validation

## 🚀 Production Deployment

### Build Optimization

```bash
npm run build
```

### Nginx Configuration

The included `nginx.conf` provides:
- Static asset caching
- API proxying to backend services
- Security headers
- Gzip compression

### Environment Setup

For production deployment:
1. Set environment variables for API URLs
2. Configure SSL certificates
3. Set up proper CORS policies
4. Monitor service health

---

**Ready to predict the future of fundraising! 🚀**
