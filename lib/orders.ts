// Order management for POC
// In production, this would use Medusa Order Module

import type { Order, OrderItem, CustomerDetails, ShippingAddress, OrderTracking } from './types'
import { generateId } from './utils'

// In-memory order storage for POC
const orders: Map<string, Order> = new Map()

export function createOrder(
  userId: string,
  items: OrderItem[],
  total: number,
  currency: string,
  paymentMethod: 'dust' | 'fiat',
  transactionId?: string,
  customer?: CustomerDetails,
  shippingAddress?: ShippingAddress
): Order {
  const now = new Date().toISOString()
  const order: Order = {
    id: generateId('order'),
    userId,
    items,
    total,
    currency,
    status: 'confirmed',
    paymentMethod,
    transactionId,
    customer,
    shippingAddress,
    createdAt: now,
    updatedAt: now,
  }

  orders.set(order.id, order)
  return order
}

export function getOrder(orderId: string): Order | null {
  return orders.get(orderId) || null
}

export function getUserOrders(userId: string): Order[] {
  return Array.from(orders.values()).filter(
    (order) => order.userId === userId
  )
}

export function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Order | null {
  const order = orders.get(orderId)
  if (!order) return null

  order.status = status
  order.updatedAt = new Date().toISOString()
  orders.set(orderId, order)

  return order
}

export function updateOrderTracking(
  orderId: string,
  tracking: OrderTracking
): Order | null {
  const order = orders.get(orderId)
  if (!order) return null

  order.tracking = { ...order.tracking, ...tracking }
  order.updatedAt = new Date().toISOString()
  
  // Auto-update status based on tracking
  if (tracking.shippedAt && !order.tracking?.shippedAt) {
    order.status = 'shipped'
  }
  if (tracking.deliveredAt) {
    order.status = 'delivered'
  }
  
  orders.set(orderId, order)
  return order
}

