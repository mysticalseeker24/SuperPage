import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun, Wallet, BarChart3, Zap } from 'lucide-react'
import { useWallet } from './hooks/useWallet'
import WalletConnect from './components/WalletConnect'
import PitchForm from './components/PitchForm'
import PredictionCard from './components/PredictionCard'
import StartupsList from './components/StartupsList'
import ServiceStatus from './components/ServiceStatus'

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

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900">
        {/* Header */}
        <header className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <h1 className="text-xl font-bold gradient-text">SuperPage</h1>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={toggleDarkMode}
              className="btn-ghost"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 pb-20">
          <WalletConnect />
        </main>

        {/* Service Status */}
        <div className="fixed bottom-6 left-6">
          <ServiceStatus />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900">
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SP</span>
            </div>
            <h1 className="text-xl font-bold gradient-text">SuperPage</h1>
          </motion.div>
          
          <div className="flex items-center space-x-4">
            {/* Navigation */}
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden md:flex items-center space-x-2"
            >
              <button
                onClick={() => setCurrentView('form')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentView === 'form'
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-800'
                }`}
              >
                <Zap size={16} className="inline mr-2" />
                Predict
              </button>

              <button
                onClick={handleViewStartups}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentView === 'startups'
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-800'
                }`}
              >
                <BarChart3 size={16} className="inline mr-2" />
                Explore
              </button>
            </motion.nav>

            {/* Wallet Info */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 px-3 py-2 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-dark-700"
            >
              <Wallet size={16} className="text-primary-500" />
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </motion.div>

            {/* Dark Mode Toggle */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={toggleDarkMode}
              className="btn-ghost"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden px-6 mb-6">
        <div className="flex items-center space-x-2 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-lg p-2 border border-gray-200 dark:border-dark-700">
          <button
            onClick={() => setCurrentView('form')}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
              currentView === 'form'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Zap size={14} className="inline mr-1" />
            Predict
          </button>

          <button
            onClick={handleViewStartups}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
              currentView === 'startups'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <BarChart3 size={14} className="inline mr-1" />
            Explore
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-20">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {currentView === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto"
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
      <div className="fixed bottom-6 left-6">
        <ServiceStatus />
      </div>
    </div>
  )
}

export default App
