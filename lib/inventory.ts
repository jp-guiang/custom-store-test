// Inventory management using embedded Medusa Inventory Module
// Falls back to in-memory storage if database/module not available

import { getInventoryModule } from './medusa-modules'

const DEFAULT_LOCATION_ID = 'default_location'

// Fallback: In-memory inventory storage (used if Medusa module not available)
interface InventoryItem {
  variantId: string
  sku: string
  quantity: number
  reservedQuantity?: number
}
const inventory: Map<string, InventoryItem> = new Map()

// Initialize inventory from products using Medusa Inventory Module
export async function initializeInventory(products: Array<{
  id: string
  variants: Array<{
    id: string
    sku: string
    inventory_quantity: number
  }>
}>) {
  try {
    // Try to use embedded Medusa Inventory Module
    const inventoryModule = await getInventoryModule()
    
    // Create default location if it doesn't exist
    try {
      await inventoryModule.createInventoryLocations([{
        id: DEFAULT_LOCATION_ID,
        name: 'Default Warehouse',
      }])
    } catch (error: any) {
      // Location might already exist, that's fine - ignore error
    }
    
    // Create inventory items for each product variant
    for (const product of products) {
      for (const variant of product.variants) {
        try {
          // Check if inventory item already exists
          const existing = await inventoryModule.listInventoryItems({
            sku: variant.sku,
          })
          
          if (existing.length === 0) {
            // Create inventory item
            const [item] = await inventoryModule.createInventoryItems([{
              sku: variant.sku,
              origin_country: 'US',
            }])
            
            // Set stock level
            await inventoryModule.createInventoryLevels([{
              inventory_item_id: item.id,
              location_id: DEFAULT_LOCATION_ID,
              stocked_quantity: variant.inventory_quantity,
              reserved_quantity: 0,
            }])
          } else {
            // Update existing inventory level if needed
            const levels = await inventoryModule.listInventoryLevels({
              inventory_item_id: existing[0].id,
              location_id: DEFAULT_LOCATION_ID,
            })
            
            if (levels.length === 0) {
              // Create level if it doesn't exist
              await inventoryModule.createInventoryLevels([{
                inventory_item_id: existing[0].id,
                location_id: DEFAULT_LOCATION_ID,
                stocked_quantity: variant.inventory_quantity,
                reserved_quantity: 0,
              }])
            }
          }
        } catch (error) {
          // Failed to create inventory item - continue with next variant
        }
      }
    }
    
    // Return all inventory items
    const allItems = await inventoryModule.listInventoryItems({})
    return allItems
  } catch (error) {
    // Fallback to in-memory storage
    
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
}

export async function getInventory(variantId: string, sku: string) {
  try {
    const inventoryModule = await getInventoryModule()
    const items = await inventoryModule.listInventoryItems({ sku })
    if (items.length === 0) return null
    
    const levels = await inventoryModule.listInventoryLevels({
      inventory_item_id: items[0].id,
      location_id: DEFAULT_LOCATION_ID,
    })
    
    return {
      variantId,
      sku,
      quantity: levels[0]?.stocked_quantity || 0,
      reservedQuantity: levels[0]?.reserved_quantity || 0,
    }
  } catch (error) {
    // Fallback to in-memory
    return inventory.get(variantId) || null
  }
}

export async function checkAvailability(variantId: string, sku: string, requestedQuantity: number): Promise<boolean> {
  try {
    const inventoryModule = await getInventoryModule()
    const items = await inventoryModule.listInventoryItems({ sku })
    if (items.length === 0) return false
    
    const levels = await inventoryModule.listInventoryLevels({
      inventory_item_id: items[0].id,
      location_id: DEFAULT_LOCATION_ID,
    })
    
    if (levels.length === 0) return false
    
    const available = levels[0].stocked_quantity - levels[0].reserved_quantity
    return available >= requestedQuantity
  } catch (error) {
    // Fallback to in-memory
    const item = inventory.get(variantId)
    if (!item) return false
    const availableQuantity = item.quantity - (item.reservedQuantity || 0)
    return availableQuantity >= requestedQuantity
  }
}

export async function reserveInventory(variantId: string, sku: string, quantity: number): Promise<boolean> {
  try {
    const inventoryModule = await getInventoryModule()
    
    if (!(await checkAvailability(variantId, sku, quantity))) {
      return false
    }
    
    const items = await inventoryModule.listInventoryItems({ sku })
    if (items.length === 0) return false
    
    await inventoryModule.reserveItems([{
      line_item_id: variantId,
      inventory_item_id: items[0].id,
      location_id: DEFAULT_LOCATION_ID,
      quantity,
    }])
    
    return true
  } catch (error) {
    // Fallback to in-memory
    const item = inventory.get(variantId)
    if (!item) return false
    
    if (!(await checkAvailability(variantId, sku, quantity))) {
      return false
    }
    
    item.reservedQuantity = (item.reservedQuantity || 0) + quantity
    inventory.set(variantId, item)
    return true
  }
}

export async function releaseInventory(variantId: string, sku: string, quantity: number): Promise<void> {
  try {
    const inventoryModule = await getInventoryModule()
    const items = await inventoryModule.listInventoryItems({ sku })
    if (items.length === 0) return
    
    await inventoryModule.releaseReservationsByLineItem([variantId])
  } catch (error) {
    // Fallback to in-memory
    const item = inventory.get(variantId)
    if (!item) return
    item.reservedQuantity = Math.max(0, (item.reservedQuantity || 0) - quantity)
    inventory.set(variantId, item)
  }
}

export async function fulfillInventory(variantId: string, sku: string, quantity: number): Promise<boolean> {
  try {
    const inventoryModule = await getInventoryModule()
    const items = await inventoryModule.listInventoryItems({ sku })
    if (items.length === 0) return false
    
    const levels = await inventoryModule.listInventoryLevels({
      inventory_item_id: items[0].id,
      location_id: DEFAULT_LOCATION_ID,
    })
    
    if (levels.length === 0 || levels[0].stocked_quantity < quantity) {
      return false
    }
    
    await inventoryModule.adjustInventoryLevels([{
      inventory_item_id: items[0].id,
      location_id: DEFAULT_LOCATION_ID,
      adjustment: -quantity,
    }])
    
    await inventoryModule.releaseReservationsByLineItem([variantId])
    
    return true
  } catch (error) {
    // Fallback to in-memory
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
}

export async function getAvailableQuantity(variantId: string, sku: string): Promise<number> {
  try {
    const inventoryModule = await getInventoryModule()
    const items = await inventoryModule.listInventoryItems({ sku })
    if (items.length === 0) return 0
    
    const levels = await inventoryModule.listInventoryLevels({
      inventory_item_id: items[0].id,
      location_id: DEFAULT_LOCATION_ID,
    })
    
    if (levels.length === 0) return 0
    
    return levels[0].stocked_quantity - levels[0].reserved_quantity
  } catch (error) {
    // Fallback to in-memory
    const item = inventory.get(variantId)
    if (!item) return 0
    return item.quantity - (item.reservedQuantity || 0)
  }
}

