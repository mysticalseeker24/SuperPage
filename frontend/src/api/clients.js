import axios from 'axios'

// Toast notification function (simple implementation)
const showToast = (message, type = 'error') => {
  // Create a simple toast notification
  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    color: white;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    z-index: 10000;
    max-width: 400px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    animation: slideIn 0.3s ease-out;
    ${type === 'error' 
      ? 'background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);' 
      : 'background: linear-gradient(135deg, #10b981 0%, #059669 100%);'
    }
  `
  toast.textContent = message

  // Add animation keyframes if not already added
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style')
    style.id = 'toast-styles'
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(toast)

  // Remove toast after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in'
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, 5000)
}

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Store for connected wallet address
let connectedAddress = null

// Request interceptor to inject wallet address
apiClient.interceptors.request.use(
  (config) => {
    if (connectedAddress) {
      config.headers['x-wallet-address'] = connectedAddress
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    let errorMessage = 'An unexpected error occurred'

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          errorMessage = 'Unauthorized. Please connect your wallet.'
          break
        case 403:
          errorMessage = 'Access forbidden. Check your permissions.'
          break
        case 404:
          errorMessage = 'Service not found. Please try again later.'
          break
        case 429:
          errorMessage = 'Too many requests. Please wait a moment.'
          break
        case 500:
          errorMessage = 'Server error. Please try again later.'
          break
        default:
          errorMessage = data?.message || data?.detail || `Error ${status}: ${error.response.statusText}`
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error. Please check your connection and try again.'
    } else {
      // Other error
      errorMessage = error.message || 'An unexpected error occurred'
    }

    // Show toast notification
    showToast(errorMessage, 'error')

    return Promise.reject(error)
  }
)

// API client functions
export const apiClients = {
  /**
   * Connect to MetaMask wallet and return the address
   * @returns {Promise<string>} The connected wallet address
   */
  async connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.')
      }

      const address = accounts[0]
      connectedAddress = address

      // Store connection state
      localStorage.setItem('walletConnected', 'true')
      localStorage.setItem('walletAddress', address)

      showToast('Wallet connected successfully!', 'success')
      return address
    } catch (error) {
      console.error('Wallet connection error:', error)
      throw new Error(error.message || 'Failed to connect wallet')
    }
  },

  /**
   * Get prediction for startup data
   * @param {Object} data - The startup data for prediction
   * @returns {Promise<{score: number, explanations: Object}>} Prediction results
   */
  async predict(data) {
    try {
      const response = await apiClient.post('/api/predict', {
        features: data,
        wallet_address: connectedAddress,
      })

      return {
        score: response.data.score,
        explanations: response.data.explanations || {},
      }
    } catch (error) {
      console.error('Prediction error:', error)
      throw new Error('Failed to get prediction. Please try again.')
    }
  },

  /**
   * Publish prediction to blockchain
   * @param {string} projectId - The project identifier
   * @param {number} score - The prediction score
   * @param {string} proof - Cryptographic proof
   * @returns {Promise<{txHash: string}>} Transaction hash
   */
  async publish(projectId, score, proof) {
    try {
      const response = await apiClient.post('/api/blockchain/publish', {
        project_id: projectId,
        score: score,
        proof: proof,
        wallet_address: connectedAddress,
      })

      showToast('Prediction published to blockchain!', 'success')
      return {
        txHash: response.data.transaction_hash || response.data.txHash,
      }
    } catch (error) {
      console.error('Blockchain publish error:', error)
      throw new Error('Failed to publish to blockchain. Please try again.')
    }
  },

  /**
   * Get top predictions from the platform
   * @param {Object} options - Query options (limit, offset, filters)
   * @returns {Promise<Array>} Array of prediction objects
   */
  async getTopPredictions(options = {}) {
    try {
      const params = {
        limit: options.limit || 50,
        offset: options.offset || 0,
        ...options.filters,
      }

      const response = await apiClient.get('/api/predictions/top', { params })

      return response.data.predictions || response.data || []
    } catch (error) {
      console.error('Get predictions error:', error)
      throw new Error('Failed to fetch predictions. Please try again.')
    }
  },

  /**
   * Get service health status
   * @returns {Promise<Object>} Service status information
   */
  async getServiceStatus() {
    try {
      const services = [
        { name: 'Ingestion', url: '/api/ingestion/health' },
        { name: 'Preprocessing', url: '/api/preprocessing/health' },
        { name: 'Prediction', url: '/api/prediction/health' },
        { name: 'Blockchain', url: '/api/blockchain/health' },
      ]

      const statusPromises = services.map(async (service) => {
        try {
          const response = await apiClient.get(service.url, { timeout: 5000 })
          return {
            name: service.name,
            status: 'healthy',
            response_time: response.headers['x-response-time'] || 'N/A',
          }
        } catch (error) {
          return {
            name: service.name,
            status: 'unhealthy',
            error: error.message,
          }
        }
      })

      const results = await Promise.all(statusPromises)
      return results
    } catch (error) {
      console.error('Service status error:', error)
      return []
    }
  },

  /**
   * Set the connected wallet address
   * @param {string} address - The wallet address
   */
  setWalletAddress(address) {
    connectedAddress = address
  },

  /**
   * Get the currently connected wallet address
   * @returns {string|null} The connected address or null
   */
  getWalletAddress() {
    return connectedAddress
  },

  /**
   * Disconnect wallet
   */
  disconnectWallet() {
    connectedAddress = null
    localStorage.removeItem('walletConnected')
    localStorage.removeItem('walletAddress')
    showToast('Wallet disconnected', 'success')
  },

  /**
   * Check if wallet is connected
   * @returns {boolean} Connection status
   */
  isWalletConnected() {
    return !!connectedAddress
  },
}

// Initialize wallet address from localStorage on module load
const savedAddress = localStorage.getItem('walletAddress')
const wasConnected = localStorage.getItem('walletConnected') === 'true'

if (savedAddress && wasConnected) {
  connectedAddress = savedAddress
}

export default apiClients
