import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import PitchForm from '../PitchForm'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}))

// Mock API service
vi.mock('../../services/api', () => ({
  predictionService: {
    predict: vi.fn(),
  },
  convertPitchToFeatures: vi.fn(() => [8.5, 0.95, 0.88, 15000, 0.85, 2000000, 0.92]),
}))

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

describe('PitchForm', () => {
  const mockOnPredictionSuccess = vi.fn()
  const mockWalletAddress = '0x1234567890123456789012345678901234567890'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders form with all required fields', () => {
    renderWithQueryClient(
      <PitchForm
        onPredictionSuccess={mockOnPredictionSuccess}
        walletAddress={mockWalletAddress}
      />
    )

    // Check for form title
    expect(screen.getByText('Predict Your Fundraising Success')).toBeInTheDocument()

    // Check for all form fields
    expect(screen.getByLabelText(/Pitch Title/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Pitch Description/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Team Experience/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Tokenomics Documentation URL/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Current Traction/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Community Engagement Score/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Previous Funding/)).toBeInTheDocument()

    // Check for submit button
    expect(screen.getByText('Get AI Prediction')).toBeInTheDocument()
  })

  test('validates required fields', async () => {
    renderWithQueryClient(
      <PitchForm
        onPredictionSuccess={mockOnPredictionSuccess}
        walletAddress={mockWalletAddress}
      />
    )

    // Try to submit empty form
    const submitButton = screen.getByText('Get AI Prediction')
    fireEvent.click(submitButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Pitch title is required')).toBeInTheDocument()
      expect(screen.getByText('Pitch description is required')).toBeInTheDocument()
    })
  })

  test('validates minimum field lengths', async () => {
    renderWithQueryClient(
      <PitchForm
        onPredictionSuccess={mockOnPredictionSuccess}
        walletAddress={mockWalletAddress}
      />
    )

    // Fill in fields with insufficient length
    fireEvent.change(screen.getByLabelText(/Pitch Title/), {
      target: { value: 'Hi' }
    })
    fireEvent.change(screen.getByLabelText(/Pitch Description/), {
      target: { value: 'Short' }
    })

    // Try to submit
    const submitButton = screen.getByText('Get AI Prediction')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Title must be at least 5 characters')).toBeInTheDocument()
      expect(screen.getByText('Description must be at least 50 characters')).toBeInTheDocument()
    })
  })

  test('validates URL format for tokenomics field', async () => {
    renderWithQueryClient(
      <PitchForm
        onPredictionSuccess={mockOnPredictionSuccess}
        walletAddress={mockWalletAddress}
      />
    )

    // Enter invalid URL
    fireEvent.change(screen.getByLabelText(/Tokenomics Documentation URL/), {
      target: { value: 'not-a-url' }
    })

    // Try to submit
    const submitButton = screen.getByText('Get AI Prediction')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid URL/)).toBeInTheDocument()
    })
  })

  test('updates slider values correctly', () => {
    renderWithQueryClient(
      <PitchForm
        onPredictionSuccess={mockOnPredictionSuccess}
        walletAddress={mockWalletAddress}
      />
    )

    // Test team experience slider
    const teamSlider = screen.getByDisplayValue('5')
    fireEvent.change(teamSlider, { target: { value: '8' } })
    expect(screen.getByText('8 years')).toBeInTheDocument()

    // Test community engagement slider
    const communitySlider = screen.getByDisplayValue('0.1')
    fireEvent.change(communitySlider, { target: { value: '0.3' } })
    expect(screen.getByText('0.3')).toBeInTheDocument()
  })

  test('shows character count for description', () => {
    renderWithQueryClient(
      <PitchForm
        onPredictionSuccess={mockOnPredictionSuccess}
        walletAddress={mockWalletAddress}
      />
    )

    const description = 'This is a test description for our amazing startup'
    fireEvent.change(screen.getByLabelText(/Pitch Description/), {
      target: { value: description }
    })

    expect(screen.getByText(`${description.length} characters`)).toBeInTheDocument()
  })

  test('validates numeric field ranges', async () => {
    renderWithQueryClient(
      <PitchForm
        onPredictionSuccess={mockOnPredictionSuccess}
        walletAddress={mockWalletAddress}
      />
    )

    // Test traction field with invalid value
    fireEvent.change(screen.getByLabelText(/Current Traction/), {
      target: { value: '30000' } // Above max of 25000
    })

    // Test previous funding with invalid value
    fireEvent.change(screen.getByLabelText(/Previous Funding/), {
      target: { value: '200000000' } // Above max of 100M
    })

    const submitButton = screen.getByText('Get AI Prediction')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Maximum 25,000')).toBeInTheDocument()
      expect(screen.getByText('Maximum $100M')).toBeInTheDocument()
    })
  })

  test('submits form with valid data', async () => {
    const { predictionService } = require('../../services/api')
    predictionService.predict.mockResolvedValue({
      score: 0.85,
      explanations: { 0: 0.3, 1: 0.25, 2: 0.2 }
    })

    renderWithQueryClient(
      <PitchForm
        onPredictionSuccess={mockOnPredictionSuccess}
        walletAddress={mockWalletAddress}
      />
    )

    // Fill in valid form data
    fireEvent.change(screen.getByLabelText(/Pitch Title/), {
      target: { value: 'Amazing DeFi Protocol' }
    })
    fireEvent.change(screen.getByLabelText(/Pitch Description/), {
      target: { value: 'This is a comprehensive description of our revolutionary DeFi protocol that will change the world of finance forever.' }
    })
    fireEvent.change(screen.getByLabelText(/Tokenomics Documentation URL/), {
      target: { value: 'https://docs.example.com/tokenomics' }
    })
    fireEvent.change(screen.getByLabelText(/Current Traction/), {
      target: { value: '5000' }
    })
    fireEvent.change(screen.getByLabelText(/Previous Funding/), {
      target: { value: '1000000' }
    })

    // Submit form
    const submitButton = screen.getByText('Get AI Prediction')
    fireEvent.click(submitButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Analyzing...')).toBeInTheDocument()
    })

    // Should call prediction service and success callback
    await waitFor(() => {
      expect(predictionService.predict).toHaveBeenCalled()
      expect(mockOnPredictionSuccess).toHaveBeenCalled()
    })
  })

  test('handles prediction API error', async () => {
    const { predictionService } = require('../../services/api')
    predictionService.predict.mockRejectedValue(new Error('API Error'))

    renderWithQueryClient(
      <PitchForm
        onPredictionSuccess={mockOnPredictionSuccess}
        walletAddress={mockWalletAddress}
      />
    )

    // Fill in minimal valid data
    fireEvent.change(screen.getByLabelText(/Pitch Title/), {
      target: { value: 'Test Startup' }
    })
    fireEvent.change(screen.getByLabelText(/Pitch Description/), {
      target: { value: 'This is a test description that meets the minimum length requirement for validation.' }
    })

    // Submit form
    const submitButton = screen.getByText('Get AI Prediction')
    fireEvent.click(submitButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Prediction Failed')).toBeInTheDocument()
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })

  test('displays helpful placeholder text', () => {
    renderWithQueryClient(
      <PitchForm
        onPredictionSuccess={mockOnPredictionSuccess}
        walletAddress={mockWalletAddress}
      />
    )

    expect(screen.getByPlaceholderText('Enter your startup\'s pitch title...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Describe your startup, the problem you\'re solving, and your solution...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://docs.yourproject.com/tokenomics')).toBeInTheDocument()
  })
})
