# Current State: Embedded Medusa Architecture

## ✅ **YES - We ARE Using Embedded Medusa Architecture**

**But with hardcoded products for now** (no database yet)

### What We're Actually Using Right Now

**Current Implementation:**
- ✅ **Embedded Medusa Modules** - Initialized in `lib/medusa-modules.ts` (Product, Inventory, Pricing, Currency)
- ✅ **Hardcoded Products** - Products are defined in `lib/medusa.ts` as JavaScript objects (temporary, until database)
- ✅ **In-Memory Inventory** - Simple JavaScript `Map` in `lib/inventory.ts` (temporary, until database)
- ✅ **No Database** - Medusa modules require database, so we're using hardcoded fallback for now
- ✅ **Architecture Ready** - When database is added, we'll switch from hardcoded to Medusa modules

### Evidence

**1. Products (`lib/medusa.ts`):**
```typescript
// This function just returns hardcoded products
export async function getProductsFromMedusa() {
  return seedProducts()  // ← Returns hardcoded array, NOT Medusa module
}

// Hardcoded products array
const products = [
  { title: 'Premium T-Shirt', ... },
  { title: 'Wireless Headphones', ... },
  // etc.
]
```

**2. Inventory (`lib/inventory.ts`):**
```typescript
// Simple JavaScript Map - NOT Medusa Inventory Module
const inventory: Map<string, InventoryItem> = new Map()

export function getInventory(variantId: string, sku: string) {
  return inventory.get(variantId) || null  // ← Just Map.get(), not Medusa
}
```

**3. Medusa Modules (`lib/medusa-modules.ts`):**
```typescript
// ✅ Embedded Medusa modules ARE initialized
export async function initializeMedusaModules() {
  medusaApp = await loadModules({
    modulesConfig: {
      [Modules.PRODUCT]: { resolve: "@medusajs/product", ... },
      [Modules.INVENTORY]: { resolve: "@medusajs/inventory", ... },
      // ...
    }
  })
}

// ✅ Functions ready to use (will work once database is added)
export async function getProductModule() { ... }
export async function getInventoryModule() { ... }
```

**Note:** Medusa modules require a database. Without one, they can't store data. So we're using hardcoded products as a temporary solution until database is set up.

**4. API Route (`app/api/products/route.ts`):**
```typescript
// Comments say "embedded Medusa" but actually just calls hardcoded function
const products = await getProductsFromMedusa()  // ← Returns hardcoded products
```

---

## Architecture: Embedded Medusa (With Temporary Fallbacks)

### ✅ **Embedded Medusa Infrastructure (Ready)**
- `lib/medusa-modules.ts` - ✅ Embedded Medusa modules initialized
- Functions: `getProductModule()`, `getInventoryModule()`, etc. - ✅ Ready to use
- All Medusa packages installed: `@medusajs/product`, `@medusajs/inventory`, etc. - ✅ Installed

### ✅ **Temporary Fallbacks (Until Database)**
- `lib/medusa.ts` - Hardcoded products (temporary, until database)
- `lib/inventory.ts` - In-memory Map storage (temporary, until database)

**Why Fallbacks?**
- Medusa modules require PostgreSQL database
- Without database, modules can't persist data
- Hardcoded products allow testing without database setup
- When database is added, we'll switch to using Medusa modules directly

---

## Current Inventory Management (How It Works Now)

### How Inventory Works Currently

**1. Initialization (`lib/inventory.ts`):**
```typescript
// Simple JavaScript Map
const inventory: Map<string, InventoryItem> = new Map()

// When products are fetched, initialize inventory
export async function initializeInventory(products) {
  products.forEach(product => {
    product.variants.forEach(variant => {
      inventory.set(variant.id, {
        variantId: variant.id,
        sku: variant.sku,
        quantity: variant.inventory_quantity,  // From hardcoded product
        reservedQuantity: 0,
      })
    })
  })
}
```

**2. Inventory Operations:**
- `checkAvailability()` - Checks Map for available quantity
- `reserveInventory()` - Updates Map with reserved quantity
- `fulfillInventory()` - Deducts from Map
- `getAvailableQuantity()` - Reads from Map

**3. Storage:**
- ❌ **In-memory only** - Lost on server restart
- ❌ **No persistence** - No database
- ❌ **Single server** - Doesn't work with multiple servers

**4. Limitations:**
- ❌ No database persistence
- ❌ Resets on server restart
- ❌ Not scalable (single server only)
- ❌ No multi-location support
- ❌ No inventory history/audit trail

---

## How Inventory Would Work WITH Embedded Medusa

### When We Enable Embedded Medusa

**1. Update `lib/medusa.ts`:**
```typescript
import { getProductModule } from './medusa-modules'

export async function getProductsFromMedusa() {
  const productModule = await getProductModule()  // ← Actually use Medusa!
  const products = await productModule.listProducts({})
  return products
}
```

