'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Cart, CartItem } from '@/lib/types'
import { formatPriceShort } from '@/lib/utils'
import { CURRENCY_CODES } from '@/lib/constants'

export default function CartIcon() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCart()
    
    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      fetchCart()
    }
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    // Refresh cart every 2 seconds when dropdown is open
    const interval = setInterval(() => {
      if (isOpen) {
        fetchCart()
      }
    }, 2000)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchCart() {
    try {
      const res = await fetch('/api/cart', { cache: 'no-store' })
      const data = await res.json()
      if (data.cart) {
        setCart(data.cart)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }

  async function handleRemoveFromCart(itemId: string) {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', itemId }),
      })
      const data = await res.json()
      setCart(data.cart)
    } catch (error) {
      console.error('Error removing from cart:', error)
    }
  }

  function handleProceedToCheckout() {
    if (!cart || cart.items.length === 0) return
    
    // Check for mixed currencies
    if (cart.currency === CURRENCY_CODES.MIXED) {
      alert('Cannot checkout with mixed currencies. Please checkout fiat and dust products separately.')
      return
    }
    
    setIsOpen(false)
    router.push('/checkout')
  }

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0
  const hasItems = itemCount > 0

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
        aria-label="Shopping cart"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {hasItems && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Shopping Cart</h3>
          </div>

          {!hasItems ? (
            <div className="p-8 text-center text-gray-500">
              <p>Your cart is empty</p>
              <Link
                href="/products"
                onClick={() => setIsOpen(false)}
                className="mt-4 inline-block text-blue-600 hover:text-blue-800"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              {/* Mixed currency warning */}
              {cart.currency === CURRENCY_CODES.MIXED && (
                <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Mixed currencies detected. Please checkout separately.
                  </p>
                </div>
              )}

              {/* Cart items - scrollable */}
              <div className="max-h-96 overflow-y-auto">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border-b hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatPriceShort(item.price.amount, item.price.currency_code)} ×{' '}
                          {item.quantity}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="ml-4 text-red-600 hover:text-red-800 text-sm"
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart total and checkout */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="text-lg font-bold">
                    {cart.currency === CURRENCY_CODES.MIXED
                      ? 'Mixed Currencies'
                      : formatPriceShort(cart.total, cart.currency)}
                  </span>
                </div>
                <button
                  onClick={handleProceedToCheckout}
                  disabled={cart.currency === CURRENCY_CODES.MIXED}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cart.currency === CURRENCY_CODES.MIXED
                    ? 'Cannot Checkout Mixed Currencies'
                    : 'Proceed to Checkout'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

