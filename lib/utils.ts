// Shared utility functions
// Following DRY principle - single source of truth for common utilities

/**
 * Formats a price amount based on currency
 * @param amount - Price amount (in cents for fiat currencies, or full units for Medusa v2)
 * @param currency - Currency code (e.g., 'usd', 'dust', 'xpf')
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency: string): string {
  // Dust currency - display as dust points
  if (currency === 'dust' || currency === 'xpf') {
    // Dust prices are stored as full units (e.g., 1000 = 1000 dust)
    // No need to divide by 100 like fiat currencies
    return `${amount.toLocaleString()} ⚡ Dust`
  }
  
  // Medusa v2 stores prices in smallest currency unit (cents for EUR/USD)
  const displayAmount = amount / 100
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(displayAmount)
}

/**
 * Formats price for display in cart (shorter format)
 * @param amount - Price amount
 * @param currency - Currency code
 * @returns Formatted price string (without "Dust" suffix for dust)
 */
export function formatPriceShort(amount: number, currency: string): string {
  // XPF is used as dust currency in Medusa backend
  if (currency === 'dust' || currency === 'xpf') {
    // XPF amounts: if >= 1000, likely in cents (divide by 100)
    // Otherwise, treat as full units
    const displayAmount = amount >= 1000 ? amount / 100 : amount
    return `${displayAmount.toLocaleString()} ⚡`
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

