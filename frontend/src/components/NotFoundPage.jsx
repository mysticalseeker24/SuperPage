import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    textAlign: 'center',
    padding: '40px 20px',
  },
  errorCode: {
    fontSize: '120px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1',
    marginBottom: '24px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#1f2937',
  },
  titleDark: {
    color: '#f9fafb',
  },
  description: {
    fontSize: '18px',
    color: '#6b7280',
    marginBottom: '40px',
    maxWidth: '500px',
    lineHeight: '1.6',
  },
  descriptionDark: {
    color: '#9ca3af',
  },
  buttonContainer: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: '500',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(202, 78, 121, 0.3)',
  },
  secondaryButton: {
    background: 'rgba(202, 78, 121, 0.1)',
    color: '#CA4E79',
    border: '2px solid rgba(202, 78, 121, 0.2)',
  },
  illustration: {
    width: '200px',
    height: '200px',
    margin: '0 auto 40px',
    background: 'linear-gradient(135deg, rgba(202, 78, 121, 0.1) 0%, rgba(232, 121, 166, 0.1) 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  illustrationIcon: {
    color: '#CA4E79',
    opacity: 0.6,
  },
}

const NotFoundPage = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={styles.container}
    >
      {/* Illustration */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={styles.illustration}
      >
        <Search size={80} style={styles.illustrationIcon} />
        
        {/* Floating elements */}
        <motion.div
          animate={{ 
            y: [-10, 10, -10],
            rotate: [0, 5, 0, -5, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '30px',
            width: '20px',
            height: '20px',
            background: '#CA4E79',
            borderRadius: '50%',
            opacity: 0.3,
          }}
        />
        
        <motion.div
          animate={{ 
            y: [10, -10, 10],
            rotate: [0, -5, 0, 5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '25px',
            width: '15px',
            height: '15px',
            background: '#E879A6',
            borderRadius: '50%',
            opacity: 0.4,
          }}
        />
      </motion.div>

      {/* Error Code */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={styles.errorCode}
      >
        404
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          ...styles.title,
          ...(isDark ? styles.titleDark : {})
        }}
      >
        Page Not Found
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        style={{
          ...styles.description,
          ...(isDark ? styles.descriptionDark : {})
        }}
      >
        Oops! The page you're looking for doesn't exist. It might have been moved, deleted, 
        or you entered the wrong URL. Let's get you back on track.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        style={styles.buttonContainer}
      >
        <Link
          to="/"
          style={{
            ...styles.button,
            ...styles.primaryButton,
          }}
        >
          <Home size={16} />
          Go Home
        </Link>
        
        <button
          onClick={() => window.history.back()}
          style={{
            ...styles.button,
            ...styles.secondaryButton,
          }}
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      </motion.div>

      {/* Additional Help */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        style={{
          marginTop: '40px',
          fontSize: '14px',
          color: isDark ? '#9ca3af' : '#6b7280',
        }}
      >
        <p>
          Need help? Check out our{' '}
          <Link
            to="/about"
            style={{
              color: '#CA4E79',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            About page
          </Link>
          {' '}or explore{' '}
          <Link
            to="/explore"
            style={{
              color: '#CA4E79',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            community predictions
          </Link>
        </p>
      </motion.div>
    </motion.div>
  )
}

export default NotFoundPage
