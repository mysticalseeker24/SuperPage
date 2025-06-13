import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import PredictionCard from '../PredictionCard'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    circle: ({ children, ...props }) => <circle {...props}>{children}</circle>,
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock API service
vi.mock('../../services/api', () => ({
  blockchainService: {
    publish: vi.fn(),
  },
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

const mockData = {
  score: 0.75,
  explanations: {
    0: 0.25,
    1: 0.30,
    2: 0.20,
    3: 0.15,
    4: 0.10,
    5: 0.05,
    6: 0.35,
  },
  formData: {
    pitchTitle: 'Test Startup',
    teamExperience: 8,
    traction: 5000,
    previousFunding: 1000000,
  },
}

const renderWithQueryClient = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('PredictionCard', () => {
  const mockOnBack = vi.fn()
  const mockWalletAddress = '0x1234567890123456789012345678901234567890'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders prediction card with correct data', () => {
    renderWithQueryClient(
      <PredictionCard
        data={mockData}
        onBack={mockOnBack}
        walletAddress={mockWalletAddress}
      />
    )

    // Check if success probability is displayed
    expect(screen.getByText('75% Success Probability')).toBeInTheDocument()
    expect(screen.getByText('High Funding Potential')).toBeInTheDocument()

    // Check if project details are displayed
    expect(screen.getByText('Test Startup')).toBeInTheDocument()
    expect(screen.getByText('8 years')).toBeInTheDocument()
    expect(screen.getByText('5,000 users/stars')).toBeInTheDocument()
    expect(screen.getByText('$1,000,000')).toBeInTheDocument()
  })

  test('displays circular gauge with correct percentage', () => {
    renderWithQueryClient(
      <PredictionCard
        data={mockData}
        onBack={mockOnBack}
        walletAddress={mockWalletAddress}
      />
    )

    // Check if the percentage is displayed in the center of the gauge
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('Success Rate')).toBeInTheDocument()
  })

  test('shows top 3 feature explanations', () => {
    renderWithQueryClient(
      <PredictionCard
        data={mockData}
        onBack={mockOnBack}
        walletAddress={mockWalletAddress}
      />
    )

    // Check if top contributing factors section is present
    expect(screen.getByText('Top Contributing Factors')).toBeInTheDocument()
    
    // Should show feature names (mocked FEATURE_NAMES)
    expect(screen.getByText('Success Probability')).toBeInTheDocument()
    expect(screen.getByText('Pitch Quality')).toBeInTheDocument()
    expect(screen.getByText('Team Experience')).toBeInTheDocument()
  })

  test('handles back button click', () => {
    renderWithQueryClient(
      <PredictionCard
        data={mockData}
        onBack={mockOnBack}
        walletAddress={mockWalletAddress}
      />
    )

    const backButton = screen.getByText('Back to Form')
    fireEvent.click(backButton)

    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  test('displays blockchain publish button', () => {
    renderWithQueryClient(
      <PredictionCard
        data={mockData}
        onBack={mockOnBack}
        walletAddress={mockWalletAddress}
      />
    )

    expect(screen.getByText('Publish to Blockchain')).toBeInTheDocument()
    expect(screen.getByText('Publish On-chain')).toBeInTheDocument()
  })

  test('shows wallet address in header', () => {
    renderWithQueryClient(
      <PredictionCard
        data={mockData}
        onBack={mockOnBack}
        walletAddress={mockWalletAddress}
      />
    )

    // Check if truncated wallet address is displayed
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
  })

  test('handles low success probability correctly', () => {
    const lowScoreData = {
      ...mockData,
      score: 0.25,
    }

    renderWithQueryClient(
      <PredictionCard
        data={lowScoreData}
        onBack={mockOnBack}
        walletAddress={mockWalletAddress}
      />
    )

    expect(screen.getByText('25% Success Probability')).toBeInTheDocument()
    expect(screen.getByText('Needs Improvement')).toBeInTheDocument()
  })

  test('displays federated learning information', () => {
    renderWithQueryClient(
      <PredictionCard
        data={mockData}
        onBack={mockOnBack}
        walletAddress={mockWalletAddress}
      />
    )

    expect(screen.getByText(/Based on federated learning analysis of 54K\+ fundraising data points/)).toBeInTheDocument()
  })
})
