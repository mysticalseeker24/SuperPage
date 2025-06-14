import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Send, Loader2, AlertCircle } from 'lucide-react'
import { predictionService, convertPitchToFeatures } from '../services/api'

const PitchForm = ({ onPredictionSuccess, walletAddress }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      pitchTitle: '',
      pitchDescription: '',
      tokenomicsUrl: '',
      teamExperience: 5,
      traction: 1000,
      communityEngagement: 0.1,
      previousFunding: 0,
    },
  })

  const watchedValues = watch()

  const predictionMutation = useMutation({
    mutationFn: async (formData) => {
      const features = convertPitchToFeatures(formData)
      return await predictionService.predict(features)
    },
    onSuccess: (data) => {
      onPredictionSuccess({
        ...data,
        formData: watchedValues,
        walletAddress,
      })
    },
    onError: (error) => {
      console.error('Prediction failed:', error)
    },
  })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      await predictionMutation.mutateAsync(data)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formVariants = {
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

  const fieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      {/* Header */}
      <motion.div
        variants={fieldVariants}
        style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        <h2 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '16px',
        }}>
          Predict Your Fundraising Success
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '18px',
          lineHeight: '1.6',
        }}>
          Get AI-powered insights into your startup's fundraising potential using our federated learning model.
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        variants={fieldVariants}
        onSubmit={handleSubmit(onSubmit)}
        className="card p-8 space-y-6"
      >
        {/* Pitch Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pitch Title *
          </label>
          <input
            {...register('pitchTitle', { 
              required: 'Pitch title is required',
              minLength: { value: 5, message: 'Title must be at least 5 characters' },
            })}
            type="text"
            placeholder="Enter your startup's pitch title..."
            className="input-field"
          />
          {errors.pitchTitle && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
              <AlertCircle size={14} />
              <span>{errors.pitchTitle.message}</span>
            </p>
          )}
        </div>

        {/* Pitch Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pitch Description *
          </label>
          <textarea
            {...register('pitchDescription', { 
              required: 'Pitch description is required',
              minLength: { value: 50, message: 'Description must be at least 50 characters' },
            })}
            rows={4}
            placeholder="Describe your startup, the problem you're solving, and your solution..."
            className="input-field resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            {errors.pitchDescription ? (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                <AlertCircle size={14} />
                <span>{errors.pitchDescription.message}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {watchedValues.pitchDescription?.length || 0} characters
              </p>
            )}
          </div>
        </div>

        {/* Team Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Users size={16} className="inline mr-2" />
            Team Experience (Years)
          </label>
          <div className="space-y-2">
            <input
              {...register('teamExperience', { 
                required: 'Team experience is required',
                min: { value: 0.5, message: 'Minimum 0.5 years' },
                max: { value: 15, message: 'Maximum 15 years' },
              })}
              type="range"
              min="0.5"
              max="15"
              step="0.5"
              className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>0.5 years</span>
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {watchedValues.teamExperience} years
              </span>
              <span>15 years</span>
            </div>
          </div>
          {errors.teamExperience && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
              <AlertCircle size={14} />
              <span>{errors.teamExperience.message}</span>
            </p>
          )}
        </div>

        {/* Tokenomics URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <LinkIcon size={16} className="inline mr-2" />
            Tokenomics Documentation URL
          </label>
          <input
            {...register('tokenomicsUrl', {
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Please enter a valid URL starting with http:// or https://',
              },
            })}
            type="url"
            placeholder="https://docs.yourproject.com/tokenomics"
            className="input-field"
          />
          {errors.tokenomicsUrl && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
              <AlertCircle size={14} />
              <span>{errors.tokenomicsUrl.message}</span>
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
            <Info size={14} />
            <span>Optional: Link to your tokenomics documentation</span>
          </p>
        </div>

        {/* Traction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <TrendingUp size={16} className="inline mr-2" />
            Current Traction (Users/Stars/Downloads)
          </label>
          <input
            {...register('traction', { 
              required: 'Traction is required',
              min: { value: 1, message: 'Minimum 1' },
              max: { value: 25000, message: 'Maximum 25,000' },
            })}
            type="number"
            min="1"
            max="25000"
            placeholder="1000"
            className="input-field"
          />
          {errors.traction && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
              <AlertCircle size={14} />
              <span>{errors.traction.message}</span>
            </p>
          )}
        </div>

        {/* Community Engagement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Community Engagement Score
          </label>
          <div className="space-y-2">
            <input
              {...register('communityEngagement', { 
                required: 'Community engagement is required',
                min: { value: 0, message: 'Minimum 0' },
                max: { value: 0.5, message: 'Maximum 0.5' },
              })}
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>0 (Low)</span>
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {watchedValues.communityEngagement}
              </span>
              <span>0.5 (High)</span>
            </div>
          </div>
          {errors.communityEngagement && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
              <AlertCircle size={14} />
              <span>{errors.communityEngagement.message}</span>
            </p>
          )}
        </div>

        {/* Previous Funding */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <DollarSign size={16} className="inline mr-2" />
            Previous Funding (USD)
          </label>
          <input
            {...register('previousFunding', { 
              required: 'Previous funding is required',
              min: { value: 0, message: 'Minimum $0' },
              max: { value: 100000000, message: 'Maximum $100M' },
            })}
            type="number"
            min="0"
            max="100000000"
            placeholder="0"
            className="input-field"
          />
          {errors.previousFunding && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
              <AlertCircle size={14} />
              <span>{errors.previousFunding.message}</span>
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter 0 if this is your first funding round
          </p>
        </div>

        {/* Error Display */}
        {predictionMutation.error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
              <AlertCircle size={16} />
              <span className="font-medium">Prediction Failed</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {predictionMutation.error.message}
            </p>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting || predictionMutation.isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitting || predictionMutation.isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Get AI Prediction</span>
            </>
          )}
        </motion.button>
      </motion.form>
    </motion.div>
  )
}

export default PitchForm
