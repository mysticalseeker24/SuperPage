import React from 'react'
import { motion } from 'framer-motion'
import { Wallet, Download, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'

const WalletConnect = () => {
  const { 
    isConnecting, 
    error, 
    connectWallet, 
    isMetaMaskInstalled 
  } = useWallet()

  const handleConnect = async () => {
    if (!isMetaMaskInstalled) {
      window.open('https://metamask.io/download/', '_blank')
      return
    }
    await connectWallet()
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card p-8 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <Wallet size={32} className="text-white" />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
        >
          Connect Your Wallet
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 dark:text-gray-400 mb-8"
        >
          Connect your MetaMask wallet to start predicting fundraising success with AI-powered insights.
        </motion.p>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">Connection Failed</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {error}
            </p>
          </motion.div>
        )}

        {/* Connect Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleConnect}
          disabled={isConnecting}
          className="btn-primary w-full mb-4 flex items-center justify-center space-x-2"
        >
          {isConnecting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Connecting...</span>
            </>
          ) : !isMetaMaskInstalled ? (
            <>
              <Download size={20} />
              <span>Install MetaMask</span>
            </>
          ) : (
            <>
              <Wallet size={20} />
              <span>Connect MetaMask</span>
            </>
          )}
        </motion.button>

        {/* MetaMask Info */}
        {!isMetaMaskInstalled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  MetaMask Required
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  MetaMask is a secure wallet that lets you interact with blockchain applications.
                </p>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <span>Download MetaMask</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 space-y-3"
        >
          <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Secure blockchain integration</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Privacy-first federated learning</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Real-time AI predictions</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Network Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 text-center"
      >
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This app works on Sepolia testnet. You'll be prompted to switch networks after connecting.
        </p>
      </motion.div>
    </div>
  )
}

export default WalletConnect
