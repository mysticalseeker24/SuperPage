# 🌐 Netlify Frontend + Railway Backend Integration Guide

## 🎯 **Overview**

This guide will connect your Netlify-deployed React frontend to your Railway-deployed SuperPage backend services.

## 📋 **Step 1: Get Railway Service URLs**

First, get the URLs for all your deployed Railway services:

### **PowerShell Commands:**
```powershell
# Check all services status and get URLs
railway status

# Or get URLs from Railway dashboard
railway open
```

### **Expected Service URLs (All on Port 8080):**
```
https://superpage-ingestion-[random].up.railway.app
https://superpage-preprocessing-[random].up.railway.app
https://superpage-prediction-[random].up.railway.app
https://superpage-blockchain-[random].up.railway.app
```

**Note:** All Railway services automatically run on port 8080 and are accessible via HTTPS without specifying the port.

## 🔧 **Step 2: Update Frontend Environment Variables**

### **Create/Update `.env` file in frontend:**
```bash
# SuperPage Backend API URLs (Railway)
REACT_APP_API_BASE_URL=https://superpage-ingestion-[your-id].up.railway.app
REACT_APP_INGESTION_URL=https://superpage-ingestion-[your-id].up.railway.app
REACT_APP_PREPROCESSING_URL=https://superpage-preprocessing-[your-id].up.railway.app
REACT_APP_PREDICTION_URL=https://superpage-prediction-[your-id].up.railway.app
REACT_APP_BLOCKCHAIN_URL=https://superpage-blockchain-[your-id].up.railway.app

# Environment
REACT_APP_ENVIRONMENT=production
REACT_APP_NETWORK=sepolia

# MetaMask/Web3
REACT_APP_CHAIN_ID=11155111
REACT_APP_CONTRACT_ADDRESS=0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D
```

### **Update Netlify Environment Variables:**
1. **Go to Netlify Dashboard**: https://app.netlify.com
2. **Select your SuperPage site**
3. **Go to Site Settings → Environment Variables**
4. **Add the following variables:**

```
REACT_APP_API_BASE_URL = https://superpage-ingestion-[your-id].up.railway.app
REACT_APP_INGESTION_URL = https://superpage-ingestion-[your-id].up.railway.app
REACT_APP_PREPROCESSING_URL = https://superpage-preprocessing-[your-id].up.railway.app
REACT_APP_PREDICTION_URL = https://superpage-prediction-[your-id].up.railway.app
REACT_APP_BLOCKCHAIN_URL = https://superpage-blockchain-[your-id].up.railway.app
REACT_APP_ENVIRONMENT = production
REACT_APP_NETWORK = sepolia
REACT_APP_CHAIN_ID = 11155111
REACT_APP_CONTRACT_ADDRESS = 0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D
```

**Important:** Railway automatically handles port 8080 internally and exposes services via HTTPS URLs without port numbers.

## 📝 **Step 3: Update Frontend API Configuration**

### **Create/Update `src/config/api.js`:**
```javascript
// SuperPage API Configuration
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8010',
  services: {
    ingestion: process.env.REACT_APP_INGESTION_URL || 'http://localhost:8010',
    preprocessing: process.env.REACT_APP_PREPROCESSING_URL || 'http://localhost:8001', 
    prediction: process.env.REACT_APP_PREDICTION_URL || 'http://localhost:8002',
    blockchain: process.env.REACT_APP_BLOCKCHAIN_URL || 'http://localhost:8003'
  },
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Health checks
  health: {
    ingestion: `${API_CONFIG.services.ingestion}/health`,
    preprocessing: `${API_CONFIG.services.preprocessing}/health`, 
    prediction: `${API_CONFIG.services.prediction}/health`,
    blockchain: `${API_CONFIG.services.blockchain}/health`
  },
  
  // Ingestion endpoints
  ingestion: {
    ingest: `${API_CONFIG.services.ingestion}/ingest`,
    web3Startups: `${API_CONFIG.services.ingestion}/ingest/web3-startups`,
    jobStatus: (jobId) => `${API_CONFIG.services.ingestion}/jobs/${jobId}`,
    web3Sites: `${API_CONFIG.services.ingestion}/web3-sites`
  },
  
  // Preprocessing endpoints  
  preprocessing: {
    features: (projectId) => `${API_CONFIG.services.preprocessing}/features/${projectId}`
  },
  
  // Prediction endpoints
  prediction: {
    predict: `${API_CONFIG.services.prediction}/predict`,
    modelInfo: `${API_CONFIG.services.prediction}/model/info`
  },
  
  // Blockchain endpoints
  blockchain: {
    publish: `${API_CONFIG.services.blockchain}/publish`,
    transaction: (txHash) => `${API_CONFIG.services.blockchain}/transaction/${txHash}`
  }
};

export default API_CONFIG;
```

