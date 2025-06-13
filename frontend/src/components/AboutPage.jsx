import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { 
  Search, 
  Shield, 
  Link, 
  BarChart3, 
  Zap, 
  Users,
  Brain,
  Lock,
  Globe,
  Code,
  Database,
  Cpu
} from 'lucide-react'

// Styles for the AboutPage component
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px',
    color: '#E0E0E0',
  },
  markdownContent: {
    lineHeight: '1.8',
    fontSize: '16px',
  },
  heading: {
    color: '#CA4E79',
    marginBottom: '16px',
    fontWeight: '700',
  },
  h1: {
    fontSize: '48px',
    marginBottom: '24px',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #CA4E79 0%, #E879A6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  h2: {
    fontSize: '32px',
    marginTop: '48px',
    marginBottom: '20px',
  },
  h3: {
    fontSize: '24px',
    marginTop: '32px',
    marginBottom: '16px',
  },
  paragraph: {
    marginBottom: '16px',
    color: '#E0E0E0',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    margin: '40px 0',
  },
  featureCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(202, 78, 121, 0.2)',
    borderRadius: '16px',
    padding: '24px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  featureCardHover: {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(202, 78, 121, 0.2)',
    border: '1px solid rgba(202, 78, 121, 0.4)',
  },
  featureIcon: {
    width: '48px',
    height: '48px',
    color: '#CA4E79',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#CA4E79',
    marginBottom: '12px',
  },
  featureDescription: {
    color: '#E0E0E0',
    lineHeight: '1.6',
  },
  roadmapSection: {
    margin: '48px 0',
  },
  roadmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '32px',
  },
  roadmapCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(202, 78, 121, 0.1)',
    borderRadius: '12px',
    padding: '20px',
  },
  roadmapPhase: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#CA4E79',
    marginBottom: '12px',
  },
  roadmapStatus: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    marginLeft: '8px',
  },
  statusCompleted: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981',
  },
  statusInProgress: {
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#f59e0b',
  },
  statusPlanned: {
    background: 'rgba(107, 114, 128, 0.2)',
    color: '#6b7280',
  },
}

// Feature cards data
const features = [
  {
    icon: Search,
    title: 'Firecrawl Integration',
    description: 'Advanced web scraping technology to gather comprehensive startup data from across the Web3 ecosystem.',
  },
  {
    icon: Brain,
    title: 'Federated Learning',
    description: 'Privacy-preserving machine learning that trains models across distributed nodes without sharing sensitive data.',
  },
  {
    icon: Link,
    title: 'On-Chain Storage',
    description: 'Immutable prediction records stored on Ethereum blockchain with cryptographic verification and transparency.',
  },
  {
    icon: BarChart3,
    title: 'SHAP Explanations',
    description: 'Detailed feature importance analysis to understand exactly why our AI made specific predictions.',
  },
  {
    icon: Shield,
    title: 'Privacy-First Design',
    description: 'Zero-knowledge architecture ensures your sensitive data never leaves your control while contributing to collective intelligence.',
  },
  {
    icon: Zap,
    title: 'Real-Time Insights',
    description: 'Instant feedback on fundraising potential with actionable recommendations for improvement.',
  },
]

// Roadmap data
const roadmapPhases = [
  {
    phase: 'Phase 1: Foundation',
    period: 'Q1 2024',
    status: 'completed',
    items: ['Core prediction engine', 'Basic web interface', 'MetaMask integration', 'Sepolia testnet deployment'],
  },
  {
    phase: 'Phase 2: Enhancement',
    period: 'Q2 2024',
    status: 'inProgress',
    items: ['Advanced ML models', 'Federated learning implementation', 'Enhanced UI/UX', 'Mobile responsiveness'],
  },
  {
    phase: 'Phase 3: Scale',
    period: 'Q3 2024',
    status: 'planned',
    items: ['Mainnet deployment', 'API marketplace', 'Partner integrations', 'Advanced analytics'],
  },
  {
    phase: 'Phase 4: Ecosystem',
    period: 'Q4 2024',
    status: 'planned',
    items: ['DAO governance', 'Token economics', 'Global expansion', 'Enterprise solutions'],
  },
]

// Animated section component
const AnimatedSection = ({ children, delay = 0 }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.section>
  )
}

// Feature card component
const FeatureCard = ({ feature, index }) => {
  const [isHovered, setIsHovered] = useState(false)
  const IconComponent = feature.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        ...styles.featureCard,
        ...(isHovered ? styles.featureCardHover : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <IconComponent style={styles.featureIcon} />
      <h3 style={styles.featureTitle}>{feature.title}</h3>
      <p style={styles.featureDescription}>{feature.description}</p>
    </motion.div>
  )
}

// Roadmap card component
const RoadmapCard = ({ phase, index }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted
      case 'inProgress':
        return styles.statusInProgress
      default:
        return styles.statusPlanned
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '✅ Completed'
      case 'inProgress':
        return '🔄 In Progress'
      default:
        return '📋 Planned'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={styles.roadmapCard}
    >
      <div style={styles.roadmapPhase}>
        {phase.phase}
        <span style={{ ...styles.roadmapStatus, ...getStatusStyle(phase.status) }}>
          {getStatusText(phase.status)}
        </span>
      </div>
      <p style={{ color: '#9ca3af', marginBottom: '12px' }}>{phase.period}</p>
      <ul style={{ color: '#E0E0E0', paddingLeft: '20px' }}>
        {phase.items.map((item, idx) => (
          <li key={idx} style={{ marginBottom: '4px' }}>
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

const AboutPage = () => {
  const [markdownContent, setMarkdownContent] = useState('')

  useEffect(() => {
    // Fetch the markdown content
    fetch('/about.md')
      .then(response => response.text())
      .then(text => setMarkdownContent(text))
      .catch(error => console.error('Error loading about.md:', error))
  }, [])

  // Custom markdown components
  const markdownComponents = {
    h1: ({ children }) => <h1 style={{ ...styles.heading, ...styles.h1 }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ ...styles.heading, ...styles.h2 }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ ...styles.heading, ...styles.h3 }}>{children}</h3>,
    p: ({ children }) => <p style={styles.paragraph}>{children}</p>,
  }

  return (
    <div style={styles.container}>
      <AnimatedSection>
        <ReactMarkdown
          components={markdownComponents}
          rehypePlugins={[rehypeSanitize]}
          style={styles.markdownContent}
        >
          {markdownContent}
        </ReactMarkdown>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <h2 style={{ ...styles.heading, ...styles.h2, textAlign: 'center', marginBottom: '40px' }}>
          Key Features
        </h2>
        <div style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.4}>
        <div style={styles.roadmapSection}>
          <h2 style={{ ...styles.heading, ...styles.h2, textAlign: 'center' }}>
            Development Roadmap
          </h2>
          <div style={styles.roadmapGrid}>
            {roadmapPhases.map((phase, index) => (
              <RoadmapCard key={index} phase={phase} index={index} />
            ))}
          </div>
        </div>
      </AnimatedSection>
    </div>
  )
}

export default AboutPage
