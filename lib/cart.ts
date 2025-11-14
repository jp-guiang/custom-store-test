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
export class CartCalculator {
  /**
   * Calculates the total price of cart items
   */
  static calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => {
      return sum + item.price.amount * item.quantity
    }, 0)
  }

  /**
   * Determines the cart currency based on items
   * Returns 'mixed' if multiple currencies are present
   */
  static determineCurrency(items: CartItem[]): string {
    if (items.length === 0) {
      return CURRENCY_CODES.USD
    }

    const currencies = [...new Set(items.map(item => item.price.currency_code))]
    
    if (currencies.length > 1) {
      return CURRENCY_CODES.MIXED
    }
    
    return currencies[0] || CURRENCY_CODES.USD
  }

  /**
   * Recalculates cart totals and currency
   * Following DRY principle - single method for recalculation
   */
  static recalculate(cart: Cart): Cart {
    cart.total = this.calculateTotal(cart.items)
    cart.currency = this.determineCurrency(cart.items)
    return cart
  }
}

// Simple in-memory storage
// Export for debugging (POC only - remove in production)
export const carts: Map<string, Cart> = new Map()

export function getOrCreateCart(cartId?: string): Cart {
  if (cartId && carts.has(cartId)) {
    return carts.get(cartId)!
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

  CartCalculator.recalculate(cart)
  carts.set(cartId, cart)
  return cart
}

export function removeFromCart(cartId: string, itemId: string): Cart {
  const cart = getOrCreateCart(cartId)
  cart.items = cart.items.filter((item) => item.id !== itemId)

  CartCalculator.recalculate(cart)
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

  CartCalculator.recalculate(cart)
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
  return [...new Set(cart.items.map(item => item.price.currency_code))]
}