### **Create/Update `src/services/api.js`:**
```javascript
import axios from 'axios';
import API_CONFIG, { API_ENDPOINTS } from '../config/api';

// Create axios instance with default config
const apiClient = axios.create({
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers
});

// Request interceptor to add wallet address if available
apiClient.interceptors.request.use(
  (config) => {
    // Add wallet address to headers if available
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      config.headers['X-Wallet-Address'] = walletAddress;
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // Health checks
  async checkHealth() {
    const services = ['ingestion', 'preprocessing', 'prediction', 'blockchain'];
    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await apiClient.get(API_ENDPOINTS.health[service]);
          return { service, status: 'healthy', data: response.data };
        } catch (error) {
          return { service, status: 'unhealthy', error: error.message };
        }
      })
    );
    
    return healthChecks.map(result => result.value);
  },

  // Ingestion service
  async ingestData(url, schema) {
    const response = await apiClient.post(API_ENDPOINTS.ingestion.ingest, {
      url,
      schema
    });
    return response.data;
  },

  async ingestWeb3Startups(categoryFilter = null, schemaName = null) {
    const params = {};
    if (categoryFilter) params.category_filter = categoryFilter;
    if (schemaName) params.schema_name = schemaName;
    
    const response = await apiClient.post(API_ENDPOINTS.ingestion.web3Startups, null, { params });
    return response.data;
  },

  async getJobStatus(jobId) {
    const response = await apiClient.get(API_ENDPOINTS.ingestion.jobStatus(jobId));
    return response.data;
  },

  // Preprocessing service
  async getFeatures(projectId) {
    const response = await apiClient.get(API_ENDPOINTS.preprocessing.features(projectId));
    return response.data;
  },

  // Prediction service
  async predict(features) {
    const response = await apiClient.post(API_ENDPOINTS.prediction.predict, {
      features
    });
    return response.data;
  },

  async getModelInfo() {
    const response = await apiClient.get(API_ENDPOINTS.prediction.modelInfo);
    return response.data;
  },

  // Blockchain service
  async publishPrediction(projectId, score, proof, metadata = {}) {
    const response = await apiClient.post(API_ENDPOINTS.blockchain.publish, {
      project_id: projectId,
      score,
      proof,
      metadata
    });
    return response.data;
  },

  async getTransactionStatus(txHash) {
    const response = await apiClient.get(API_ENDPOINTS.blockchain.transaction(txHash));
    return response.data;
  }
};

export default apiService;
```

## 🔄 **Step 4: Update Frontend Components**

