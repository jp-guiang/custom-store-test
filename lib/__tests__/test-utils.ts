// Test utilities for isolating in-memory storage between tests
// Use these in test setup/teardown to ensure test isolation

import { carts, clearCart } from '../cart'

/**
 * Resets all in-memory storage for test isolation
 * Call this in beforeEach() or afterEach() in your tests
 * 
 * Note: For POC, we can only reset carts directly.
 * In production with database, use proper test database isolation.
 */
export function resetAllStorage() {
  // Clear all carts
  carts.clear()
  
  // Note: orders, userBalances, and inventory Maps are not exported
  // In production, these would be in a database and you'd use test DB isolation
  // For POC, you may need to add export functions to reset these if needed
}

/**
 * Resets cart storage only
 */
export function resetCartStorage() {
  carts.clear()
}

/**
 * Clears a specific cart by ID
 */
export function clearCartById(cartId: string) {
  clearCart(cartId)
}

/**
 * Gets all cart IDs (for testing)
 */
export function getAllCartIds(): string[] {
  return Array.from(carts.keys())
}

