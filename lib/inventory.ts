// Inventory management for POC
// Simple in-memory storage (no database needed)
// When database is ready, we'll switch to embedded Medusa Inventory Module

interface InventoryItem {
  variantId: string
  sku: string
  quantity: number
  reservedQuantity?: number
}

// In-memory inventory storage for POC
const inventory: Map<string, InventoryItem> = new Map()

// Initialize inventory from products (simple in-memory)
export async function initializeInventory(products: Array<{
  id: string
  variants: Array<{
    id: string
    sku: string
    inventory_quantity: number
  }>
}>) {
  // Simple in-memory initialization
  products.forEach(product => {
    product.variants.forEach(variant => {
      inventory.set(variant.id, {
        variantId: variant.id,
        sku: variant.sku,
        quantity: variant.inventory_quantity,
        reservedQuantity: 0,
      })
    })
  })
  
  return Array.from(inventory.values())
}

export function getInventory(variantId: string, sku: string) {
  return inventory.get(variantId) || null
}

export function checkAvailability(variantId: string, sku: string, requestedQuantity: number): boolean {
  const item = inventory.get(variantId)
  if (!item) return false
  
  const availableQuantity = item.quantity - (item.reservedQuantity || 0)
  return availableQuantity >= requestedQuantity
}

export function reserveInventory(variantId: string, sku: string, quantity: number): boolean {
  const item = inventory.get(variantId)
  if (!item) return false
  
  if (!checkAvailability(variantId, sku, quantity)) {
    return false
  }
  
  item.reservedQuantity = (item.reservedQuantity || 0) + quantity
  inventory.set(variantId, item)
  return true
}

export function releaseInventory(variantId: string, sku: string, quantity: number): void {
  const item = inventory.get(variantId)
  if (!item) return
  
  item.reservedQuantity = Math.max(0, (item.reservedQuantity || 0) - quantity)
  inventory.set(variantId, item)
}

export function fulfillInventory(variantId: string, sku: string, quantity: number): boolean {
  const item = inventory.get(variantId)
  if (!item) return false
  
  if (item.quantity < quantity) {
    return false
  }
  
  item.quantity -= quantity
  item.reservedQuantity = Math.max(0, (item.reservedQuantity || 0) - quantity)
  inventory.set(variantId, item)
  return true
}

export function getAvailableQuantity(variantId: string, sku: string): number {
  const item = inventory.get(variantId)
  if (!item) return 0
  
  return item.quantity - (item.reservedQuantity || 0)
}

