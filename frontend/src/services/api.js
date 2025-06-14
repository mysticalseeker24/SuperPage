import axios from 'axios'
import { apiClients } from '../api/clients.js'

// Create axios instances for each service
const createApiInstance = (baseURL, serviceName) => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      console.log(`[${serviceName}] Request:`, config.method?.toUpperCase(), config.url)
      return config
    },
    (error) => {
      console.error(`[${serviceName}] Request error:`, error)
      return Promise.reject(error)
    }
  )

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      console.log(`[${serviceName}] Response:`, response.status, response.data)
      return response
    },
    (error) => {
      console.error(`[${serviceName}] Response error:`, error.response?.data || error.message)
      
      // Transform error for better handling
      const transformedError = {
        message: error.response?.data?.detail || error.message || 'An error occurred',
        status: error.response?.status,
        service: serviceName,
        originalError: error,
      }
      
      return Promise.reject(transformedError)
    }
  )

  return instance
}

// API instances
const ingestionApi = createApiInstance('/api/ingestion', 'Ingestion')
const preprocessingApi = createApiInstance('/api/preprocessing', 'Preprocessing')
const predictionApi = createApiInstance('/api/prediction', 'Prediction')
const blockchainApi = createApiInstance('/api/blockchain', 'Blockchain')

// Direct service URLs for health checks (bypassing proxy)
const DIRECT_URLS = {
  ingestion: 'http://localhost:8010',
  preprocessing: 'http://localhost:8001',
  prediction: 'http://localhost:8002',
  blockchain: 'http://localhost:8003',
}

// Health check function
export const checkServiceHealth = async (serviceName) => {
  try {
    const response = await fetch(`${DIRECT_URLS[serviceName]}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    if (response.ok) {
      const data = await response.json()
      return { status: 'healthy', data }
    } else {
      return { status: 'unhealthy', error: `HTTP ${response.status}` }
    }
  } catch (error) {
    return { status: 'error', error: error.message }
  }
}

// Check all services health
export const checkAllServicesHealth = async () => {
  const services = ['ingestion', 'preprocessing', 'prediction', 'blockchain']
  const results = {}
  
  await Promise.all(
    services.map(async (service) => {
      results[service] = await checkServiceHealth(service)
    })
  )
  
  return results
}

// Prediction API
export const predictionService = {
  // Make prediction using centralized client
  predict: async (features) => {
    return await apiClients.predict(features)
  },

  // Get model info
  getModelInfo: async () => {
    const response = await predictionApi.get('/model/info')
    return response.data
  },

  // Health check
  health: async () => {
    const response = await predictionApi.get('/health')
    return response.data
  },
}

// Blockchain API
export const blockchainService = {
  // Publish prediction to blockchain using centralized client
  publish: async (projectId, score, proof) => {
    return await apiClients.publish(projectId, score, proof)
  },

  // Get contract info
  getContractInfo: async () => {
    const response = await blockchainApi.get('/contract/info')
    return response.data
  },

  // Health check
  health: async () => {
    const response = await blockchainApi.get('/health')
    return response.data
  },
}

// Ingestion API
export const ingestionService = {
  // Ingest data from URL
  ingest: async (url, schema) => {
    const response = await ingestionApi.post('/ingest', {
      url,
      extraction_schema: schema,
    })
    return response.data
  },

  // Get job status
  getJobStatus: async (jobId) => {
    const response = await ingestionApi.get(`/job/${jobId}`)
    return response.data
  },

  // Health check
  health: async () => {
    const response = await ingestionApi.get('/health')
    return response.data
  },
}

// Preprocessing API
export const preprocessingService = {
  // Get features for project
  getFeatures: async (projectId) => {
    const response = await preprocessingApi.get(`/features/${projectId}`)
    return response.data
  },

  // Health check
  health: async () => {
    const response = await preprocessingApi.get('/health')
    return response.data
  },
}

// Utility functions
export const convertPitchToFeatures = (pitchData) => {
  // Convert pitch form data to ML features array
  // Based on the 7 features: TeamExperience, PitchQuality, TokenomicsScore, Traction, CommunityEngagement, PreviousFunding, RaiseSuccessProb
  
  const {
    teamExperience = 5.0,
    pitchDescription = '',
    tokenomicsUrl = '',
    traction = 1000,
    communityEngagement = 0.1,
    previousFunding = 0,
  } = pitchData

  // Calculate pitch quality based on description length and content
  const pitchQuality = Math.min(
    0.1 + (pitchDescription.length / 1000) * 0.9,
    1.0
  )

  // Calculate tokenomics score based on URL presence and validity
  const tokenomicsScore = tokenomicsUrl && tokenomicsUrl.startsWith('http') ? 0.8 : 0.3

  // Normalize traction (assuming max 25000 as per dataset)
  const normalizedTraction = Math.min(traction, 25000)

  // Calculate success probability based on other factors
  const raiseSuccessProb = Math.min(
    (teamExperience / 15) * 0.3 +
    pitchQuality * 0.25 +
    tokenomicsScore * 0.2 +
    (normalizedTraction / 25000) * 0.15 +
    communityEngagement * 0.1,
    1.0
  )

  return [
    teamExperience,           // TeamExperience (0.5-15.0)
    pitchQuality,            // PitchQuality (0.0-1.0)
    tokenomicsScore,         // TokenomicsScore (0.0-1.0)
    normalizedTraction,      // Traction (1-25000)
    communityEngagement,     // CommunityEngagement (0.0-0.5)
    previousFunding,         // PreviousFunding (0-100M)
    raiseSuccessProb,        // RaiseSuccessProb (0.0-1.0)
  ]
}

// Feature names for display
export const FEATURE_NAMES = [
  'Team Experience',
  'Pitch Quality',
  'Tokenomics Score',
  'Traction',
  'Community Engagement',
  'Previous Funding',
  'Success Probability',
]

// Export all services
export default {
  prediction: predictionService,
  blockchain: blockchainService,
  ingestion: ingestionService,
  preprocessing: preprocessingService,
  health: {
    checkService: checkServiceHealth,
    checkAll: checkAllServicesHealth,
    getServiceStatus: apiClients.getServiceStatus,
  },
  utils: {
    convertPitchToFeatures,
    FEATURE_NAMES,
  },
  // Centralized API client functions
  client: {
    connectWallet: apiClients.connectWallet,
    predict: apiClients.predict,
    publish: apiClients.publish,
    getTopPredictions: apiClients.getTopPredictions,
    setWalletAddress: apiClients.setWalletAddress,
    getWalletAddress: apiClients.getWalletAddress,
    disconnectWallet: apiClients.disconnectWallet,
    isWalletConnected: apiClients.isWalletConnected,
  },
}
