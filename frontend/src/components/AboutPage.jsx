import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
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
  Globe,
  Server,
  ChevronDown,
  Settings,
  Wallet,
  ExternalLink,
  Github,
  Mail
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
  dropdownSection: {
    margin: '48px 0',
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(202, 78, 121, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '8px',
  },
  dropdownHeaderHover: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(202, 78, 121, 0.4)',
  },
  dropdownTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '20px',
    fontWeight: '600',
    color: '#CA4E79',
  },
  dropdownContent: {
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(202, 78, 121, 0.1)',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  serviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  serviceCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(202, 78, 121, 0.15)',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s ease',
  },
  serviceCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(202, 78, 121, 0.15)',
    border: '1px solid rgba(202, 78, 121, 0.3)',
  },
  serviceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  serviceTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#CA4E79',
  },
  servicePort: {
    fontSize: '12px',
    padding: '4px 8px',
    background: 'rgba(202, 78, 121, 0.2)',
    color: '#CA4E79',
    borderRadius: '6px',
    fontFamily: 'monospace',
  },
  serviceDescription: {
    color: '#E0E0E0',
    marginBottom: '16px',
    lineHeight: '1.6',
  },
  techList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px',
  },
  techTag: {
    fontSize: '12px',
    padding: '4px 8px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#9ca3af',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
}

// Backend services data
const backendServices = [
  {
    icon: Globe,
    title: 'Frontend Application',
    port: '3000',
    description: 'React-based user interface with mandatory MetaMask wallet authentication and glassmorphism design.',
    technologies: ['React 18', 'Framer Motion', 'React Query v5', 'CSS-in-JS', 'Vite', 'Ethers.js'],
    features: ['Wallet-first authentication', 'Responsive design', 'Dark/light mode', 'Real-time API integration'],
  },
  {
    icon: Search,
    title: 'Ingestion Service',
    port: '8010',
    description: 'Web3 data scraping and collection using Firecrawl technology for comprehensive startup analysis.',
    technologies: ['FastAPI', 'Firecrawl MCP SDK', 'MongoDB', 'Async Processing', 'Structured Logging'],
    features: ['Web scraping', 'Data validation', 'Rate limiting', 'Health monitoring'],
  },
  {
    icon: Settings,
    title: 'Preprocessing Service',
    port: '8001',
    description: 'ML feature extraction and data transformation pipeline for AI-ready datasets.',
    technologies: ['FastAPI', 'Pandas', 'Scikit-learn', 'Transformers', 'DistilBERT', 'TF-IDF'],
    features: ['7-feature extraction', 'NLP processing', 'Data scaling', 'Vector generation'],
  },
  {
    icon: Brain,
    title: 'Training Service',
    port: 'CLI',
    description: 'Federated learning coordination using Flower framework for privacy-preserving model training.',
    technologies: ['Flower', 'PyTorch', 'SVSimulator', 'FedAvg', 'Model Aggregation'],
    features: ['Federated learning', 'Privacy preservation', 'Model versioning', 'Distributed training'],
  },
  {
    icon: BarChart3,
    title: 'Prediction Service',
    port: '8002',
    description: 'Real-time inference engine with explainable AI using SHAP for feature importance analysis.',
    technologies: ['FastAPI', 'PyTorch', 'SHAP', 'BentoML', 'Neural Networks'],
    features: ['Sub-second inference', 'SHAP explanations', 'Confidence scores', 'Model serving'],
  },
  {
    icon: Link,
    title: 'Blockchain Service',
    port: '8003',
    description: 'Smart contract integration for immutable on-chain prediction storage with cryptographic proofs.',
    technologies: ['FastAPI', 'HardHat', 'Ethers.js', 'Solidity', 'Sepolia Testnet'],
    features: ['Smart contracts', 'Transaction handling', 'Gas optimization', 'Proof generation'],
  },
]

