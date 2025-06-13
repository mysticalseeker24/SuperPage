import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, Wallet, Home, Info, BarChart3, Zap } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import ServiceStatus from './ServiceStatus'

// Layout styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    transition: 'all 0.3s ease',
  },
  containerDark: {
    background: 'linear-gradient(135deg, #0F0E13 0%, #1a1a1a 100%)',
    color: '#e5e5e5',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
    padding: '16px 24px',
  },
  headerDark: {
    background: 'rgba(15, 14, 19, 0.8)',
    borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
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
    textDecoration: 'none',
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
    alignItems: 'center',
    gap: '8px',
    '@media (min-width: 768px)': {
      display: 'flex',
    },
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '500',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  navLinkActive: {
    background: '#CA4E79',
    color: 'white',
    boxShadow: '0 4px 12px rgba(202, 78, 121, 0.3)',
  },
  navLinkInactive: {
    background: 'transparent',
    color: '#6b7280',
  },
  navLinkInactiveDark: {
    color: '#9ca3af',
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
    fontSize: '14px',
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
    padding: '24px',
    maxWidth: '1280px',
    margin: '0 auto',
    width: '100%',
  },
  mobileNav: {
    display: 'block',
    padding: '16px 24px',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
    '@media (min-width: 768px)': {
      display: 'none',
    },
  },
  mobileNavDark: {
    background: 'rgba(15, 14, 19, 0.8)',
    borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
  },
  mobileNavContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  serviceStatus: {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    zIndex: 40,
  },
}

// Navigation items
const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/predict', label: 'Predict', icon: Zap },
  { path: '/explore', label: 'Explore', icon: BarChart3 },
  { path: '/about', label: 'About', icon: Info },
]

const Layout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })

  const location = useLocation()
  const { account, isConnecting, connectWallet, isMetaMaskInstalled } = useWallet()

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
      document.body.style.background = '#0F0E13'
      document.body.style.color = '#e5e5e5'
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      document.body.style.background = '#ffffff'
      document.body.style.color = '#1a1a1a'
    }
  }, [darkMode])

  // Check if current path is active
  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  // Navigation link component
  const NavLink = ({ item, isMobile = false }) => {
    const IconComponent = item.icon
    const isActive = isActiveRoute(item.path)

    return (
      <Link
        to={item.path}
        style={{
          ...styles.navLink,
          ...(isActive ? styles.navLinkActive : {
            ...styles.navLinkInactive,
            ...(darkMode ? styles.navLinkInactiveDark : {}),
          }),
          ...(isMobile ? { flex: 1, justifyContent: 'center' } : {}),
        }}
      >
        <IconComponent size={isMobile ? 14 : 16} />
        {item.label}
      </Link>
    )
  }

  return (
    <div style={{
      ...styles.container,
      ...(darkMode ? styles.containerDark : {})
    }}>
      {/* Header */}
      <header style={{
        ...styles.header,
        ...(darkMode ? styles.headerDark : {})
      }}>
        <div style={styles.headerContent}>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" style={styles.logo}>
              <div style={styles.logoIcon}>
                <span>SP</span>
              </div>
              <h1 style={styles.logoText}>SuperPage</h1>
            </Link>
          </motion.div>

          <div style={styles.nav}>
            {/* Desktop Navigation */}
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                ...styles.navDesktop,
                display: window.innerWidth >= 768 ? 'flex' : 'none',
              }}
            >
              {navItems.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
            </motion.nav>

            {/* Wallet Info */}
            {account && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{
                  ...styles.walletInfo,
                  ...(darkMode ? styles.walletInfoDark : {}),
                }}
              >
                <Wallet size={16} style={{ color: '#CA4E79' }} />
                <span style={{
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
            )}

            {/* Connect Wallet Button */}
            {!account && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onClick={connectWallet}
                disabled={isConnecting || !isMetaMaskInstalled}
                style={{
                  ...styles.navLink,
                  ...styles.navLinkActive,
                  opacity: isConnecting ? 0.7 : 1,
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                }}
              >
                <Wallet size={16} />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </motion.button>
            )}

            {/* Dark Mode Toggle */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
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
        ...styles.mobileNav,
        ...(darkMode ? styles.mobileNavDark : {}),
        display: window.innerWidth < 768 ? 'block' : 'none',
      }}>
        <div style={styles.mobileNavContainer}>
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} isMobile />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Service Status */}
      <div style={styles.serviceStatus}>
        <ServiceStatus />
      </div>
    </div>
  )
}

export default Layout
