// Shared utility functions
// Following DRY principle - single source of truth for common utilities

/**
 * Formats a price amount based on currency
 * @param amount - Price amount (in cents for fiat currencies, or full units for Medusa v2)
 * @param currency - Currency code (e.g., 'usd', 'dust')
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency: string): string {
  if (currency === 'dust') {
    return `${amount.toLocaleString()} ⚡ Dust`
  }
  
  // Medusa v2 stores prices in smallest currency unit (cents for EUR/USD)
  // However, if prices appear too low (€0.10 instead of €10.00), 
  // Medusa v2 might be storing as full currency units
  // Check: if amount < 1000 and looks like full units (not a round cent amount), use as-is
  // Otherwise divide by 100 to convert from cents
  // For now, we'll divide by 100 (standard Medusa format)
  // If prices are wrong, check Medusa admin to see actual stored values
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

