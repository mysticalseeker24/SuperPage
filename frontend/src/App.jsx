import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Router from './components/Router'
import WalletGate from './components/WalletGate'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000, // React Query v5 uses gcTime instead of cacheTime
    },
  },
})

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletGate>
        <Router />
      </WalletGate>
    </QueryClientProvider>
  )
}

export default App
