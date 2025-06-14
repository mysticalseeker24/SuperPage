import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Send, Loader2, AlertCircle } from 'lucide-react'
import { predictionService, convertPitchToFeatures } from '../services/api'

const PitchForm = ({ onPredictionSuccess, walletAddress }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      pitchTitle: '',
      pitchDescription: '',
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
    predictionMutation.mutate(data)
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '8px',
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#374151',
  }

  const errorStyle = {
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
      }}>
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
          Get AI-powered insights into your startup's fundraising potential.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Pitch Title *</label>
          <input
            {...register('pitchTitle', { 
              required: 'Pitch title is required',
              minLength: { value: 5, message: 'Title must be at least 5 characters' },
            })}
            type="text"
            placeholder="Enter your startup's pitch title..."
            style={inputStyle}
          />
          {errors.pitchTitle && (
            <div style={errorStyle}>
              <AlertCircle size={14} />
              <span>{errors.pitchTitle.message}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Pitch Description *</label>
          <textarea
            {...register('pitchDescription', { 
              required: 'Pitch description is required',
              minLength: { value: 50, message: 'Description must be at least 50 characters' },
            })}
            rows={4}
            placeholder="Describe your startup, the problem you're solving, and your solution..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          {errors.pitchDescription && (
            <div style={errorStyle}>
              <AlertCircle size={14} />
              <span>{errors.pitchDescription.message}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Team Experience (Years): {watchedValues.teamExperience}</label>
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
            style={{ ...inputStyle, marginBottom: '0' }}
          />
          {errors.teamExperience && (
            <div style={errorStyle}>
              <AlertCircle size={14} />
              <span>{errors.teamExperience.message}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Traction (Users/Stars/Downloads)</label>
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
            style={inputStyle}
          />
          {errors.traction && (
            <div style={errorStyle}>
              <AlertCircle size={14} />
              <span>{errors.traction.message}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Community Engagement: {watchedValues.communityEngagement}</label>
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
            style={{ ...inputStyle, marginBottom: '0' }}
          />
          {errors.communityEngagement && (
            <div style={errorStyle}>
              <AlertCircle size={14} />
              <span>{errors.communityEngagement.message}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Previous Funding (USD)</label>
          <input
            {...register('previousFunding', { 
              required: 'Previous funding is required',
              min: { value: 0, message: 'Minimum 0' },
              max: { value: 100000000, message: 'Maximum $100M' },
            })}
            type="number"
            min="0"
            max="100000000"
            placeholder="0"
            style={inputStyle}
          />
          {errors.previousFunding && (
            <div style={errorStyle}>
              <AlertCircle size={14} />
              <span>{errors.previousFunding.message}</span>
            </div>
          )}
        </div>

        {predictionMutation.error && (
          <div style={{
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#dc2626',
              fontWeight: '500',
            }}>
              <AlertCircle size={16} />
              <span>Prediction Failed</span>
            </div>
            <p style={{
              fontSize: '14px',
              color: '#dc2626',
              marginTop: '4px',
            }}>
              {predictionMutation.error.message}
            </p>
          </div>
        )}

        <motion.button
          type="submit"
          disabled={predictionMutation.isLoading}
          style={{
            width: '100%',
            padding: '12px 24px',
            background: predictionMutation.isLoading ? '#9ca3af' : '#CA4E79',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: predictionMutation.isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          whileHover={{ scale: predictionMutation.isLoading ? 1 : 1.02 }}
          whileTap={{ scale: predictionMutation.isLoading ? 1 : 0.98 }}
        >
          {predictionMutation.isLoading ? (
            <>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Get Prediction</span>
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}

export default PitchForm
