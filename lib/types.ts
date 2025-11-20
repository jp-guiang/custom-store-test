// Shared type definitions across the application
// Following DRY principle - single source of truth for types

export interface Price {
  amount: number
  currency_code: string
}

export interface Product {
  id: string
  title: string
  description: string
  handle: string
  status?: string
  variants: Array<{
    id: string
    title?: string
    sku?: string
    prices: Array<Price & { id?: string }>
    inventory_quantity?: number
  }>
  tags: Array<{ value: string }>
  images?: Array<{ url: string }>
  metadata?: {
    dust_only?: boolean | string | number
    dust_price?: number | string
    [key: string]: any
  }
}

export interface CartItem {
  id: string
  productId: string
  variantId: string
  title: string
  quantity: number
  price: Price
}

export interface Cart {
  id: string
  items: CartItem[]
  total: number
  currency: string
}

export interface CustomerDetails {
  email: string
  firstName: string
  lastName: string
  phone?: string
}

export interface ShippingAddress {
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface OrderItem {
  id: string
  productId: string
  variantId: string
  title: string
  quantity: number
  price: Price
}

export interface OrderTracking {
  trackingNumber?: string
  carrier?: string
  trackingUrl?: string
  estimatedDelivery?: string
  shippedAt?: string
  deliveredAt?: string
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  currency: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
  paymentMethod: 'dust' | 'fiat'
  transactionId?: string
  customer?: CustomerDetails
  shippingAddress?: ShippingAddress
  tracking?: OrderTracking
  createdAt: string
  updatedAt: string
}

