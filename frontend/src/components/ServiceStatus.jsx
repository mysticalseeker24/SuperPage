import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { checkAllServicesHealth } from '../services/api'

const ServiceStatus = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    data: healthData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['serviceHealth'],
    queryFn: checkAllServicesHealth,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ position: 'relative' }}
    >
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(229, 231, 235, 0.5)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Activity size={16} style={{
          color: overallStatus === 'healthy' ? '#10b981' :
                 overallStatus === 'warning' ? '#f59e0b' :
                 overallStatus === 'error' ? '#ef4444' :
                 '#9ca3af'
        }} />

        <span>
          {isLoading ? 'Checking...' : `${healthyCount}/4 Services`}
        </span>
      </motion.button>

      {error && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          marginBottom: '8px',
          left: 0,
          padding: '8px 12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#dc2626',
          maxWidth: '200px',
        }}>
          Service check failed
        </div>
      )}
    </motion.div>
  )
}

export default ServiceStatus
