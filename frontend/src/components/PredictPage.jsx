import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import PitchForm from './PitchForm'
import PredictionCard from './PredictionCard'
import WalletConnect from './WalletConnect'

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '16px',
    background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: '1.6',
  },
  subtitleDark: {
    color: '#9ca3af',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'rgba(202, 78, 121, 0.1)',
    color: '#CA4E79',
    border: '2px solid rgba(202, 78, 121, 0.2)',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    marginBottom: '32px',
  },
  walletPrompt: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  walletPromptTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1f2937',
  },
  walletPromptTitleDark: {
    color: '#f9fafb',
  },
  walletPromptText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '32px',
  },
  walletPromptTextDark: {
    color: '#9ca3af',
  },
}

const PredictPage = () => {
  const [currentView, setCurrentView] = useState('form') // 'form' | 'prediction'
  const [predictionData, setPredictionData] = useState(null)
  const { account } = useWallet()
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  const handlePredictionSuccess = (data) => {
    setPredictionData(data)
    setCurrentView('prediction')
  }

  const handleBackToForm = () => {
    setCurrentView('form')
    setPredictionData(null)
  }

  // Show wallet connection prompt if not connected
  if (!account) {
    return (
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={styles.walletPrompt}
        >
          <h2 style={{
            ...styles.walletPromptTitle,
            ...(isDark ? styles.walletPromptTitleDark : {})
          }}>
            Connect Your Wallet to Continue
          </h2>
          <p style={{
            ...styles.walletPromptText,
            ...(isDark ? styles.walletPromptTextDark : {})
          }}>
            To use SuperPage's AI prediction engine, please connect your MetaMask wallet. 
            This ensures secure access and enables blockchain verification of your predictions.
          </p>
          <WalletConnect />
        </motion.div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <AnimatePresence mode="wait">
        {currentView === 'form' ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div style={styles.header}>
              <h1 style={styles.title}>
                AI Fundraising Prediction
              </h1>
              <p style={{
                ...styles.subtitle,
                ...(isDark ? styles.subtitleDark : {})
              }}>
                Get instant AI-powered insights into your Web3 project's fundraising potential. 
                Our advanced machine learning models analyze multiple factors to provide accurate predictions.
              </p>
            </div>

            <PitchForm
              onPredictionSuccess={handlePredictionSuccess}
              walletAddress={account}
            />
          </motion.div>
        ) : (
          <motion.div
            key="prediction"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={handleBackToForm}
              style={styles.backButton}
            >
              <ArrowLeft size={16} />
              Back to Form
            </button>

            <PredictionCard
              data={predictionData}
              onBack={handleBackToForm}
              walletAddress={account}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PredictPage
