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
 * Uses PostgreSQL database if DATABASE_URL is set, otherwise falls back to in-memory storage
 * Migrations are handled automatically when database is configured
 */
export async function initializeMedusaModules() {
  if (medusaApp && container) {
    return { medusaApp, container }
  }

  try {
    // Create shared container
    const sharedContainer = createContainer() as MedusaContainer
    
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL
    
    // DATABASE_URL not set - modules will use in-memory storage

    // Load modules
    medusaApp = await loadModules({
      modulesConfig: {
        [Modules.PRODUCT]: {
          resolve: "@medusajs/product",
          options: databaseUrl ? {
            database: {
              clientUrl: databaseUrl,
              schema: "public",
            },
          } : {},
        },
        [Modules.PRICING]: {
          resolve: "@medusajs/pricing",
          options: databaseUrl ? {
            database: {
              clientUrl: databaseUrl,
              schema: "public",
            },
          } : {},
        },
        [Modules.CURRENCY]: {
          resolve: "@medusajs/currency",
          options: databaseUrl ? {
            database: {
              clientUrl: databaseUrl,
              schema: "public",
            },
          } : {},
        },
        [Modules.INVENTORY]: {
          resolve: "@medusajs/inventory",
          options: databaseUrl ? {
            database: {
              clientUrl: databaseUrl,
              schema: "public",
            },
          } : {},
        },
      },
      sharedContainer,
      sharedResourcesConfig: databaseUrl ? {
        database: {
          clientUrl: databaseUrl,
          schema: "public",
        },
      } : {},
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
  if (!medusaApp) {
    throw new Error("Medusa app not initialized")
  }
  
  // Access module service via container
  const productModule = container?.resolve(Modules.PRODUCT)
  if (!productModule) {
    throw new Error("Product module not initialized")
  }
  return productModule
}

/**
 * Get Inventory Module service
 */
export async function getInventoryModule() {
  await initializeMedusaModules()
  if (!container) {
    throw new Error("Medusa container not initialized")
  }
  
  const inventoryModule = container.resolve(Modules.INVENTORY)
  if (!inventoryModule) {
    throw new Error("Inventory module not initialized")
  }
  return inventoryModule
}

/**
 * Get Pricing Module service
 */
export async function getPricingModule() {
  await initializeMedusaModules()
  if (!container) {
    throw new Error("Medusa container not initialized")
  }
  
  const pricingModule = container.resolve(Modules.PRICING)
  if (!pricingModule) {
    throw new Error("Pricing module not initialized")
  }
  return pricingModule
}

/**
 * Get Currency Module service
 */
export async function getCurrencyModule() {
  await initializeMedusaModules()
  if (!container) {
    throw new Error("Medusa container not initialized")
  }
  
  const currencyModule = container.resolve(Modules.CURRENCY)
  if (!currencyModule) {
    throw new Error("Currency module not initialized")
  }
  return currencyModule
}

