// Embedded Medusa Modules Initialization
// This initializes Medusa modules directly in Next.js (no separate backend needed)

import { loadModules } from "@medusajs/modules-sdk"
import { Modules } from "@medusajs/utils"
import { createContainer } from "awilix"
import type { MedusaContainer } from "@medusajs/types"

let medusaApp: Awaited<ReturnType<typeof loadModules>> | null = null
let container: MedusaContainer | null = null

/**
 * Initialize Medusa modules
 * For POC: Uses in-memory storage
 * For Production: Configure database connection
 */
export async function initializeMedusaModules() {
  if (medusaApp && container) {
    return { medusaApp, container }
  }

  try {
    // Create shared container
    const sharedContainer = createContainer() as MedusaContainer
    
    // Load modules
    medusaApp = await loadModules({
      modulesConfig: {
        [Modules.PRODUCT]: {
          resolve: "@medusajs/product",
          options: {
            // For POC: in-memory storage
            // For production: add database config
          },
        },
        [Modules.PRICING]: {
          resolve: "@medusajs/pricing",
          options: {},
        },
        [Modules.CURRENCY]: {
          resolve: "@medusajs/currency",
          options: {},
        },
        [Modules.INVENTORY]: {
          resolve: "@medusajs/inventory",
          options: {
            // For POC: in-memory storage
            // For production: add database config
          },
        },
      },
      sharedContainer,
      sharedResourcesConfig: {
        // Database config would go here for production
      },
    })

    container = sharedContainer

    return { medusaApp, container }
  } catch (error) {
    console.error("Failed to initialize Medusa modules:", error)
    throw error
  }
}

/**
 * Get initialized Medusa container
 * Initializes if not already initialized
 */
export async function getMedusaContainer(): Promise<MedusaContainer> {
  if (!container) {
    await initializeMedusaModules()
  }
  if (!container) {
    throw new Error("Failed to initialize Medusa container")
  }
  return container
}

/**
 * Get Product Module service
 */
export async function getProductModule() {
  const { medusaApp } = await initializeMedusaModules()
  if (!medusaApp?.modules[Modules.PRODUCT]) {
    throw new Error("Product module not initialized")
  }
  const productModule = Array.isArray(medusaApp.modules[Modules.PRODUCT])
    ? medusaApp.modules[Modules.PRODUCT][0]
    : medusaApp.modules[Modules.PRODUCT]
  return productModule
}

/**
 * Get Inventory Module service
 */
export async function getInventoryModule() {
  const { medusaApp } = await initializeMedusaModules()
  if (!medusaApp?.modules[Modules.INVENTORY]) {
    throw new Error("Inventory module not initialized")
  }
  const inventoryModule = Array.isArray(medusaApp.modules[Modules.INVENTORY])
    ? medusaApp.modules[Modules.INVENTORY][0]
    : medusaApp.modules[Modules.INVENTORY]
  return inventoryModule
}

/**
 * Get Pricing Module service
 */
export async function getPricingModule() {
  const { medusaApp } = await initializeMedusaModules()
  if (!medusaApp?.modules[Modules.PRICING]) {
    throw new Error("Pricing module not initialized")
  }
  const pricingModule = Array.isArray(medusaApp.modules[Modules.PRICING])
    ? medusaApp.modules[Modules.PRICING][0]
    : medusaApp.modules[Modules.PRICING]
  return pricingModule
}

/**
 * Get Currency Module service
 */
export async function getCurrencyModule() {
  const { medusaApp } = await initializeMedusaModules()
  if (!medusaApp?.modules[Modules.CURRENCY]) {
    throw new Error("Currency module not initialized")
  }
  const currencyModule = Array.isArray(medusaApp.modules[Modules.CURRENCY])
    ? medusaApp.modules[Modules.CURRENCY][0]
    : medusaApp.modules[Modules.CURRENCY]
  return currencyModule
}

