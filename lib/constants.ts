// Shared constants across the application
// Following DRY principle - single source of truth for constants

export const TEST_USER_ID = 'user_test_1'

export const CART_COOKIE_NAME = 'cart_id'
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export const DEFAULT_DUST_BALANCE = 50000

export const MIN_QUANTITY = 1
export const MAX_QUANTITY = 99

export const CURRENCY_CODES = {
  USD: 'usd',
  DUST: 'dust',
  MIXED: 'mixed',
} as const

export const PAYMENT_METHODS = {
  DUST: 'dust',
  FIAT: 'fiat',
} as const

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