**2. Update `lib/inventory.ts`:**
```typescript
import { getInventoryModule } from './medusa-modules'

export async function initializeInventory(products) {
  const inventoryModule = await getInventoryModule()  // ← Actually use Medusa!
  
  // Create inventory location
  await inventoryModule.createInventoryLocations([{
    id: 'default_location',
    name: 'Default Warehouse',
  }])
  
  // Create inventory items
  for (const product of products) {
    for (const variant of product.variants) {
      const [inventoryItem] = await inventoryModule.createInventoryItems([{
        sku: variant.sku,
        origin_country: 'US',
      }])
      
      // Set stock level
      await inventoryModule.createInventoryLevels([{
        inventory_item_id: inventoryItem.id,
        location_id: 'default_location',
        stocked_quantity: variant.inventory_quantity,
        reserved_quantity: 0,
      }])
    }
  }
}

export async function checkAvailability(variantId: string, sku: string, quantity: number) {
  const inventoryModule = await getInventoryModule()
  
  // Query Medusa Inventory Module
  const items = await inventoryModule.listInventoryItems({ sku })
  if (items.length === 0) return false
  
  const levels = await inventoryModule.listInventoryLevels({
    inventory_item_id: items[0].id,
    location_id: 'default_location',
  })
  
  if (levels.length === 0) return false
  
  const available = levels[0].stocked_quantity - levels[0].reserved_quantity
  return available >= quantity
}

export async function reserveInventory(variantId: string, sku: string, quantity: number) {
  const inventoryModule = await getInventoryModule()
  
  // Use Medusa's reservation system
  await inventoryModule.reserveItems([{
    line_item_id: variantId,
    inventory_item_id: items[0].id,
    location_id: 'default_location',
    quantity,
  }])
}
```

**3. With Database:**
```typescript
// lib/medusa-modules.ts
medusaApp = await loadModules({
  modulesConfig: {
    [Modules.INVENTORY]: {
      resolve: "@medusajs/inventory",
      options: {
        database: {
          clientUrl: process.env.DATABASE_URL,  // ← PostgreSQL connection
          schema: "public",
        },
      },
    },
  },
  // ...
})
```

**4. Benefits:**
- ✅ **Database persistence** - Survives server restarts
- ✅ **Scalable** - Works with multiple servers
- ✅ **Multi-location** - Support multiple warehouses
- ✅ **Reservations** - Built-in reservation system
- ✅ **Audit trail** - Track inventory changes
- ✅ **Production-ready** - Same system used by Medusa backend

---

## Comparison: Current vs Embedded Medusa

| Feature | Current (Hardcoded) | Embedded Medusa |
|--------|-------------------|----------------|
| **Products** | Hardcoded array | Medusa Product Module |
| **Inventory** | JavaScript Map | Medusa Inventory Module |
| **Storage** | In-memory | PostgreSQL database |
| **Persistence** | ❌ Lost on restart | ✅ Persistent |
| **Scalability** | ❌ Single server | ✅ Multi-server |
| **Multi-location** | ❌ No | ✅ Yes |
| **Reservations** | ✅ Custom | ✅ Built-in |
| **Admin UI** | ❌ None | ✅ Can use Medusa Admin |

---

## How to Enable Embedded Medusa

### Step 1: Add Database

```bash
# Install PostgreSQL (or use Supabase/Neon cloud)
# Set DATABASE_URL in .env.local
DATABASE_URL=postgres://user:pass@localhost:5432/medusa-db
```

### Step 2: Update `lib/medusa-modules.ts`

```typescript
medusaApp = await loadModules({
  modulesConfig: {
    [Modules.PRODUCT]: {
      resolve: "@medusajs/product",
      options: {
        database: {
          clientUrl: process.env.DATABASE_URL,
          schema: "public",
        },
      },
    },
    [Modules.INVENTORY]: {
      resolve: "@medusajs/inventory",
      options: {
        database: {
          clientUrl: process.env.DATABASE_URL,
          schema: "public",
        },
      },
    },
  },
  sharedContainer,
  sharedResourcesConfig: {
    database: {
      clientUrl: process.env.DATABASE_URL,
    },
  },
})
```

### Step 3: Update `lib/medusa.ts`

```typescript
import { getProductModule } from './medusa-modules'

export async function getProductsFromMedusa() {
  const productModule = await getProductModule()
  const products = await productModule.listProducts({})
  return products.map(product => ({
    // Transform to your format
  }))
}
```

### Step 4: Update `lib/inventory.ts`

Replace all Map operations with Medusa Inventory Module calls (see examples above).

### Step 5: Run Migrations

```bash
# Medusa modules will create database tables
npm run dev  # First run will create tables
```

---

## Summary

**Current State:**
- ✅ **Using embedded Medusa architecture**
- ✅ Medusa modules initialized and ready (`lib/medusa-modules.ts`)
- ✅ Temporary fallbacks: hardcoded products + in-memory inventory (until database)
- ✅ When database is added, switch from fallbacks to Medusa modules

**Architecture:**
```
Embedded Medusa Modules (lib/medusa-modules.ts)
    ↓ (requires database)
    ↓ (no database yet)
    ↓
Temporary Fallbacks:
  - Hardcoded Products (lib/medusa.ts)
  - In-Memory Inventory (lib/inventory.ts)
```

**Migration Path:**
1. Add PostgreSQL database
2. Update `lib/medusa-modules.ts` with database config
3. Update `lib/medusa.ts` to use `getProductModule()` instead of hardcoded
4. Update `lib/inventory.ts` to use `getInventoryModule()` instead of Map

**Inventory Management Now:**
- Simple JavaScript Map
- In-memory only
- No persistence
- Works great for POC/testing

**Inventory Management with Embedded Medusa:**
- Medusa Inventory Module
- PostgreSQL database
- Persistent storage
- Production-ready
- Multi-location support
- Built-in reservations

**To Enable:**
1. Add PostgreSQL database
2. Update module initialization with database config
3. Replace hardcoded functions with Medusa module calls
4. Run migrations

**Bottom Line:** We have the embedded Medusa code ready, but we're currently using hardcoded products and in-memory storage. Perfect for POC, but we'll need to enable Medusa modules when we add a database.

