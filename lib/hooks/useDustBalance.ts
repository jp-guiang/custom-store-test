// Custom React hook for dust balance
// Following DRY principle - reusable dust balance logic

import { useState, useEffect } from 'react'
import { dustBalanceApi } from '@/lib/api-client'

/**
 * Hook for managing dust balance state
 * Following Single Responsibility Principle - handles only dust balance
 */
export function useDustBalance() {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBalance() {
      try {
        const data = await dustBalanceApi.get()
        setBalance(data.balance || 0)
      } catch (error) {
        console.error('Error fetching dust balance:', error)
        setBalance(0)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [])

  return { balance, loading }
}

