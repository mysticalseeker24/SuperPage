import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import StartupsList from '../StartupsList'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemSize }) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: Math.min(itemCount, 5) }, (_, index) => (
        <div key={index} style={{ height: itemSize }}>
          {children({ index, style: { height: itemSize } })}
        </div>
      ))}
    </div>
  ),
}))

const mockPredictions = [
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
  {
    id: 'project-2',
    projectId: 'startup-002',
    title: 'NFT Marketplace',
    score: 0.45,
    timestamp: '2024-01-14T15:30:00Z',
    teamExperience: 3.2,
    previousFunding: 500000,
    traction: 2500,
    category: 'NFT',
    walletAddress: '0x0987654321098765432109876543210987654321',
  },
]

// Mock the fetch function
global.fetch = vi.fn()

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

describe('StartupsList', () => {
  const mockOnViewDetails = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful API response
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockPredictions,
    })
  })

  test('renders startups list header', async () => {
    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    expect(screen.getByText('Startup Predictions')).toBeInTheDocument()
    expect(screen.getByText('Explore AI-powered fundraising predictions from the community')).toBeInTheDocument()
  })

  test('displays filter controls', async () => {
    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    // Check for search input
    expect(screen.getByPlaceholderText('Search by ID or title...')).toBeInTheDocument()
    
    // Check for score threshold slider
    expect(screen.getByText(/Minimum Success Rate:/)).toBeInTheDocument()
    
    // Check for sort dropdown
    expect(screen.getByDisplayValue('Highest Score')).toBeInTheDocument()
  })

  test('filters predictions by search term', async () => {
    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    // Search for specific startup
    const searchInput = screen.getByPlaceholderText('Search by ID or title...')
    fireEvent.change(searchInput, { target: { value: 'DeFi' } })

    // Should filter results
    await waitFor(() => {
      expect(screen.getByText('DeFi Protocol')).toBeInTheDocument()
    })
  })

  test('filters predictions by score threshold', async () => {
    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    // Set high score threshold
    const scoreSlider = screen.getByRole('slider')
    fireEvent.change(scoreSlider, { target: { value: '70' } })

    // Should show updated threshold
    expect(screen.getByText('Minimum Success Rate: 70%')).toBeInTheDocument()
  })

  test('sorts predictions correctly', async () => {
    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    // Change sort order
    const sortSelect = screen.getByDisplayValue('Highest Score')
    fireEvent.change(sortSelect, { target: { value: 'score-asc' } })

    expect(sortSelect.value).toBe('score-asc')
  })

  test('displays prediction cards with correct data', async () => {
    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('DeFi Protocol')).toBeInTheDocument()
      expect(screen.getByText('startup-001')).toBeInTheDocument()
      expect(screen.getByText('85%')).toBeInTheDocument()
    })
  })

  test('handles view details click', async () => {
    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    // Click view details button
    const viewButton = screen.getAllByText('View Details')[0]
    fireEvent.click(viewButton)

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockPredictions[0])
  })

  test('shows loading state', () => {
    // Mock loading state
    fetch.mockImplementation(() => new Promise(() => {}))

    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    expect(screen.getByText('Loading predictions...')).toBeInTheDocument()
  })

  test('handles error state', async () => {
    // Mock API error
    fetch.mockRejectedValue(new Error('API Error'))

    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Predictions')).toBeInTheDocument()
    })
  })

  test('shows empty state when no predictions match filters', async () => {
    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    // Set very high score threshold
    const scoreSlider = screen.getByRole('slider')
    fireEvent.change(scoreSlider, { target: { value: '95' } })

    // Should show empty state
    await waitFor(() => {
      expect(screen.getByText('No Predictions Found')).toBeInTheDocument()
    })
  })

  test('displays correct prediction count', async () => {
    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 predictions')).toBeInTheDocument()
    })
  })

  test('handles refresh button click', async () => {
    renderWithQueryClient(<StartupsList onViewDetails={mockOnViewDetails} />)

    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)

    // Should call fetch again
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
