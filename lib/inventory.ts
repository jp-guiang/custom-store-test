// Inventory management for POC
// In production, this would use Medusa's Inventory Module

interface InventoryItem {
  variantId: string
  sku: string
  quantity: number
  reservedQuantity?: number
}

// In-memory inventory storage for POC
// In production, this would be in database via Medusa Inventory Module
const inventory: Map<string, InventoryItem> = new Map()

// Initialize inventory from products
export function initializeInventory(products: Array<{
  id: string
  variants: Array<{
    id: string
    sku: string
    inventory_quantity: number
  }>
}>) {
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
}

export function getInventory(variantId: string): InventoryItem | null {
  return inventory.get(variantId) || null
}

export function checkAvailability(variantId: string, requestedQuantity: number): boolean {
  const item = inventory.get(variantId)
  if (!item) return false
  
  const availableQuantity = item.quantity - (item.reservedQuantity || 0)
  return availableQuantity >= requestedQuantity
}

export function reserveInventory(variantId: string, quantity: number): boolean {
  const item = inventory.get(variantId)
  if (!item) return false
  
  if (!checkAvailability(variantId, quantity)) {
    return false
  }
  
  item.reservedQuantity = (item.reservedQuantity || 0) + quantity
  inventory.set(variantId, item)
  return true
}

export function releaseInventory(variantId: string, quantity: number): void {
  const item = inventory.get(variantId)
  if (!item) return
  
  item.reservedQuantity = Math.max(0, (item.reservedQuantity || 0) - quantity)
  inventory.set(variantId, item)
}

export function fulfillInventory(variantId: string, quantity: number): boolean {
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

export function getAvailableQuantity(variantId: string): number {
  const item = inventory.get(variantId)
  if (!item) return 0
  
  return item.quantity - (item.reservedQuantity || 0)
}

