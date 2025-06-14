import { useState, useEffect, useCallback } from 'react'
import { apiClients } from '../api/clients'
import { ethers } from 'ethers'

export const useWallet = () => {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        setIsMetaMaskInstalled(true)
        return true
      }
      setIsMetaMaskInstalled(false)
      return false
    }

    checkMetaMask()

    // Listen for MetaMask installation
    const handleEthereum = () => {
      checkMetaMask()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', handleEthereum, {
        once: true,
      })

      // If MetaMask is not detected, check again after a delay
      if (!window.ethereum) {
        setTimeout(checkMetaMask, 1000)
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('ethereum#initialized', handleEthereum)
      }
    }
  }, [])

  // Connect to wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Use API client to connect wallet
      const address = await apiClients.connectWallet()

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      const web3Signer = await web3Provider.getSigner()
      const network = await web3Provider.getNetwork()

      setProvider(web3Provider)
      setSigner(web3Signer)
      setAccount(address)
      setChainId(network.chainId.toString())

      // Set wallet address in API client
      apiClients.setWalletAddress(address)

      console.log('Wallet connected:', {
        account: address,
        chainId: network.chainId.toString(),
        network: network.name,
      })

    } catch (err) {
      console.error('Failed to connect wallet:', err)
      setError(err.message || 'Failed to connect wallet')
      localStorage.removeItem('walletConnected')
    } finally {
      setIsConnecting(false)
    }
  }, [isMetaMaskInstalled])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setChainId(null)
    setError(null)
    apiClients.disconnectWallet()
  }, [])

  // Switch to Sepolia network
  const switchToSepolia = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      })
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Test Network',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'SEP',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ],
          })
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError)
          setError('Failed to add Sepolia network to MetaMask')
        }
      } else {
        console.error('Failed to switch to Sepolia network:', switchError)
        setError('Failed to switch to Sepolia network')
      }
    }
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // Force user back to wallet gate
        disconnectWallet()
        window.location.reload()
      } else if (accounts[0] !== account) {
        setAccount(accounts[0])
        localStorage.setItem('walletConnected', 'true')
        localStorage.setItem('walletAddress', accounts[0])
      }
    }

    const handleChainChanged = (chainId) => {
      setChainId(parseInt(chainId, 16).toString())
      // Reload the page to avoid stale state
      window.location.reload()
    }

    const handleDisconnect = () => {
      // Force user back to wallet gate
      disconnectWallet()
      window.location.reload()
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
    window.ethereum.on('disconnect', handleDisconnect)

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
        window.ethereum.removeListener('disconnect', handleDisconnect)
      }
    }
  }, [account, disconnectWallet])

  // Check if on correct network (Sepolia)
  const isCorrectNetwork = chainId === '11155111' // Sepolia chainId

  return {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    error,
    isMetaMaskInstalled,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
  }
}
