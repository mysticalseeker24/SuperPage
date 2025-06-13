import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react'
import StartupsList from './StartupsList'
import PredictionCard from './PredictionCard'

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
    margin: '0 auto 40px',
    lineHeight: '1.6',
  },
  subtitleDark: {
    color: '#9ca3af',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
    marginBottom: '48px',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(229, 231, 235, 0.5)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
  },
  statCardDark: {
    background: 'rgba(29, 28, 36, 0.8)',
    border: '1px solid rgba(55, 65, 81, 0.5)',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 16px',
    background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#1f2937',
  },
  statValueDark: {
    color: '#f9fafb',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  statLabelDark: {
    color: '#9ca3af',
  },
  detailModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  detailContent: {
    background: 'white',
    borderRadius: '16px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
  },
  detailContentDark: {
    background: '#1f2937',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(107, 114, 128, 0.1)',
    border: 'none',
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer',
    color: '#6b7280',
    fontSize: '24px',
    fontWeight: 'bold',
    zIndex: 1001,
  },
}

const stats = [
  {
    icon: BarChart3,
    value: '1,247',
    label: 'Total Predictions',
  },
  {
    icon: TrendingUp,
    value: '85.3%',
    label: 'Accuracy Rate',
  },
  {
    icon: Users,
    value: '342',
    label: 'Active Projects',
  },
  {
    icon: Zap,
    value: '24/7',
    label: 'Real-time Updates',
  },
]

const ExplorePage = () => {
  const [selectedPrediction, setSelectedPrediction] = useState(null)
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  const handleViewDetails = (prediction) => {
    // Convert prediction data to match expected format for PredictionCard
    const formattedData = {
      score: prediction.score,
      explanations: {
        'Team Experience': Math.random() * 0.3,
        'Pitch Quality': Math.random() * 0.3,
        'Tokenomics Score': Math.random() * 0.3,
      },
      formData: {
        pitchTitle: prediction.title || prediction.projectId,
        teamExperience: prediction.teamExperience || 5,
        traction: prediction.traction || 1000,
        previousFunding: prediction.previousFunding || 0,
        pitchDescription: `Detailed analysis for ${prediction.title || prediction.projectId}`,
      }
    }
    setSelectedPrediction(formattedData)
  }

  const handleCloseDetails = () => {
    setSelectedPrediction(null)
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={styles.header}
      >
        <h1 style={styles.title}>
          Explore Community Predictions
        </h1>
        <p style={{
          ...styles.subtitle,
          ...(isDark ? styles.subtitleDark : {})
        }}>
          Discover AI-powered fundraising predictions from the Web3 community. 
          Learn from successful projects and identify emerging trends in the ecosystem.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={styles.statsGrid}
      >
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{
                ...styles.statCard,
                ...(isDark ? styles.statCardDark : {})
              }}
            >
              <div style={styles.statIcon}>
                <IconComponent size={24} />
              </div>
              <div style={{
                ...styles.statValue,
                ...(isDark ? styles.statValueDark : {})
              }}>
                {stat.value}
              </div>
              <div style={{
                ...styles.statLabel,
                ...(isDark ? styles.statLabelDark : {})
              }}>
                {stat.label}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Startups List */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <StartupsList onViewDetails={handleViewDetails} />
      </motion.div>

      {/* Detail Modal */}
      {selectedPrediction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.detailModal}
          onClick={handleCloseDetails}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              ...styles.detailContent,
              ...(isDark ? styles.detailContentDark : {})
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseDetails}
              style={styles.closeButton}
            >
              ×
            </button>
            <PredictionCard
              data={selectedPrediction}
              onBack={handleCloseDetails}
              walletAddress="0x1234...5678"
              isModal={true}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default ExplorePage
