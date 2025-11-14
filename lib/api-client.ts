// API client utilities
// Following DRY principle - centralized API call logic

import type { Cart, Product } from './types'

/**
 * Default fetch options for API calls
 */
const DEFAULT_FETCH_OPTIONS: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
}

/**
 * Makes an API call with consistent error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    ...DEFAULT_FETCH_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_FETCH_OPTIONS.headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API call failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Cart API operations
 */
export const cartApi = {
  /**
   * Fetches the current cart
   */
  async get(): Promise<{ cart: Cart | null }> {
    return apiCall<{ cart: Cart | null }>('/api/cart', {
      method: 'GET',
      cache: 'no-store',
    })
  },

  /**
   * Adds an item to the cart
   */
  async add(params: {
    productId: string
    variantId: string
    title: string
    price: { amount: number; currency_code: string }
    quantity: number
  }): Promise<{ cart: Cart }> {
    return apiCall<{ cart: Cart }>('/api/cart', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add',
        ...params,
      }),
    })
  },

  /**
   * Updates cart item quantity
   */
  async update(itemId: string, quantity: number): Promise<{ cart: Cart }> {
    return apiCall<{ cart: Cart }>('/api/cart', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update',
        itemId,
        quantity,
      }),
    })
  },

  /**
   * Removes an item from the cart
   */
  async remove(itemId: string): Promise<{ cart: Cart }> {
    return apiCall<{ cart: Cart }>('/api/cart', {
      method: 'POST',
      body: JSON.stringify({
        action: 'remove',
        itemId,
      }),
    })
  },
}

/**
 * Products API operations
 */
export const productsApi = {
  /**
   * Fetches all products
   */
  async getAll(): Promise<{ products: Product[] }> {
    return apiCall<{ products: Product[] }>('/api/products')
  },
}

/**
 * Dust balance API operations
 */
export const dustBalanceApi = {
  /**
   * Fetches user's dust balance
   */
  async get(): Promise<{ balance: number }> {
    return apiCall<{ balance: number }>('/api/dust-balance')
  },
}

/**
 * Dispatches cart update event
 * Following DRY - single function for cart update notifications
 * Note: Only works in browser environment (client-side)
 */
export function dispatchCartUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cartUpdated'))
  }
}

