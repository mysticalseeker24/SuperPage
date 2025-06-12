import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun, Wallet, AlertCircle, CheckCircle } from 'lucide-react'
import { useWallet } from './hooks/useWallet'
import WalletConnect from './components/WalletConnect'
import PitchForm from './components/PitchForm'
import PredictionCard from './components/PredictionCard'
import ServiceStatus from './components/ServiceStatus'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })
  
  const [currentView, setCurrentView] = useState('form') // 'form' | 'prediction'
  const [predictionData, setPredictionData] = useState(null)
  
  const { 
    account, 
    isConnecting, 
    error: walletError, 
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

      {/* Main Content */}
      <main className="flex-1 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {currentView === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
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
                <PredictionCard 
                  data={predictionData}
                  onBack={handleBackToForm}
                  walletAddress={account}
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
