import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from 'react-query'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Share2, 
  Loader2,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Zap,
  Shield,
  ExternalLink
} from 'lucide-react'
import { blockchainService, FEATURE_NAMES } from '../services/api'

const PredictionCard = ({ data, onBack, walletAddress }) => {
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState(null)

  // Extract prediction data
  const { score, explanations, formData } = data
  const successProbability = Math.round(score * 100)
  const isPositive = successProbability >= 50

  // Blockchain publish mutation
  const publishMutation = useMutation(
    async () => {
      const publishData = {
        project_id: `${walletAddress}-${Date.now()}`,
        score: score,
        proof: `0x${Buffer.from(JSON.stringify({
          timestamp: Date.now(),
          wallet: walletAddress,
          score: score,
          features: explanations
        })).toString('hex')}`,
        metadata: {
          wallet_address: walletAddress,
          pitch_title: formData.pitchTitle,
          timestamp: new Date().toISOString(),
          confidence: Math.max(...Object.values(explanations || {})),
        }
      }
      
      return await blockchainService.publish(publishData)
    },
    {
      onSuccess: (result) => {
        console.log('Blockchain publish successful:', result)
        setPublishResult({ success: true, data: result })
      },
      onError: (error) => {
        console.error('Blockchain publish failed:', error)
        setPublishResult({ success: false, error: error.message })
      },
    }
  )

  const handlePublishToBlockchain = async () => {
    setIsPublishing(true)
    try {
      await publishMutation.mutateAsync()
    } catch (error) {
      console.error('Publish error:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  // Get top 3 feature explanations
  const topFeatures = explanations 
    ? Object.entries(explanations)
        .map(([feature, importance], index) => ({
          name: FEATURE_NAMES[index] || feature,
          importance: Math.abs(importance),
          positive: importance > 0,
        }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 3)
    : []

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="btn-ghost flex items-center space-x-2"
        >
          <ArrowLeft size={20} />
          <span>Back to Form</span>
        </button>
        
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Prediction for</p>
          <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>
      </motion.div>

      {/* Main Prediction Card */}
      <motion.div
        variants={itemVariants}
        className="card p-6 sm:p-8 mb-6 w-full sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          {/* Circular Gauge */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="relative w-48 h-48 mx-auto mb-6"
          >
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-dark-700"
              />

              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={isPositive ? 'text-green-500' : 'text-red-500'}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: successProbability / 100 }}
                transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                style={{
                  pathLength: 0,
                  strokeDasharray: "251.2 251.2", // 2 * π * 40
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                className={`mb-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
              >
                {isPositive ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {successProbability}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Success Rate
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
          >
            Fundraising Prediction
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className={`text-lg font-medium ${
              isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? 'High Funding Potential' : 'Needs Improvement'}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="text-gray-600 dark:text-gray-400 mt-2"
          >
            Based on federated learning analysis of 54K+ fundraising data points
          </motion.p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Success Probability</span>
            <span>{successProbability}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${successProbability}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-3 rounded-full ${
                isPositive 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}
            />
          </div>
        </div>

        {/* Feature Explanations */}
        {topFeatures.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <BarChart3 size={20} />
              <span>Top Contributing Factors</span>
            </h3>
            
            <div className="space-y-3">
              {topFeatures.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: -30, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    delay: 1.8 + index * 0.15,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="group hover:scale-105 transition-transform duration-200"
                >
                  <div className="flex items-center p-4 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Bullet point with animation */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 2 + index * 0.15, type: "spring", stiffness: 200 }}
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          feature.positive
                            ? 'bg-green-500 shadow-lg shadow-green-500/30'
                            : 'bg-red-500 shadow-lg shadow-red-500/30'
                        }`}
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </motion.div>

                      <div className="flex-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {feature.name}
                        </span>
                        <div className="mt-1 w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${feature.importance * 100}%` }}
                            transition={{ delay: 2.2 + index * 0.15, duration: 0.8 }}
                            className={`h-2 rounded-full ${
                              feature.positive
                                ? 'bg-gradient-to-r from-green-400 to-green-600'
                                : 'bg-gradient-to-r from-red-400 to-red-600'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-lg font-bold ${
                          feature.positive
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {feature.positive ? '+' : '-'}{(feature.importance * 100).toFixed(1)}%
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Impact
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Project Info */}
        <div className="border-t border-gray-200 dark:border-dark-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Project Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Title:</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {formData.pitchTitle}
              </p>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">Team Experience:</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {formData.teamExperience} years
              </p>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">Traction:</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {formData.traction.toLocaleString()} users/stars
              </p>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">Previous Funding:</span>
              <p className="font-medium text-gray-900 dark:text-white">
                ${formData.previousFunding.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Blockchain Publishing */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield size={24} className="text-primary-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Publish to Blockchain
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Store your prediction immutably on Sepolia testnet
              </p>
            </div>
          </div>
          
          {!publishResult ? (
            <motion.button
              onClick={handlePublishToBlockchain}
              disabled={isPublishing || publishMutation.isLoading}
              className="relative overflow-hidden px-6 py-3 rounded-full font-medium text-white transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              style={{
                background: isPublishing || publishMutation.isLoading
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #CA4E79 0%, #DD6A8D 100%)'
              }}
              whileHover={{
                background: 'linear-gradient(135deg, #DD6A8D 0%, #E879A6 100%)',
                boxShadow: '0 10px 25px rgba(202, 78, 121, 0.3)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="flex items-center space-x-2"
                animate={isPublishing || publishMutation.isLoading ? { x: [0, -100, 100, 0] } : {}}
                transition={{ duration: 1, repeat: isPublishing || publishMutation.isLoading ? Infinity : 0 }}
              >
                {isPublishing || publishMutation.isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    <span>Publish On-chain</span>
                  </>
                )}
              </motion.div>

              {/* Shimmer effect */}
              {!isPublishing && !publishMutation.isLoading && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              )}
            </motion.button>
          ) : publishResult.success ? (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex items-center space-x-3"
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full"
              >
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </motion.div>

              <div>
                <span className="font-medium text-green-600 dark:text-green-400">
                  Published Successfully!
                </span>
                {publishResult.data?.transaction_hash && (
                  <div className="mt-1">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${publishResult.data.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <span>View on Etherscan</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
              <span className="font-medium">Failed</span>
            </div>
          )}
        </div>
        
        {publishResult?.error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-300">
              {publishResult.error}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default PredictionCard
