# SuperPage Installation Guide

This guide ensures compatibility across different Python versions, operating systems, and hardware configurations.

## 🔧 Prerequisites

### System Requirements
- **Python**: 3.9 - 3.12 (3.13 has limited ML library support)
- **Node.js**: 18+ (for smart contracts and frontend)
- **MetaMask**: Browser extension for wallet authentication
- **Memory**: 8GB RAM minimum
- **Storage**: 10GB free space

### Recommended Setup
```bash
# Check Python version
python --version  # Should be 3.9-3.12

# Check Node.js version
node --version    # Should be 16+
```

## 🚀 Installation Methods

### Option 1: Docker Compose (Recommended)
```bash
# Clone repository
git clone https://github.com/mysticalseeker24/SuperPage.git
cd SuperPage

# Start complete system
docker-compose up
```

### Option 2: Manual Installation

#### Step 1: Create Virtual Environment
```bash
# Create virtual environment (recommended)
python -m venv superpage-env

# Activate virtual environment
# Windows:
superpage-env\Scripts\activate
# Linux/Mac:
source superpage-env/bin/activate
```

#### Step 2: Install Core Dependencies
```bash
# Install root dependencies (minimal)
pip install -r requirements.txt
```

#### Step 3: Install Service Dependencies
```bash
# Install each service individually
cd backend/ingestion_service
pip install -r requirements.txt
cd ../..

cd backend/preprocessing_service
pip install -r requirements.txt
cd ../..

cd backend/prediction_service
pip install -r requirements.txt
cd ../..

cd backend/training_service
pip install -r requirements.txt
cd ../..

cd backend/blockchain_service
pip install -r requirements.txt
cd ../..
```

#### Step 4: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

#### Step 5: Install Smart Contract Dependencies
```bash
cd smart-contracts
npm install
cd ..
```

## 🔧 Compatibility Fixes

### Python 3.13 Compatibility
If you're using Python 3.13, some ML libraries may have compilation issues:

```bash
# Install compatible scikit-learn version
pip install --only-binary=all scikit-learn==1.5.2

# Install PyTorch with specific index
pip install torch>=2.0.0 --index-url https://download.pytorch.org/whl/cpu
```

### Windows-Specific Issues
```bash
# If you encounter Cython compilation errors:
pip install --only-binary=all scikit-learn pandas numpy

# For Visual Studio Build Tools errors:
# Download and install Microsoft C++ Build Tools
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

### macOS-Specific Issues
```bash
# Install Xcode command line tools if needed
xcode-select --install

# For M1/M2 Macs, use conda for better compatibility:
conda install pytorch scikit-learn pandas numpy -c pytorch
```

### Linux-Specific Issues
```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install build-essential python3-dev

# For CentOS/RHEL:
sudo yum groupinstall "Development Tools"
sudo yum install python3-devel
```

## 🧪 Verification

### Test Individual Services
```bash
# Test ingestion service
cd backend/ingestion_service
python -m pytest tests/ -v

# Test preprocessing service
cd backend/preprocessing_service
python -m pytest tests/ -v

# Test prediction service
cd backend/prediction_service
python -m pytest tests/ -v

# Test training service
cd backend/training_service
python -m pytest tests/ -v

# Test blockchain service
cd backend/blockchain_service
python -m pytest tests/ -v
```

### Test Smart Contracts
```bash
cd smart-contracts
npm test
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. "No module named 'torch'"
```bash
# Install PyTorch
pip install torch>=2.0.0,<3.0.0
```

#### 2. "Microsoft Visual C++ 14.0 is required"
```bash
# Windows: Install Visual Studio Build Tools
# Or use pre-compiled wheels:
pip install --only-binary=all scikit-learn
```

#### 3. "Failed building wheel for scikit-learn"
```bash
# Use compatible version
pip install scikit-learn==1.5.2 --only-binary=all
```

#### 4. "Node.js version not supported"
```bash
# Install Node.js 16+ from https://nodejs.org/
# Or use nvm:
nvm install 18
nvm use 18
```

#### 5. Memory errors during training
```bash
# Reduce batch size in training
python train_federated.py --batch-size 16

# Or use CPU-only mode
export CUDA_VISIBLE_DEVICES=""
```

## 📦 Minimal Installation

For users who only want to run specific services:

### Prediction Service Only
```bash
cd backend/prediction_service
pip install fastapi uvicorn torch scikit-learn numpy shap python-dotenv
```

### Training Service Only
```bash
cd backend/training_service
pip install flwr torch pandas numpy scikit-learn python-dotenv
```

### Smart Contracts Only
```bash
cd smart-contracts
npm install
```

## 🔒 Security Notes

1. **Virtual Environment**: Always use a virtual environment
2. **Dependencies**: Only install required dependencies
3. **Updates**: Keep dependencies updated for security patches
4. **Private Keys**: Never commit private keys to version control

## 📈 Performance Optimization

### For Better Performance
```bash
# Install optimized NumPy/SciPy
pip install numpy[mkl] scipy[mkl]

# Use conda for scientific computing
conda install numpy scipy scikit-learn pandas -c conda-forge
```

### For GPU Support (Optional)
```bash
# Install CUDA-enabled PyTorch
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

## ✅ Success Indicators

After successful installation, you should be able to:

1. **Import all libraries without errors**
2. **Run individual service tests**
3. **Start services on their respective ports**
4. **Deploy smart contracts to testnet**
5. **Train the federated learning model**

## 🆘 Getting Help

If you encounter issues:

1. **Check Python version**: Must be 3.9-3.12
2. **Use virtual environment**: Isolates dependencies
3. **Install binary wheels**: Avoids compilation issues
4. **Check system dependencies**: Build tools, etc.
5. **Open an issue**: Include error logs and system info

---

**Happy coding! 🚀**
