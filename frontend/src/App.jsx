import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun, Wallet, BarChart3, Zap } from 'lucide-react'
import { useWallet } from './hooks/useWallet'
import WalletConnect from './components/WalletConnect'
import PitchForm from './components/PitchForm'
import PredictionCard from './components/PredictionCard'
import StartupsList from './components/StartupsList'
import ServiceStatus from './components/ServiceStatus'

// CSS-in-JS styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  containerDark: {
    background: 'linear-gradient(135deg, #0F0E13 0%, #1a1a1a 100%)',
    color: '#e5e5e5',
  },
  header: {
    position: 'relative',
    zIndex: 10,
    padding: '24px',
  },
  headerContent: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navDesktop: {
    display: 'none',
    '@media (min-width: 768px)': {
      display: 'flex',
    },
  },
  navButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navButtonActive: {
    background: '#CA4E79',
    color: 'white',
    boxShadow: '0 4px 12px rgba(202, 78, 121, 0.3)',
  },
  navButtonInactive: {
    background: 'transparent',
    color: '#6b7280',
  },
  walletInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    borderRadius: '8px',
    border: '1px solid rgba(229, 231, 235, 0.5)',
  },
  walletInfoDark: {
    background: 'rgba(29, 28, 36, 0.8)',
    border: '1px solid rgba(55, 65, 81, 0.5)',
  },
  darkModeButton: {
    padding: '8px',
    borderRadius: '8px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.2s ease',
  },
  main: {
    flex: 1,
    padding: '0 24px 80px',
  },
  mobileNav: {
    display: 'block',
    padding: '0 24px 24px',
    '@media (min-width: 768px)': {
      display: 'none',
    },
  },
  mobileNavContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    borderRadius: '8px',
    padding: '8px',
    border: '1px solid rgba(229, 231, 235, 0.5)',
  },
  serviceStatus: {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
  },
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })
  
  const [currentView, setCurrentView] = useState('form') // 'form' | 'prediction' | 'startups'
  const [predictionData, setPredictionData] = useState(null)
  
  const {
    account,
    isConnecting,
    connectWallet,
    isMetaMaskInstalled
  } = useWallet()

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
  }

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [darkMode])

  // Auto-connect wallet on load
  useEffect(() => {
    if (isMetaMaskInstalled && !account && !isConnecting) {
      // Check if previously connected
      const wasConnected = localStorage.getItem('walletConnected') === 'true'
      if (wasConnected) {
        connectWallet()
      }
    }
  }, [isMetaMaskInstalled, account, isConnecting, connectWallet])

  const handlePredictionSuccess = (data) => {
    setPredictionData(data)
    setCurrentView('prediction')
  }

  const handleBackToForm = () => {
    setCurrentView('form')
    setPredictionData(null)
  }

  const handleViewStartups = () => {
    setCurrentView('startups')
  }

  const handleViewDetails = (prediction) => {
    // Convert prediction data to match expected format
    setPredictionData({
      score: prediction.score,
      explanations: {
        0: Math.random() * 0.3,
        1: Math.random() * 0.3,
        2: Math.random() * 0.3,
      },
      formData: {
        pitchTitle: prediction.title,
        teamExperience: prediction.teamExperience,
        traction: prediction.traction,
        previousFunding: prediction.previousFunding,
      }
    })
    setCurrentView('prediction')
  }

  // Show wallet connection screen if not connected
  if (!account) {
    return (
      <div style={{
        ...styles.container,
        ...(darkMode ? styles.containerDark : {})
      }}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={styles.logo}
            >
              <div style={styles.logoIcon}>
                <span>SP</span>
              </div>
              <h1 style={styles.logoText}>SuperPage</h1>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={toggleDarkMode}
              style={styles.darkModeButton}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px 80px',
        }}>
          <WalletConnect />
        </main>

        {/* Service Status */}
        <div style={styles.serviceStatus}>
          <ServiceStatus />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      ...styles.container,
      ...(darkMode ? styles.containerDark : {})
    }}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={styles.logo}
          >
            <div style={styles.logoIcon}>
              <span>SP</span>
            </div>
            <h1 style={styles.logoText}>SuperPage</h1>
          </motion.div>

          <div style={styles.nav}>
            {/* Navigation */}
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '8px',
                '@media (min-width: 768px)': {
                  display: 'flex',
                },
              }}
            >
              <button
                onClick={() => setCurrentView('form')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'form' ? styles.navButtonActive : styles.navButtonInactive),
                }}
              >
                <Zap size={16} />
                Predict
              </button>

              <button
                onClick={handleViewStartups}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'startups' ? styles.navButtonActive : styles.navButtonInactive),
                }}
              >
                <BarChart3 size={16} />
                Explore
              </button>
            </motion.nav>

            {/* Wallet Info */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                ...styles.walletInfo,
                ...(darkMode ? styles.walletInfoDark : {}),
              }}
            >
              <Wallet size={16} style={{ color: '#CA4E79' }} />
              <span style={{
                fontSize: '14px',
                fontFamily: 'monospace',
                color: darkMode ? '#9ca3af' : '#6b7280',
              }}>
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 2s infinite',
              }} />
            </motion.div>

            {/* Dark Mode Toggle */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={toggleDarkMode}
              style={styles.darkModeButton}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div style={{
        display: 'block',
        padding: '0 24px 24px',
        '@media (min-width: 768px)': {
          display: 'none',
        },
      }}>
        <div style={{
          ...styles.mobileNavContainer,
          ...(darkMode ? styles.walletInfoDark : {}),
        }}>
          <button
            onClick={() => setCurrentView('form')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              ...(currentView === 'form' ? styles.navButtonActive : styles.navButtonInactive),
            }}
          >
            <Zap size={14} />
            Predict
          </button>

          <button
            onClick={handleViewStartups}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              ...(currentView === 'startups' ? styles.navButtonActive : styles.navButtonInactive),
            }}
          >
            <BarChart3 size={14} />
            Explore
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={{ width: '100%' }}>
          <AnimatePresence mode="wait">
            {currentView === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                style={{ maxWidth: '1024px', margin: '0 auto' }}
              >
                <PitchForm
                  onPredictionSuccess={handlePredictionSuccess}
                  walletAddress={account}
                />
              </motion.div>
            ) : currentView === 'prediction' ? (
              <motion.div
                key="prediction"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                <PredictionCard
                  data={predictionData}
                  onBack={handleBackToForm}
                  walletAddress={account}
                />
              </motion.div>
            ) : (
              <motion.div
                key="startups"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
              >
                <StartupsList
                  onViewDetails={handleViewDetails}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Service Status */}
      <div style={styles.serviceStatus}>
        <ServiceStatus />
      </div>
    </div>
  )
}

export default App