### **Update Main Prediction Component:**
```javascript
// src/components/PredictionInterface.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const PredictionInterface = () => {
  const [features, setFeatures] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState({});

  // Check backend health on component mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const health = await apiService.checkHealth();
      const healthMap = {};
      health.forEach(service => {
        healthMap[service.service] = service.status === 'healthy';
      });
      setHealthStatus(healthMap);
      console.log('🏥 Backend Health:', healthMap);
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  };

  const handlePredict = async () => {
    if (features.length !== 7) {
      alert('Please provide all 7 features');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.predict(features);
      setPrediction(result);
      console.log('🎯 Prediction Result:', result);
    } catch (error) {
      console.error('❌ Prediction failed:', error);
      alert('Prediction failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToBlockchain = async () => {
    if (!prediction) return;

    try {
      const proof = `0x${Date.now().toString(16).padStart(64, '0')}`;
      const result = await apiService.publishPrediction(
        'demo-project',
        prediction.score,
        proof,
        { timestamp: new Date().toISOString() }
      );
      console.log('⛓️ Blockchain Result:', result);
      alert('Prediction published to blockchain!');
    } catch (error) {
      console.error('❌ Blockchain publish failed:', error);
      alert('Blockchain publish failed. Please check connection.');
    }
  };

  return (
    <div className="prediction-interface">
      {/* Backend Health Status */}
      <div className="health-status">
        <h3>🏥 Backend Status</h3>
        {Object.entries(healthStatus).map(([service, healthy]) => (
          <div key={service} className={`status ${healthy ? 'healthy' : 'unhealthy'}`}>
            {service}: {healthy ? '✅ Healthy' : '❌ Unhealthy'}
          </div>
        ))}
      </div>

      {/* Feature Input */}
      <div className="feature-inputs">
        <h3>📊 Project Features</h3>
        {[
          'Team Experience (years)',
          'Pitch Quality (0-1)', 
          'Tokenomics Score (0-1)',
          'Traction (users)',
          'Community Engagement (0-1)',
          'Previous Funding ($)',
          'Raise Success Probability (0-1)'
        ].map((label, index) => (
          <input
            key={index}
            type="number"
            placeholder={label}
            value={features[index] || ''}
            onChange={(e) => {
              const newFeatures = [...features];
              newFeatures[index] = parseFloat(e.target.value) || 0;
              setFeatures(newFeatures);
            }}
          />
        ))}
      </div>

      {/* Prediction Button */}
      <button 
        onClick={handlePredict} 
        disabled={loading || !healthStatus.prediction}
        className="predict-button"
      >
        {loading ? '🔄 Predicting...' : '🎯 Get Prediction'}
      </button>

      {/* Prediction Results */}
      {prediction && (
        <div className="prediction-results">
          <h3>🎯 Prediction Results</h3>
          <div className="score">
            Success Score: <strong>{(prediction.score * 100).toFixed(1)}%</strong>
          </div>
          
          <div className="explanations">
            <h4>📈 Feature Importance</h4>
            {Object.entries(prediction.explanations || {}).map(([feature, importance]) => (
              <div key={feature} className="explanation">
                {feature}: {(importance * 100).toFixed(1)}%
              </div>
            ))}
          </div>

          <button 
            onClick={handlePublishToBlockchain}
            disabled={!healthStatus.blockchain}
            className="blockchain-button"
          >
            ⛓️ Publish to Blockchain
          </button>
        </div>
      )}
    </div>
  );
};

export default PredictionInterface;
```

## 🚀 **Step 5: Deploy Frontend Changes**

### **Commit and Push Changes:**
```bash
# Add environment variables and API configuration
git add .
git commit -m "feat: integrate Railway backend services with Netlify frontend"
git push origin main
```

### **Netlify Auto-Deploy:**
Netlify will automatically detect the changes and redeploy your frontend with the new backend integration.

## 🔍 **Step 6: Test Integration**

### **Test Backend Connectivity:**
1. **Open your Netlify site**
2. **Check browser console** for API requests
3. **Verify health status** shows all services as healthy
4. **Test prediction flow** with sample data
5. **Test blockchain publishing** (if MetaMask connected)

### **Debug Common Issues:**

#### **CORS Errors:**
If you see CORS errors, update Railway backend CORS settings:
```powershell
# Update FRONTEND_URL for each service
railway variables --set "FRONTEND_URL=https://your-netlify-site.netlify.app"
```

#### **Network Errors:**
- Check Railway service URLs are correct
- Verify services are running: `railway status`
- Check Netlify environment variables

#### **API Timeouts:**
- Increase timeout in API config
- Check Railway service logs: `railway logs`

## 🎯 **Expected Results**

After successful integration:

