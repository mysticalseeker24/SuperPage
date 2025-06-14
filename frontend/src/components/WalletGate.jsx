import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  Shield, 
  AlertTriangle, 
  Download, 
  RefreshCw,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { useWallet } from '../hooks/useWallet'

const WalletGate = ({ children }) => {
  const { 
    account, 
    isConnecting, 
    connectWallet, 
    isMetaMaskInstalled,
    error: walletError 
  } = useWallet()
  
  const [isChecking, setIsChecking] = useState(true)
  const [connectionAttempted, setConnectionAttempted] = useState(false)

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            // Auto-connect if previously connected
            await connectWallet()
          }
        } catch (error) {
          console.log('No existing connection found')
        }
      }
      setIsChecking(false)
    }

    checkExistingConnection()
  }, [connectWallet])

  const handleConnectWallet = async () => {
    setConnectionAttempted(true)
    await connectWallet()
  }

  const handleInstallMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank')
  }

  // If wallet is connected, render the app
  if (account) {
    return children
  }

  // Loading state
  if (isChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F0E13 0%, #1a1a1a 100%)',
        color: '#e5e5e5',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '40px',
          }}
        >
          <RefreshCw 
            size={48} 
            style={{ 
              color: '#CA4E79',
              animation: 'spin 2s linear infinite',
              marginBottom: '20px'
            }} 
          />
          <p style={{ fontSize: '18px', color: '#9ca3af' }}>
            Checking wallet connection...
          </p>
        </motion.div>
      </div>
    )
  }

  // Wallet gate UI
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F0E13 0%, #1a1a1a 100%)',
      color: '#e5e5e5',
      padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px',
            boxShadow: '0 10px 30px rgba(202, 78, 121, 0.3)',
          }}
        >
          <span style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
          }}>
            SP
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Welcome to SuperPage
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: '18px',
            color: '#9ca3af',
            marginBottom: '40px',
            lineHeight: '1.6',
          }}
        >
          Connect your MetaMask wallet to access AI-powered Web3 fundraising predictions
        </motion.p>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            marginBottom: '30px',
          }}
        >
          <Shield size={20} style={{ color: '#10b981' }} />
          <span style={{
            fontSize: '14px',
            color: '#10b981',
            fontWeight: '500',
          }}>
            Secure Web3 Authentication Required
          </span>
        </motion.div>

        {/* Connection Status */}
        <AnimatePresence mode="wait">
          {!isMetaMaskInstalled ? (
            // MetaMask not installed
            <motion.div
              key="install"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ marginBottom: '30px' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '16px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                marginBottom: '20px',
              }}>
                <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                <span style={{
                  fontSize: '14px',
                  color: '#f59e0b',
                  fontWeight: '500',
                }}>
                  MetaMask Extension Required
                </span>
              </div>

              <motion.button
                onClick={handleInstallMetaMask}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download size={20} />
                Install MetaMask
                <ExternalLink size={16} />
              </motion.button>
            </motion.div>
          ) : (
            // MetaMask installed - show connect button
            <motion.div
              key="connect"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ marginBottom: '30px' }}
            >
              {walletError && connectionAttempted && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                }}>
                  <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                  <span style={{
                    fontSize: '14px',
                    color: '#ef4444',
                    fontWeight: '500',
                  }}>
                    {walletError}
                  </span>
                </div>
              )}

              <motion.button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: isConnecting 
                    ? 'rgba(202, 78, 121, 0.5)' 
                    : 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: isConnecting 
                    ? 'none' 
                    : '0 4px 20px rgba(202, 78, 121, 0.3)',
                }}
                whileHover={{ scale: isConnecting ? 1 : 1.02 }}
                whileTap={{ scale: isConnecting ? 1 : 0.98 }}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet size={20} />
                    Connect MetaMask Wallet
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            marginTop: '30px',
          }}
        >
          {[
            { icon: Shield, text: 'Secure' },
            { icon: CheckCircle, text: 'Verified' },
            { icon: Wallet, text: 'Web3 Ready' },
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <feature.icon size={24} style={{ color: '#CA4E79' }} />
              <span style={{
                fontSize: '12px',
                color: '#9ca3af',
                fontWeight: '500',
              }}>
                {feature.text}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default WalletGate
