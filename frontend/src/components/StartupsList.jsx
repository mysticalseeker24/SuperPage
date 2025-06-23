import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  DollarSign,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Star,
  Calendar
} from 'lucide-react'

// Get stored predictions from localStorage and combine with sample data
const fetchTopPredictions = async () => {
  try {
    // Get stored predictions from localStorage
    const storedPredictions = JSON.parse(localStorage.getItem('superpage_predictions') || '[]')

    // Create sample data to fill the list
    const samplePredictions = Array.from({ length: Math.max(0, 20 - storedPredictions.length) }, (_, index) => ({
      id: `sample-${index + 1}`,
      projectId: `startup-${String(index + 1).padStart(3, '0')}`,
      title: `Web3 Startup ${index + 1}`,
      score: Math.random(),
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      teamExperience: 2 + Math.random() * 13,
      previousFunding: Math.random() * 10000000,
      traction: Math.floor(Math.random() * 25000),
      category: ['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'Social'][Math.floor(Math.random() * 5)],
      walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      isUserPrediction: false,
    }))

    // Combine stored predictions (at top) with sample data
    const allPredictions = [
      ...storedPredictions.map(p => ({ ...p, isUserPrediction: true })),
      ...samplePredictions
    ]

    return allPredictions
  } catch (error) {
    console.error('Failed to fetch predictions:', error)
    return []
  }
}

const StartupsList = ({ onViewDetails }) => {
  const [scoreThreshold, setScoreThreshold] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('score') // 'score', 'timestamp', 'funding'
  const [sortOrder, setSortOrder] = useState('desc')

  // Fetch predictions data
  const {
    data: predictions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['topPredictions'],
    queryFn: fetchTopPredictions,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  })

  // Filter and sort predictions
  const filteredPredictions = useMemo(() => {
    let filtered = predictions.filter(prediction => {
      const matchesScore = prediction.score >= scoreThreshold / 100
      const matchesSearch = prediction.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prediction.title.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesScore && matchesSearch
    })

    // Sort predictions
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'score':
          aValue = a.score
          bValue = b.score
          break
        case 'timestamp':
          aValue = new Date(a.timestamp)
          bValue = new Date(b.timestamp)
          break
        case 'funding':
          aValue = a.previousFunding
          bValue = b.previousFunding
          break
        default:
          aValue = a.score
          bValue = b.score
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1
      } else {
        return aValue > bValue ? 1 : -1
      }
    })

    return filtered
  }, [predictions, scoreThreshold, searchTerm, sortBy, sortOrder])

  // Prediction Card Component
  const PredictionCard = ({ prediction, index }) => {
    const successProbability = Math.round(prediction.score * 100)
    const isPositive = successProbability >= 50
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

    const cardStyle = {
      background: isDark
        ? 'rgba(29, 28, 36, 0.8)'
        : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
      borderRadius: '16px',
      padding: '24px',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    }

    const cardHoverStyle = {
      transform: 'translateY(-4px)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      borderColor: '#CA4E79',
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        style={cardStyle}
        whileHover={cardHoverStyle}
        onClick={() => onViewDetails && onViewDetails(prediction)}
      >
        {/* User Prediction Badge */}
        {prediction.isUserPrediction && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <Star size={12} />
            Your Prediction
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: isDark ? '#f9fafb' : '#1f2937',
            marginBottom: '4px',
          }}>
            {prediction.title}
          </h3>
          <p style={{
            fontSize: '14px',
            color: isDark ? '#9ca3af' : '#6b7280',
            fontFamily: 'monospace',
          }}>
            {prediction.projectId}
          </p>
        </div>

        {/* Success Rate */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{
              fontSize: '14px',
              color: isDark ? '#9ca3af' : '#6b7280',
              fontWeight: '500',
            }}>
              Success Rate
            </span>
            <span style={{
              fontSize: '18px',
              fontWeight: '700',
              color: isPositive
                ? (isDark ? '#10b981' : '#059669')
                : (isDark ? '#ef4444' : '#dc2626'),
            }}>
              {successProbability}%
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '8px',
            background: isDark ? '#374151' : '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${successProbability}%` }}
              transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
              style={{
                height: '100%',
                background: isPositive
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '14px',
          }}>
            <DollarSign size={16} />
            <span>${prediction.previousFunding?.toLocaleString() || '0'}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '14px',
          }}>
            <Users size={16} />
            <span>{prediction.teamExperience?.toFixed(1) || '0'} years</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '14px',
          }}>
            <BarChart3 size={16} />
            <span>{prediction.traction?.toLocaleString() || '0'} traction</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '14px',
          }}>
            <Calendar size={16} />
            <span>{new Date(prediction.timestamp).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Category & Action */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            background: isDark ? 'rgba(55, 65, 81, 0.8)' : 'rgba(229, 231, 235, 0.8)',
            color: isDark ? '#d1d5db' : '#374151',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
          }}>
            {prediction.category}
          </span>

          <button style={{
            background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails && onViewDetails(prediction)
          }}>
            <Eye size={14} />
            View Details
          </button>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Failed to Load Predictions
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.message || 'An error occurred while fetching predictions'}
        </p>
        <button onClick={refetch} className="btn-primary">
          <RefreshCw size={16} className="mr-2" />
          Try Again
        </button>
      </div>
    )
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  }

  const filterCardStyle = {
    background: isDark
      ? 'rgba(29, 28, 36, 0.8)'
      : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    border: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '32px',
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(209, 213, 219, 0.5)'}`,
    borderRadius: '8px',
    background: isDark ? 'rgba(17, 24, 39, 0.5)' : 'rgba(255, 255, 255, 0.8)',
    color: isDark ? '#f9fafb' : '#1f2937',
    fontSize: '14px',
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: isDark ? '#d1d5db' : '#374151',
    fontSize: '14px',
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '40px' }}
      >
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
        }}>
          Community Predictions
        </h2>
        <p style={{
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: '16px',
          lineHeight: '1.6',
        }}>
          Explore AI-powered fundraising predictions from the Web3 community
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={filterCardStyle}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}>
          {/* Search */}
          <div>
            <label style={labelStyle}>Search Projects</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isDark ? '#9ca3af' : '#6b7280',
              }} />
              <input
                type="text"
                placeholder="Search by ID or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Score Threshold */}
          <div>
            <label style={labelStyle}>
              Minimum Success Rate: {scoreThreshold}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                background: isDark ? '#374151' : '#e5e7eb',
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Sort */}
          <div>
            <label style={labelStyle}>Sort By</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              style={inputStyle}
            >
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
              <option value="timestamp-desc">Most Recent</option>
              <option value="timestamp-asc">Oldest</option>
              <option value="funding-desc">Highest Funding</option>
              <option value="funding-asc">Lowest Funding</option>
            </select>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '20px',
          borderTop: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
        }}>
          <div style={{
            fontSize: '14px',
            color: isDark ? '#9ca3af' : '#6b7280',
          }}>
            Showing {filteredPredictions.length} of {predictions.length} predictions
          </div>
          <button
            onClick={refetch}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(209, 213, 219, 0.5)'}`,
              color: isDark ? '#d1d5db' : '#374151',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} style={{
              animation: isLoading ? 'spin 1s linear infinite' : 'none',
            }} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(202, 78, 121, 0.2)',
            borderTop: '4px solid #CA4E79',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
            Loading predictions...
          </p>
        </div>
      )}

      {/* Predictions Grid */}
      {!isLoading && filteredPredictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredPredictions.map((prediction, index) => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
              index={index}
            />
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPredictions.length === 0 && predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '60px 20px' }}
        >
          <Filter size={48} style={{
            color: isDark ? '#6b7280' : '#9ca3af',
            margin: '0 auto 16px',
          }} />
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: isDark ? '#f9fafb' : '#1f2937',
            marginBottom: '8px',
          }}>
            No Predictions Found
          </h3>
          <p style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
            Try adjusting your filters or search terms
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default StartupsList
