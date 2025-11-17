# Hybrid Approach Setup Guide

Complete step-by-step guide to set up:
- ✅ Embedded Medusa modules for storefront (Next.js)
- ✅ Separate Medusa backend for admin dashboard
- ✅ Shared PostgreSQL database

---

## Overview

**Architecture:**
```
Next.js Storefront (Embedded Modules)
    ↓
    Uses PostgreSQL Database
    ↓
Medusa Backend (Separate - Admin Only)
    ↓
Medusa Admin Dashboard
```

**What You Get:**
- ✅ Storefront: Embedded modules (simpler deployment)
- ✅ Admin: Medusa Admin Dashboard (no custom code)
- ✅ Shared database: Both use same PostgreSQL

---

## Step 1: Set Up PostgreSQL Database

### Option A: Local PostgreSQL (Development)

**Install:**
```bash
# Mac
brew install postgresql
brew services start postgresql

# Create database
createdb medusa-db
```

**Connection String:**
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa-db
```

### Option B: Cloud PostgreSQL (Production Recommended)

**Using Supabase (Free Tier):**
1. Sign up at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy "URI" connection string
5. Format: `postgres://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

**Using Neon (Alternative):**
1. Sign up at [neon.tech](https://neon.tech)
2. Create project
3. Copy connection string

**Add to `.env.local`:**
```env
DATABASE_URL=postgres://user:password@host:5432/database
```

---

## Step 2: Configure Embedded Modules in Next.js

### Update `lib/medusa-modules.ts`

**Current (no database):**
```typescript
[Modules.PRODUCT]: {
  resolve: "@medusajs/product",
  options: {
    // For POC: in-memory storage
    // For production: add database config
  },
},
```

**Update to (with database):**
```typescript
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
```

**Also update `sharedResourcesConfig`:**
```typescript
sharedResourcesConfig: {
  database: {
    clientUrl: process.env.DATABASE_URL,
    schema: "public",
  },
},
```

### Update `lib/medusa.ts`

**Current (hardcoded):**
```typescript
export async function getProductsFromMedusa() {
  return seedProducts()  // ← Hardcoded
}
```

**Update to (use Medusa modules):**
```typescript
import { getProductModule } from './medusa-modules'

export async function getProductsFromMedusa() {
  try {
    const productModule = await getProductModule()
    const products = await productModule.listProducts({})
    
    // Transform to match expected format
    return products.map((product: any) => ({
      id: product.id,
      title: product.title,
      description: product.description || '',
      handle: product.handle,
      status: product.status,
      images: product.images || [],
      options: product.options || [],
      tags: product.tags || [],
      variants: product.variants || [],
    }))
  } catch (error) {
    console.warn('Failed to fetch from Medusa modules, using hardcoded:', error)
    // Fallback to hardcoded for now
    return seedProducts()
  }
}

// Seed products into Medusa Product Module (run once)
export async function seedProducts() {
  const productModule = await getProductModule()
  
  // Check if products already exist
  const existing = await productModule.listProducts({})
  if (existing.length > 0) {
    return existing  // Products already seeded
  }
  
  // Create products in Medusa
  const products = [
    {
      title: 'Premium T-Shirt',
      description: 'High-quality cotton t-shirt available in multiple colors',
      handle: 'premium-tshirt',
      status: 'published',
      // ... rest of product data
    },
    // ... other products
  ]
  
  const created = await productModule.createProducts(products)
  return created
}
```

### Update `lib/inventory.ts`

**Current (in-memory Map):**
```typescript
const inventory: Map<string, InventoryItem> = new Map()
```

**Update to (use Medusa Inventory Module):**
```typescript
import { getInventoryModule } from './medusa-modules'

const DEFAULT_LOCATION_ID = 'default_location'

export async function initializeInventory(products: Array<{
  id: string
  variants: Array<{
    id: string
    sku: string
    inventory_quantity: number
  }>
}>) {
  const inventoryModule = await getInventoryModule()
  
  // Create default location
  try {
    await inventoryModule.createInventoryLocations([{
      id: DEFAULT_LOCATION_ID,
      name: 'Default Warehouse',
    }])
  } catch (error) {
    // Location might already exist
  }
  
  // Create inventory items
  for (const product of products) {
    for (const variant of product.variants) {
      try {
        // Check if already exists
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
        }
      } catch (error) {
        console.error(`Failed to create inventory for ${variant.sku}:`, error)
      }
    }
  }
}

export async function checkAvailability(variantId: string, sku: string, quantity: number) {
  const inventoryModule = await getInventoryModule()
  
  const items = await inventoryModule.listInventoryItems({ sku })
  if (items.length === 0) return false
  
  const levels = await inventoryModule.listInventoryLevels({
    inventory_item_id: items[0].id,
    location_id: DEFAULT_LOCATION_ID,
  })
  
  if (levels.length === 0) return false
  
  const available = levels[0].stocked_quantity - levels[0].reserved_quantity
  return available >= quantity
}

export async function reserveInventory(variantId: string, sku: string, quantity: number) {
  const inventoryModule = await getInventoryModule()
  
  if (!(await checkAvailability(variantId, sku, quantity))) {
    return false
  }
  
  try {
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
    console.error('Failed to reserve inventory:', error)
    return false
  }
}

// Update other functions similarly...
```

---

## Step 3: Set Up Separate Medusa Backend (For Admin)

### Create Medusa Backend Project

```bash
# Create Medusa backend in separate folder
npx create-medusa-app@latest medusa-backend

# When prompted:
# - Choose "Create a new project"
# - Choose "Database: PostgreSQL"
# - Choose "Redis: Yes" (optional but recommended)
# - Choose "Starter Database Seed: No" (we'll use our own data)
```

### Configure Backend to Use Same Database

**Update `medusa-backend/.env`:**
```env
# Use the SAME database as Next.js
DATABASE_URL=postgres://user:password@host:5432/database

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Generate secrets
JWT_SECRET=your-generated-jwt-secret
COOKIE_SECRET=your-generated-cookie-secret

# Backend URL
MEDUSA_BACKEND_URL=http://localhost:9000
```

**Generate Secrets:**
```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For COOKIE_SECRET (run again)
```

### Run Migrations

```bash
cd medusa-backend
npm run build
npx medusa db:migrate
```

### Start Backend

```bash
npm run start
```

Backend runs on: `http://localhost:9000`

---

## Step 4: Access Medusa Admin Dashboard

### Initial Setup

1. **Access Admin:**
   ```
   http://localhost:9000/app
   ```

2. **Create Admin User:**
   ```bash
   cd medusa-backend
   npx medusa user -e admin@example.com -p supersecret
   ```

3. **Login:**
   - Email: `admin@example.com`
   - Password: `supersecret`

### What You'll See

- ✅ **Products** - Manage products (will see products from shared database)
- ✅ **Inventory** - Manage inventory levels
- ✅ **Orders** - View and process orders
- ✅ **Customers** - View customer data

---

## Step 5: Seed Products (One-Time Setup)

### Option A: Seed via Next.js (Embedded Modules)

**Run once:**
```typescript
// In Next.js app, call seedProducts() once
// This will create products in the shared database
// Both Next.js and Medusa backend will see them
```

**Create seed script:**
```typescript
// scripts/seed-products.ts
import { seedProducts } from './lib/medusa'

async function main() {
  console.log('Seeding products...')
  const products = await seedProducts()
  console.log(`Seeded ${products.length} products`)
}

main()
```

**Run:**
```bash
npx tsx scripts/seed-products.ts
```

### Option B: Seed via Medusa Admin

1. Login to Medusa Admin (`http://localhost:9000/app`)
2. Go to Products → New Product
3. Add products manually through UI

---

## Step 6: Verify Everything Works

### Test Storefront (Next.js)

```bash
npm run dev
```

Visit: `http://localhost:3000/products`
- Should see products from database
- Products managed by embedded Medusa modules

### Test Admin Dashboard

Visit: `http://localhost:9000/app`
- Login with admin credentials
- Should see same products (shared database)
- Can manage products, inventory, orders

### Test Inventory

1. **In Storefront:**
   - Add product to cart
   - Inventory should be reserved automatically

2. **In Admin Dashboard:**
   - Go to Inventory
   - Should see reserved quantity
   - Can update stock levels

---

## Step 7: Production Deployment

### Next.js Storefront (Vercel)

1. **Set Environment Variables:**
   ```env
   DATABASE_URL=your-production-database-url
   ```

2. **Deploy:**
   ```bash
   vercel deploy
   ```

### Medusa Backend (Railway/Render)

1. **Set Environment Variables:**
   ```env
   DATABASE_URL=your-production-database-url
   JWT_SECRET=your-secret
   COOKIE_SECRET=your-secret
   ```

2. **Deploy:**
   - Railway: Connect GitHub repo, auto-deploys
   - Render: Connect GitHub repo, auto-deploys

### PostgreSQL Database (Supabase/Neon)

- Use same database URL for both Next.js and Medusa backend
- Both will share the same data

---

## Troubleshooting

### Database Connection Issues

**Error: "Connection refused"**
- Check PostgreSQL is running: `pg_isready`
- Verify `DATABASE_URL` is correct
- Check firewall settings (cloud databases)

### Modules Not Initializing

**Error: "Failed to initialize Medusa modules"**
- Check `DATABASE_URL` is set in `.env.local`
- Verify database exists and is accessible
- Check database permissions

### Products Not Showing

**Products don't appear:**
- Run seed script to create products
- Check database tables exist (Medusa creates them automatically)
- Verify both Next.js and Medusa backend use same database

### Admin Dashboard Not Loading

**Can't access admin:**
- Ensure Medusa backend is running
- Check backend logs for errors
- Verify admin user exists: `npx medusa user`

---

## Summary

**Next Steps:**

1. ✅ **Set up PostgreSQL database** (local or cloud)
2. ✅ **Update `lib/medusa-modules.ts`** - Add database config
3. ✅ **Update `lib/medusa.ts`** - Use `getProductModule()` instead of hardcoded
4. ✅ **Update `lib/inventory.ts`** - Use `getInventoryModule()` instead of Map
5. ✅ **Set up Medusa backend** - Separate project for admin
6. ✅ **Configure backend** - Point to same database
7. ✅ **Run migrations** - Create database tables
8. ✅ **Seed products** - Create initial products
9. ✅ **Test** - Verify storefront and admin work

**Result:**
- ✅ Storefront: Embedded modules (Next.js)
- ✅ Admin: Medusa Admin Dashboard (separate backend)
- ✅ Shared database: Both use same PostgreSQL

**You're ready to go!** 🚀