✅ **Frontend connects to Railway backend**  
✅ **Health checks show all services healthy**  
✅ **Prediction requests work end-to-end**  
✅ **SHAP explanations display correctly**  
✅ **Blockchain publishing functions**  
✅ **Real-time status monitoring**  

Your SuperPage application will be fully integrated with production backend services! 🎉

## ✅ **Quick Setup Checklist**

### **1. Get Railway URLs** ⏱️ 2 minutes
```powershell
railway status  # Copy all service URLs
```

### **2. Update Netlify Environment Variables** ⏱️ 3 minutes
- Go to Netlify Dashboard → Site Settings → Environment Variables
- Add all REACT_APP_* variables with your Railway URLs
- Save and trigger redeploy

### **3. Update Frontend Code** ⏱️ 10 minutes
- Create `src/config/api.js` with Railway URLs
- Create `src/services/api.js` with API functions
- Update components to use apiService
- Commit and push changes

### **4. Test Integration** ⏱️ 5 minutes
- Open Netlify site
- Check browser console for API calls
- Test prediction flow
- Verify blockchain publishing

**Total Setup Time: ~20 minutes** ⚡

## 🔧 **Troubleshooting Guide**

### **Issue: CORS Errors**
```
Access to fetch at 'https://service.railway.app' from origin 'https://site.netlify.app' has been blocked by CORS policy
```

**Solution:**
```powershell
# Update each Railway service
Set-Location backend\ingestion_service
railway variables --set "FRONTEND_URL=https://your-site.netlify.app"

Set-Location ..\preprocessing_service
railway variables --set "FRONTEND_URL=https://your-site.netlify.app"

Set-Location ..\prediction_service
railway variables --set "FRONTEND_URL=https://your-site.netlify.app"

Set-Location ..\blockchain_service
railway variables --set "FRONTEND_URL=https://your-site.netlify.app"
```

### **Issue: 404 Service Not Found**
```
GET https://service.railway.app/health 404 (Not Found)
```

**Solution:**
1. Check service is deployed: `railway status`
2. Verify URL is correct in Netlify environment variables
3. Check service logs: `railway logs`

### **Issue: Environment Variables Not Loading**
```
REACT_APP_PREDICTION_URL is undefined
```

**Solution:**
1. Verify variables are set in Netlify Dashboard
2. Trigger manual redeploy in Netlify
3. Check variables start with `REACT_APP_`

### **Issue: API Timeouts**
```
Request timeout of 30000ms exceeded
```

**Solution:**
1. Check Railway service health: `railway logs`
2. Increase timeout in `src/config/api.js`
3. Verify Railway services aren't sleeping

### **Issue: MetaMask Connection**
```
MetaMask not detected or wrong network
```

**Solution:**
1. Ensure MetaMask is installed
2. Switch to Sepolia testnet
3. Check contract address is correct

## 📱 **Mobile Testing**

Test your integrated app on mobile devices:

1. **Open Netlify site on mobile**
2. **Test MetaMask mobile app integration**
3. **Verify responsive design works**
4. **Check API calls work on mobile networks**

## 🚀 **Performance Optimization**

### **API Caching:**
```javascript
// Add to src/services/api.js
const cache = new Map();

export const cachedApiCall = async (key, apiFunction, ttl = 300000) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await apiFunction();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

### **Loading States:**
```javascript
// Add loading indicators for better UX
const [loading, setLoading] = useState({
  health: false,
  prediction: false,
  blockchain: false
});
```

## 🎯 **Success Metrics**

Your integration is successful when:

✅ **All health checks return 200 OK**
✅ **Prediction requests complete in <5 seconds**
✅ **SHAP explanations display correctly**
✅ **Blockchain transactions succeed**
✅ **No CORS errors in console**
✅ **Mobile experience works smoothly**

## 🔄 **Continuous Integration**

Set up automatic testing:

1. **Add health check to CI/CD**
2. **Test API endpoints in GitHub Actions**
3. **Monitor Railway service uptime**
4. **Set up Netlify deploy notifications**

Your SuperPage application is now production-ready with full backend integration! 🚀
