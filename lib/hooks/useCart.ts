// Custom React hooks for cart operations
// Following DRY principle - reusable cart logic

import { useState, useEffect, useCallback } from 'react'
import { cartApi, dispatchCartUpdate } from '@/lib/api-client'
import type { Cart, CartItem } from '@/lib/types'

/**
 * Hook for managing cart state and operations
 * Following Single Responsibility Principle - handles only cart state
 */
export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCart = useCallback(async () => {
    try {
      const data = await cartApi.get()
      setCart(data.cart || null)
    } catch (error) {
      console.error('Error fetching cart:', error)
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCart()

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCart()
    }
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [fetchCart])

  const addToCart = useCallback(async (
    productId: string,
    variantId: string,
    title: string,
    price: { amount: number; currency_code: string },
    quantity: number
  ) => {
    try {
      await cartApi.add({
        productId,
        variantId,
        title,
        price,
        quantity,
      })
      dispatchCartUpdate()
      await fetchCart()
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }, [fetchCart])

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      await cartApi.update(itemId, quantity)
      dispatchCartUpdate()
      await fetchCart()
    } catch (error) {
      console.error('Error updating quantity:', error)
      throw error
    }
  }, [fetchCart])

  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      await cartApi.remove(itemId)
      dispatchCartUpdate()
      await fetchCart()
    } catch (error) {
      console.error('Error removing from cart:', error)
      throw error
    }
  }, [fetchCart])

  return {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    refreshCart: fetchCart,
  }
}

/**
 * Hook for getting a specific cart item by product title
 */
export function useCartItem(productTitle: string | null) {
  const { cart } = useCart()
  const [cartItem, setCartItem] = useState<CartItem | null>(null)

  useEffect(() => {
    if (!cart || !productTitle) {
      setCartItem(null)
      return
    }

    const item = cart.items.find((item) => item.title === productTitle)
    setCartItem(item || null)
  }, [cart, productTitle])

  return cartItem
}

