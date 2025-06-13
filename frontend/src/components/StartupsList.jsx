import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from 'react-query'
import { FixedSizeList as List } from 'react-window'
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Calendar,
  Users,
  DollarSign,
  BarChart3,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

// Mock API function - replace with actual API call
const fetchTopPredictions = async () => {
  // In tests, this will be mocked
  if (typeof window !== 'undefined' && window.__TESTING__) {
    return window.__MOCK_PREDICTIONS__ || []
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Mock data - replace with actual API call
  return Array.from({ length: 50 }, (_, index) => ({
    id: `project-${index + 1}`,
    projectId: `startup-${String(index + 1).padStart(3, '0')}`,
    title: `Startup ${index + 1}`,
    score: Math.random(),
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    teamExperience: 2 + Math.random() * 13,
    previousFunding: Math.random() * 10000000,
    traction: Math.floor(Math.random() * 25000),
    category: ['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'Social'][Math.floor(Math.random() * 5)],
    walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
  }))
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
  } = useQuery(
    'topPredictions',
    fetchTopPredictions,
    {
      refetchInterval: 60000, // Refetch every minute
      staleTime: 30000, // Consider data stale after 30 seconds
    }
  )

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

  // Row renderer for virtualized list
  const Row = ({ index, style }) => {
    const prediction = filteredPredictions[index]
    const successProbability = Math.round(prediction.score * 100)
    const isPositive = successProbability >= 50

    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="px-4 py-2"
      >
        <div className="card p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
             onClick={() => onViewDetails && onViewDetails(prediction)}>
          
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {prediction.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {prediction.projectId}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {successProbability}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Success Rate
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2 mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${successProbability}%` }}
                transition={{ duration: 1, delay: index * 0.05 + 0.3 }}
                className={`h-2 rounded-full ${
                  isPositive 
                    ? 'bg-gradient-to-r from-green-400 to-green-600' 
                    : 'bg-gradient-to-r from-red-400 to-red-600'
                }`}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>${prediction.previousFunding.toLocaleString()}</span>
              <span>{prediction.category}</span>
              <button className="btn-ghost text-xs px-2 py-1">
                <Eye size={14} className="mr-1" />
                View
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:grid grid-cols-4 gap-4 items-center">
            {/* Project Info */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {prediction.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {prediction.projectId}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded">
                  {prediction.category}
                </span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                  <span className={`font-medium ${
                    isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {successProbability}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${successProbability}%` }}
                    transition={{ duration: 1, delay: index * 0.05 + 0.3 }}
                    className={`h-2 rounded-full ${
                      isPositive 
                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                        : 'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                  />
                </div>
              </div>
              <div className={`p-2 rounded-full ${
                isPositive 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}>
                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <DollarSign size={14} />
                <span>${prediction.previousFunding.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Users size={14} />
                <span>{prediction.teamExperience.toFixed(1)} years</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <BarChart3 size={14} />
                <span>{prediction.traction.toLocaleString()} traction</span>
              </div>
            </div>

            {/* Actions */}
            <div className="text-right">
              <button 
                className="btn-primary text-sm px-4 py-2 flex items-center space-x-2 ml-auto"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails && onViewDetails(prediction)
                }}
              >
                <Eye size={14} />
                <span>View Details</span>
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(prediction.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold gradient-text mb-2">
          Startup Predictions
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Explore AI-powered fundraising predictions from the community
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Projects
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Score Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Success Rate: {scoreThreshold}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="input-field"
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

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredPredictions.length} of {predictions.length} predictions
          </div>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="btn-ghost text-sm flex items-center space-x-2"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="spinner w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading predictions...</p>
        </div>
      )}

      {/* Predictions List */}
      {!isLoading && filteredPredictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card overflow-hidden"
        >
          <List
            height={600}
            itemCount={filteredPredictions.length}
            itemSize={120} // Adjust based on row height
            className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-dark-600"
          >
            {Row}
          </List>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPredictions.length === 0 && predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <Filter size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Predictions Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or search terms
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default StartupsList
