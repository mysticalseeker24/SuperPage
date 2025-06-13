import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Zap, BarChart3, Shield, Brain, Link as LinkIcon, Users } from 'lucide-react'

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '80px',
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: '800',
    marginBottom: '24px',
    background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1.1',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#6b7280',
    marginBottom: '40px',
    maxWidth: '600px',
    margin: '0 auto 40px',
    lineHeight: '1.6',
  },
  heroSubtitleDark: {
    color: '#9ca3af',
  },
  ctaContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  ctaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 32px',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '16px',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
  },
  ctaPrimary: {
    background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
    color: 'white',
    boxShadow: '0 8px 25px rgba(202, 78, 121, 0.3)',
  },
  ctaSecondary: {
    background: 'rgba(202, 78, 121, 0.1)',
    color: '#CA4E79',
    border: '2px solid rgba(202, 78, 121, 0.2)',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    marginBottom: '80px',
  },
  featureCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(229, 231, 235, 0.5)',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
  },
  featureCardDark: {
    background: 'rgba(29, 28, 36, 0.8)',
    border: '1px solid rgba(55, 65, 81, 0.5)',
  },
  featureIcon: {
    width: '64px',
    height: '64px',
    margin: '0 auto 24px',
    background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  featureTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#1f2937',
  },
  featureTitleDark: {
    color: '#f9fafb',
  },
  featureDescription: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: '1.6',
  },
  featureDescriptionDark: {
    color: '#9ca3af',
  },
  statsSection: {
    background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
    borderRadius: '24px',
    padding: '60px 40px',
    textAlign: 'center',
    color: 'white',
    marginBottom: '80px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '40px',
    marginTop: '40px',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '48px',
    fontWeight: '800',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '16px',
    opacity: 0.9,
  },
}

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Predictions',
    description: 'Advanced machine learning models trained on thousands of Web3 projects to predict fundraising success with high accuracy.',
  },
  {
    icon: Shield,
    title: 'Privacy-First Design',
    description: 'Federated learning ensures your sensitive data never leaves your control while contributing to collective intelligence.',
  },
  {
    icon: LinkIcon,
    title: 'Blockchain Verified',
    description: 'All predictions are cryptographically verified and stored immutably on the Ethereum blockchain for transparency.',
  },
  {
    icon: BarChart3,
    title: 'Explainable AI',
    description: 'Understand exactly why our AI made specific predictions with detailed SHAP explanations and feature importance.',
  },
  {
    icon: Zap,
    title: 'Real-Time Insights',
    description: 'Get instant feedback on your project\'s fundraising potential with actionable recommendations for improvement.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Benefit from the collective wisdom of the Web3 community while maintaining individual privacy and security.',
  },
]

const stats = [
  { number: '10K+', label: 'Projects Analyzed' },
  { number: '85%', label: 'Prediction Accuracy' },
  { number: '500+', label: 'Active Users' },
  { number: '24/7', label: 'Uptime' },
]

const HomePage = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={styles.hero}
      >
        <h1 style={styles.heroTitle}>
          Predict Web3 Fundraising Success with AI
        </h1>
        <p style={{
          ...styles.heroSubtitle,
          ...(isDark ? styles.heroSubtitleDark : {})
        }}>
          Leverage advanced machine learning and federated learning to predict the success of Web3 startup fundraising campaigns with privacy-first, blockchain-verified insights.
        </p>
        <div style={styles.ctaContainer}>
          <Link
            to="/predict"
            style={{
              ...styles.ctaButton,
              ...styles.ctaPrimary,
            }}
          >
            <Zap size={20} />
            Start Predicting
          </Link>
          <Link
            to="/explore"
            style={{
              ...styles.ctaButton,
              ...styles.ctaSecondary,
            }}
          >
            <BarChart3 size={20} />
            Explore Predictions
          </Link>
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={styles.featuresGrid}
      >
        {features.map((feature, index) => {
          const IconComponent = feature.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              style={{
                ...styles.featureCard,
                ...(isDark ? styles.featureCardDark : {})
              }}
            >
              <div style={styles.featureIcon}>
                <IconComponent size={32} />
              </div>
              <h3 style={{
                ...styles.featureTitle,
                ...(isDark ? styles.featureTitleDark : {})
              }}>
                {feature.title}
              </h3>
              <p style={{
                ...styles.featureDescription,
                ...(isDark ? styles.featureDescriptionDark : {})
              }}>
                {feature.description}
              </p>
            </motion.div>
          )
        })}
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        style={styles.statsSection}
      >
        <h2 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '16px' }}>
          Trusted by the Web3 Community
        </h2>
        <p style={{ fontSize: '18px', opacity: 0.9 }}>
          Join thousands of builders using SuperPage to make data-driven fundraising decisions
        </p>
        <div style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + 0.1 * index }}
              style={styles.statItem}
            >
              <div style={styles.statNumber}>{stat.number}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  )
}

export default HomePage
