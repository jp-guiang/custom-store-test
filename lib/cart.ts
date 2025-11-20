// In-memory cart storage for POC
// In production, this would be stored in database or Redis

import type { Cart, CartItem, Price } from './types'
import { CURRENCY_CODES } from './constants'
import { generateId } from './utils'

/**
 * Cart calculation utilities
 * Following Single Responsibility Principle - handles only cart calculations
 * Exported for testing purposes
 */

/**
 * Calculates the total price of cart items
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + item.price.amount * item.quantity
  }, 0)
}

/**
 * Determines the cart currency based on items
 * Returns 'mixed' if multiple currencies are present
 * Normalizes XPF to 'dust' for consistency
 */
export function determineCartCurrency(items: CartItem[]): string {
  if (items.length === 0) {
    return CURRENCY_CODES.USD
  }

  // Normalize XPF to dust for currency determination
  const normalizedCurrencies = items.map(item => {
    const currency = item.price.currency_code
    return currency === 'xpf' ? 'dust' : currency
  })
  
  const currencies = Array.from(new Set(normalizedCurrencies))
  
  if (currencies.length > 1) {
    return CURRENCY_CODES.MIXED
  }
  
  return currencies[0] || CURRENCY_CODES.USD
}

/**
 * Recalculates cart totals and currency
 * Following DRY principle - single method for recalculation
 */
export function recalculateCart(cart: Cart): Cart {
  cart.total = calculateCartTotal(cart.items)
  cart.currency = determineCartCurrency(cart.items)
  return cart
}

// Simple in-memory storage
// Export for debugging (POC only - remove in production)
export const carts: Map<string, Cart> = new Map()

export function getOrCreateCart(cartId?: string): Cart {
  if (cartId && carts.has(cartId)) {
    const cart = carts.get(cartId)
    if (cart) {
      return cart
    }
  }

  const newCart: Cart = {
    id: cartId || generateId('cart'),
    items: [],
    total: 0,
    currency: CURRENCY_CODES.USD,
  }

  carts.set(newCart.id, newCart)
  return newCart
}

export function addToCart(
  cartId: string,
  productId: string,
  variantId: string,
  title: string,
  price: Price,
  quantity: number = 1
): Cart {
  const cart = getOrCreateCart(cartId)

  // Check if adding a dust product to a cart with fiat products (or vice versa)
  const isDustProduct = price.currency_code === 'dust' || price.currency_code === 'xpf'
  const hasFiatItems = cart.items.some(item => 
    item.price.currency_code !== 'dust' && item.price.currency_code !== 'xpf'
  )
  const hasDustItems = cart.items.some(item => 
    item.price.currency_code === 'dust' || item.price.currency_code === 'xpf'
  )

  // Prevent mixing dust and fiat products
  if (isDustProduct && hasFiatItems) {
    throw new Error('Cannot add dust products to a cart with regular products. Please checkout your current cart first.')
  }
  if (!isDustProduct && hasDustItems) {
    throw new Error('Cannot add regular products to a cart with dust products. Please checkout your current cart first.')
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.variantId === variantId
  )

  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity += quantity
  } else {
    cart.items.push({
      id: generateId('item'),
      productId,
      variantId,
      title,
      quantity,
      price,
    })
  }

  recalculateCart(cart)
  carts.set(cartId, cart)
  return cart
}

export function removeFromCart(cartId: string, itemId: string): Cart {
  const cart = getOrCreateCart(cartId)
  cart.items = cart.items.filter((item) => item.id !== itemId)

  recalculateCart(cart)
  carts.set(cartId, cart)
  return cart
}

export function updateCartItemQuantity(
  cartId: string,
  itemId: string,
  quantity: number
): Cart {
  const cart = getOrCreateCart(cartId)
  const item = cart.items.find((item) => item.id === itemId)

  if (item) {
    if (quantity <= 0) {
      return removeFromCart(cartId, itemId)
    }
    item.quantity = quantity
  }

  recalculateCart(cart)
  carts.set(cartId, cart)
  return cart
}

export function getCart(cartId: string): Cart | null {
  return carts.get(cartId) || null
}

export function clearCart(cartId: string): void {
  carts.delete(cartId)
}

/**
 * Checks if cart has mixed currencies
 */
export function hasMixedCurrencies(cart: Cart): boolean {
  return cart.currency === CURRENCY_CODES.MIXED
}

/**
 * Gets unique currencies from cart items
 */
export function getCartCurrencies(cart: Cart): string[] {
  return Array.from(new Set(cart.items.map(item => item.price.currency_code)))
}

