// Shared utility functions
// Following DRY principle - single source of truth for common utilities

/**
 * Formats a price amount based on currency
 * @param amount - Price amount (in cents for fiat currencies)
 * @param currency - Currency code (e.g., 'usd', 'dust')
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency: string): string {
  if (currency === 'dust') {
    return `${amount.toLocaleString()} ⚡ Dust`
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

/**
 * Formats price for display in cart (shorter format)
 * @param amount - Price amount
 * @param currency - Currency code
 * @returns Formatted price string (without "Dust" suffix for dust)
 */
export function formatPriceShort(amount: number, currency: string): string {
  if (currency === 'dust') {
    return `${amount.toLocaleString()} ⚡`
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

/**
 * Clamps a number between min and max values
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Generates a unique ID with optional prefix
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function generateId(prefix?: string): string {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  return prefix ? `${prefix}_${id}` : id
}

