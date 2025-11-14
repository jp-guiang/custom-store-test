// Checkout service - handles order creation logic
// Following Single Responsibility Principle - separates order creation from payment processing

import type { Cart, OrderItem, CustomerDetails, ShippingAddress } from '../types'
import { createOrder } from '../orders'
import { TEST_USER_ID } from '../constants'
import { generateId } from '../utils'

/**
 * Service for creating orders from cart
 * Separates order creation logic from payment processing
 */
export class CheckoutService {
  /**
   * Converts cart items to order items
   */
  static cartItemsToOrderItems(cart: Cart): OrderItem[] {
    return cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
    }))
  }

  /**
   * Creates an order from cart
   */
  static createOrderFromCart(
    cart: Cart,
    paymentMethod: 'dust' | 'fiat',
    transactionId?: string,
    customer?: CustomerDetails,
    shippingAddress?: ShippingAddress
  ) {
    const orderItems = this.cartItemsToOrderItems(cart)
    
    return createOrder(
      TEST_USER_ID,
      orderItems,
      cart.total,
      cart.currency,
      paymentMethod,
      transactionId || generateId('fiat_tx'),
      customer,
      shippingAddress
    )
  }
}

