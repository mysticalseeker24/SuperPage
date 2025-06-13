import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import App from '../App'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    circle: ({ children, ...props }) => <circle {...props}>{children}</circle>,
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock react-window for StartupsList
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount }) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: Math.min(itemCount, 3) }, (_, index) => (
        <div key={index}>
          {children({ index, style: {} })}
        </div>
      ))}
    </div>
  ),
}))

// Mock API services
vi.mock('../services/api', () => ({
  predictionService: {
    predict: vi.fn(),
  },
  blockchainService: {
    publish: vi.fn(),
  },
  checkAllServicesHealth: vi.fn(),
  convertPitchToFeatures: vi.fn(() => [8.5, 0.95, 0.88, 15000, 0.85, 2000000, 0.92]),
  FEATURE_NAMES: [
    'Team Experience',
    'Pitch Quality',
    'Tokenomics Score',
    'Traction',
    'Community Engagement',
    'Previous Funding',
    'Success Probability',
  ],
}))

// Mock wallet hook
vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({
    account: '0x1234567890123456789012345678901234567890',
    isConnecting: false,
    connectWallet: vi.fn(),
    isMetaMaskInstalled: true,
  }),
}))

// Mock fetch for StartupsList
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      {
        id: 'project-1',
        projectId: 'startup-001',
        title: 'DeFi Protocol',
        score: 0.85,
        timestamp: '2024-01-15T10:00:00Z',
        teamExperience: 8.5,
        previousFunding: 2000000,
        traction: 15000,
        category: 'DeFi',
        walletAddress: '0x1234567890123456789012345678901234567890',
      },
    ]),
  })
)

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful service health checks
    const { checkAllServicesHealth } = require('../services/api')
    checkAllServicesHealth.mockResolvedValue({
      ingestion: { status: 'healthy' },
      preprocessing: { status: 'healthy' },
      prediction: { status: 'healthy' },
      blockchain: { status: 'healthy' },
    })
  })

  test('renders app with wallet connected', () => {
    render(<App />)

    // Should show the main header
    expect(screen.getByText('SuperPage')).toBeInTheDocument()
    
    // Should show wallet address
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
    
    // Should show navigation
    expect(screen.getByText('Predict')).toBeInTheDocument()
    expect(screen.getByText('Explore')).toBeInTheDocument()
    
    // Should show dark mode toggle
    expect(screen.getByLabelText('Toggle dark mode')).toBeInTheDocument()
  })

  test('complete prediction flow', async () => {
    const { predictionService } = require('../services/api')
    predictionService.predict.mockResolvedValue({
      score: 0.85,
      explanations: { 0: 0.3, 1: 0.25, 2: 0.2 }
    })

    render(<App />)

    // Should start on prediction form
    expect(screen.getByText('Predict Your Fundraising Success')).toBeInTheDocument()

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Pitch Title/), {
      target: { value: 'Revolutionary DeFi Protocol' }
    })
    
    fireEvent.change(screen.getByLabelText(/Pitch Description/), {
      target: { value: 'This is a comprehensive description of our revolutionary DeFi protocol that will transform decentralized finance.' }
    })

    fireEvent.change(screen.getByLabelText(/Current Traction/), {
      target: { value: '10000' }
    })

    // Submit the form
    const submitButton = screen.getByText('Get AI Prediction')
    fireEvent.click(submitButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Analyzing...')).toBeInTheDocument()
    })

    // Should navigate to prediction results
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(screen.getByText('Success Rate')).toBeInTheDocument()
      expect(screen.getByText('High Funding Potential')).toBeInTheDocument()
    })

    // Should show back button
    expect(screen.getByText('Back to Form')).toBeInTheDocument()
  })

  test('navigation between views', async () => {
    render(<App />)

    // Start on prediction form
    expect(screen.getByText('Predict Your Fundraising Success')).toBeInTheDocument()

    // Navigate to startups list
    const exploreButton = screen.getByText('Explore')
    fireEvent.click(exploreButton)

    // Should show startups list
    await waitFor(() => {
      expect(screen.getByText('Startup Predictions')).toBeInTheDocument()
      expect(screen.getByText('Explore AI-powered fundraising predictions from the community')).toBeInTheDocument()
    })

    // Navigate back to prediction form
    const predictButton = screen.getByText('Predict')
    fireEvent.click(predictButton)

    // Should show prediction form again
    expect(screen.getByText('Predict Your Fundraising Success')).toBeInTheDocument()
  })

  test('mobile navigation works', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    render(<App />)

    // Should show mobile navigation (buttons are present but may be hidden by CSS)
    const mobileButtons = screen.getAllByText('Predict')
    expect(mobileButtons.length).toBeGreaterThan(0)
  })

  test('dark mode toggle works', () => {
    render(<App />)

    const darkModeToggle = screen.getByLabelText('Toggle dark mode')
    
    // Click to toggle dark mode
    fireEvent.click(darkModeToggle)

    // Should update localStorage (mocked)
    expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'true')
  })

  test('service status monitoring', async () => {
    render(<App />)

    // Should show service status indicator
    await waitFor(() => {
      expect(screen.getByText('4/4 Services')).toBeInTheDocument()
    })
  })

  test('blockchain publishing flow', async () => {
    const { predictionService, blockchainService } = require('../services/api')
    
    predictionService.predict.mockResolvedValue({
      score: 0.85,
      explanations: { 0: 0.3, 1: 0.25, 2: 0.2 }
    })
    
    blockchainService.publish.mockResolvedValue({
      transaction_hash: '0xabcdef123456789',
      success: true
    })

    render(<App />)

    // Complete prediction flow first
    fireEvent.change(screen.getByLabelText(/Pitch Title/), {
      target: { value: 'Test Startup' }
    })
    
    fireEvent.change(screen.getByLabelText(/Pitch Description/), {
      target: { value: 'This is a test description that meets the minimum length requirement.' }
    })

    fireEvent.click(screen.getByText('Get AI Prediction'))

    // Wait for prediction results
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument()
    })

    // Find and click publish button
    const publishButton = screen.getByText('Publish On-chain')
    fireEvent.click(publishButton)

    // Should show publishing state
    await waitFor(() => {
      expect(screen.getByText('Publishing...')).toBeInTheDocument()
    })

    // Should show success state
    await waitFor(() => {
      expect(screen.getByText('Published Successfully!')).toBeInTheDocument()
    })
  })

  test('error handling in prediction flow', async () => {
    const { predictionService } = require('../services/api')
    predictionService.predict.mockRejectedValue(new Error('Network error'))

    render(<App />)

    // Fill out form
    fireEvent.change(screen.getByLabelText(/Pitch Title/), {
      target: { value: 'Test Startup' }
    })
    
    fireEvent.change(screen.getByLabelText(/Pitch Description/), {
      target: { value: 'This is a test description that meets the minimum length requirement.' }
    })

    // Submit form
    fireEvent.click(screen.getByText('Get AI Prediction'))

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Prediction Failed')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  test('startups list filtering and interaction', async () => {
    render(<App />)

    // Navigate to startups list
    fireEvent.click(screen.getByText('Explore'))

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    // Should show search and filter controls
    expect(screen.getByPlaceholderText('Search by ID or title...')).toBeInTheDocument()
    expect(screen.getByText(/Minimum Success Rate:/)).toBeInTheDocument()

    // Test search functionality
    const searchInput = screen.getByPlaceholderText('Search by ID or title...')
    fireEvent.change(searchInput, { target: { value: 'DeFi' } })

    // Should filter results
    await waitFor(() => {
      expect(screen.getByText('DeFi Protocol')).toBeInTheDocument()
    })
  })
})