// Feature cards data
const features = [
  {
    icon: Wallet,
    title: 'Wallet-First Authentication',
    description: 'Mandatory MetaMask connection with beautiful authentication gate and auto-reconnection capabilities.',
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

// Service card component
const ServiceCard = ({ service, index }) => {
  const [isHovered, setIsHovered] = useState(false)
  const IconComponent = service.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        ...styles.serviceCard,
        ...(isHovered ? styles.serviceCardHover : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.serviceHeader}>
        <IconComponent size={24} style={{ color: '#CA4E79' }} />
        <div>
          <div style={styles.serviceTitle}>{service.title}</div>
          <div style={styles.servicePort}>Port {service.port}</div>
        </div>
      </div>

      <p style={styles.serviceDescription}>{service.description}</p>

      <div>
        <h4 style={{ color: '#CA4E79', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
          Technologies:
        </h4>
        <div style={styles.techList}>
          {service.technologies.map((tech, idx) => (
            <span key={idx} style={styles.techTag}>{tech}</span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h4 style={{ color: '#CA4E79', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
          Key Features:
        </h4>
        <ul style={{ color: '#E0E0E0', paddingLeft: '16px', fontSize: '14px' }}>
          {service.features.map((feature, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>{feature}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

// Dropdown section component
const DropdownSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div style={styles.dropdownSection}>
      <motion.div
        style={{
          ...styles.dropdownHeader,
          ...(isHovered ? styles.dropdownHeaderHover : {}),
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div style={styles.dropdownTitle}>
          <Icon size={24} />
          <span>{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} style={{ color: '#CA4E79' }} />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={styles.dropdownContent}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
        <DropdownSection
          title="🏗️ Backend Services Architecture"
          icon={Server}
          defaultOpen={true}
        >
          <p style={{ color: '#E0E0E0', marginBottom: '24px', lineHeight: '1.6' }}>
            SuperPage operates as a distributed microservices ecosystem with 6 specialized components working together
            to provide secure, privacy-first Web3 fundraising predictions. Each service is containerized with Docker
            and includes comprehensive health monitoring, structured logging, and production-ready deployment.
          </p>
          <div style={styles.serviceGrid}>
            {backendServices.map((service, index) => (
              <ServiceCard key={index} service={service} index={index} />
            ))}
          </div>
        </DropdownSection>
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <DropdownSection
          title="🎯 ML Model & Feature Engineering"
          icon={Brain}
        >
          <div style={{ color: '#E0E0E0', lineHeight: '1.6' }}>
            <h3 style={{ color: '#CA4E79', marginBottom: '16px' }}>7-Feature Neural Network Model</h3>
            <p style={{ marginBottom: '20px' }}>
              Our AI model analyzes 7 critical features to predict fundraising success with 85%+ accuracy:
            </p>

            <div style={styles.serviceGrid}>
              {[
                { name: 'ProjectID', type: 'UUID', desc: 'Unique identifier for tracking and verification' },
                { name: 'TeamExperience', type: '0.5-15 years', desc: 'Combined team expertise in relevant domains' },
                { name: 'PitchQuality', type: '0-1 score', desc: 'NLP sentiment analysis of project description using DistilBERT' },
                { name: 'TokenomicsScore', type: '0-1 rating', desc: 'Economic model sustainability and tokenomics analysis' },
                { name: 'Traction', type: '1-25,000', desc: 'Normalized user count, GitHub stars, or download metrics' },
                { name: 'CommunityEngagement', type: '0-0.5 ratio', desc: 'Social media activity and community interaction levels' },
                { name: 'PreviousFunding', type: '$0-$100M', desc: 'Historical investment amounts and funding rounds' },
              ].map((feature, idx) => (
                <div key={idx} style={styles.serviceCard}>
                  <h4 style={{ color: '#CA4E79', marginBottom: '8px' }}>{feature.name}</h4>
                  <div style={styles.servicePort}>{feature.type}</div>
                  <p style={{ color: '#E0E0E0', marginTop: '12px', fontSize: '14px' }}>{feature.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(202, 78, 121, 0.1)', borderRadius: '12px' }}>
              <h4 style={{ color: '#CA4E79', marginBottom: '12px' }}>🧠 Model Specifications:</h4>
              <ul style={{ paddingLeft: '20px', color: '#E0E0E0' }}>
                <li><strong>Architecture:</strong> PyTorch tabular regression neural network</li>
                <li><strong>Training:</strong> Federated learning with 54K+ data points</li>
                <li><strong>Accuracy:</strong> 85%+ success prediction rate</li>
                <li><strong>Inference:</strong> Sub-second response time</li>
                <li><strong>Explainability:</strong> SHAP values for top 3 feature importance</li>
                <li><strong>Privacy:</strong> No raw data sharing, only model weights</li>
              </ul>
            </div>
          </div>
        </DropdownSection>
      </AnimatedSection>

      <AnimatedSection delay={0.4}>
        <DropdownSection
          title="🔐 Security & Privacy Features"
          icon={Shield}
        >
          <div style={styles.serviceGrid}>
            {[
              {
                title: '🛡️ Wallet-First Authentication',
                features: ['Mandatory MetaMask connection', 'Auto-detection of existing connections', 'Session persistence across visits', 'Security enforcement with auto-logout'],
              },
              {
                title: '🔒 Privacy Protection',
                features: ['Federated learning with no data sharing', 'Local processing of sensitive data', 'End-to-end encrypted communications', 'Zero-knowledge cryptographic proofs'],
              },
              {
                title: '⛓️ Blockchain Security',
                features: ['Audited Solidity smart contracts', 'Immutable prediction records', 'SHA-256 cryptographic proofs', 'Decentralized storage architecture'],
              },
            ].map((section, idx) => (
              <div key={idx} style={styles.serviceCard}>
                <h4 style={{ color: '#CA4E79', marginBottom: '16px' }}>{section.title}</h4>
                <ul style={{ color: '#E0E0E0', paddingLeft: '16px' }}>
                  {section.features.map((feature, fidx) => (
                    <li key={fidx} style={{ marginBottom: '8px' }}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DropdownSection>
      </AnimatedSection>

      <AnimatedSection delay={0.5}>
        <h2 style={{ ...styles.heading, ...styles.h2, textAlign: 'center', marginBottom: '40px' }}>
          Key Features
        </h2>
        <div style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.6}>
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

      <AnimatedSection delay={0.7}>
        <DropdownSection
          title="📞 Contact & Community"
          icon={Users}
        >
          <div style={{ textAlign: 'center', color: '#E0E0E0' }}>
            <p style={{ marginBottom: '24px', fontSize: '18px' }}>
              Join our growing community of Web3 builders, investors, and innovators
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <motion.a
                href="mailto:sakshammishra2402@gmail.com"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'rgba(202, 78, 121, 0.2)',
                  color: '#CA4E79',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  border: '1px solid rgba(202, 78, 121, 0.3)',
                }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(202, 78, 121, 0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Mail size={20} />
                <span>Email</span>
              </motion.a>

              <motion.a
                href="https://github.com/mysticalseeker24/SuperPage"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'rgba(202, 78, 121, 0.2)',
                  color: '#CA4E79',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  border: '1px solid rgba(202, 78, 121, 0.3)',
                }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(202, 78, 121, 0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Github size={20} />
                <span>GitHub</span>
                <ExternalLink size={16} />
              </motion.a>
            </div>
          </div>
        </DropdownSection>
      </AnimatedSection>
    </div>
  )
}

export default AboutPage
