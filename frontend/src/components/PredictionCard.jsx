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
      className="max-w-4xl mx-auto"
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
      <motion.div variants={itemVariants} className="card p-8 mb-6">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isPositive 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp size={40} /> : <TrendingDown size={40} />}
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {successProbability}% Success Probability
          </h2>
          
          <p className={`text-lg font-medium ${
            isPositive 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {isPositive ? 'High Funding Potential' : 'Needs Improvement'}
          </p>
          
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Based on federated learning analysis of 54K+ fundraising data points
          </p>
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
            
            <div className="space-y-4">
              {topFeatures.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      feature.positive ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {feature.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      feature.positive 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {feature.positive ? '+' : '-'}{(feature.importance * 100).toFixed(1)}%
                    </span>
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
            <button
              onClick={handlePublishToBlockchain}
              disabled={isPublishing || publishMutation.isLoading}
              className="btn-primary flex items-center space-x-2"
            >
              {isPublishing || publishMutation.isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Share2 size={16} />
                  <span>Publish</span>
                </>
              )}
            </button>
          ) : publishResult.success ? (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle size={20} />
              <span className="font-medium">Published!</span>
              {publishResult.data?.transaction_hash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${publishResult.data.transaction_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost p-1"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
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
