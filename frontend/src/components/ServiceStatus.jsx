import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  ChevronUp, 
  ChevronDown,
  RefreshCw
} from 'lucide-react'
import { useQuery } from 'react-query'
import { checkAllServicesHealth } from '../services/api'

const ServiceStatus = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Query service health
  const { 
    data: healthData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    'serviceHealth',
    checkAllServicesHealth,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true,
      onSuccess: () => {
        setLastUpdate(new Date())
      },
    }
  )

  const services = [
    { key: 'ingestion', name: 'Ingestion', port: '8010' },
    { key: 'preprocessing', name: 'Preprocessing', port: '8001' },
    { key: 'prediction', name: 'Prediction', port: '8002' },
    { key: 'blockchain', name: 'Blockchain', port: '8003' },
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={16} className="text-green-500" />
      case 'unhealthy':
        return <AlertCircle size={16} className="text-yellow-500" />
      case 'error':
        return <XCircle size={16} className="text-red-500" />
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
    }
  }

  const getOverallStatus = () => {
    if (!healthData) return 'loading'
    
    const statuses = Object.values(healthData).map(service => service.status)
    
    if (statuses.every(status => status === 'healthy')) return 'healthy'
    if (statuses.some(status => status === 'error')) return 'error'
    return 'warning'
  }

  const overallStatus = getOverallStatus()
  const healthyCount = healthData 
    ? Object.values(healthData).filter(service => service.status === 'healthy').length 
    : 0

  const handleRefresh = () => {
    refetch()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Compact Status Indicator */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/90 dark:bg-dark-800/90 backdrop-blur-sm border border-gray-200 dark:border-dark-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Activity size={16} className={`${
          overallStatus === 'healthy' ? 'text-green-500' :
          overallStatus === 'warning' ? 'text-yellow-500' :
          overallStatus === 'error' ? 'text-red-500' :
          'text-gray-400'
        }`} />
        
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isLoading ? 'Checking...' : `${healthyCount}/4 Services`}
        </span>
        
        {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </motion.button>

      {/* Expanded Status Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 left-0 w-80 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Service Status
              </h3>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors"
                >
                  <RefreshCw size={14} className={`${isLoading ? 'animate-spin' : ''} text-gray-500`} />
                </button>
                
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Service List */}
            <div className="space-y-3">
              {services.map((service) => {
                const serviceHealth = healthData?.[service.key]
                const status = serviceHealth?.status || 'loading'
                
                return (
                  <motion.div
                    key={service.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {service.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Port {service.port}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-xs font-medium capitalize ${
                        status === 'healthy' ? 'text-green-600 dark:text-green-400' :
                        status === 'unhealthy' ? 'text-yellow-600 dark:text-yellow-400' :
                        status === 'error' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        {status === 'loading' ? 'Checking...' : status}
                      </p>
                      
                      {serviceHealth?.error && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-20 truncate">
                          {serviceHealth.error}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Overall Status */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-600">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Overall Status
                </span>
                
                <div className="flex items-center space-x-2">
                  {overallStatus === 'healthy' && (
                    <>
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        All Systems Operational
                      </span>
                    </>
                  )}
                  
                  {overallStatus === 'warning' && (
                    <>
                      <AlertCircle size={16} className="text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        Some Issues Detected
                      </span>
                    </>
                  )}
                  
                  {overallStatus === 'error' && (
                    <>
                      <XCircle size={16} className="text-red-500" />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        Services Down
                      </span>
                    </>
                  )}
                  
                  {overallStatus === 'loading' && (
                    <>
                      <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Checking Status...
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400">
                  Failed to check service status: {error.message}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ServiceStatus
