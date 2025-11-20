# Dust Loyalty Points System Setup

This guide explains how to implement a proper loyalty points system for "Dust" rewards using Medusa's module system, following the [official Medusa loyalty points tutorial](https://docs.medusajs.com/resources/how-to-tutorials/tutorials/loyalty-points).

## Why Use Loyalty Points Instead of Currency?

**Better Architecture:**
- Uses Medusa's built-in promotion system
- Proper database storage (not in-memory)
- Integrates with Medusa's cart/order workflows
- Can earn points on purchases
- Can redeem points for discounts
## Architecture

```
Medusa Backend
├── Dust Module (loyalty points)
│   ├── Models:
│   │   ├── DustProduct (product_id, dust_only, dust_price)
│   │   ├── DustBalance (customer_id, balance)
│   │   └── DustTransaction (customer_id, amount, type, description)
│   ├── Service: DustModuleService
│   │   ├── Balance: getBalance, creditDust, debitDust
│   │   └── Products: setProductDustSettings, getProductDustSettings
│   ├── Migrations: Creates dust_product, dust_balance, dust_transaction tables
│   └── API Routes: /admin/dust/*, /store/dust/*
│
Storefront (Next.js)
├── Calls backend API for dust balance (/store/dust/balance)
├── Fetches dust product settings (/store/dust/products)
├── Shows dust balance in UI
└── Uses dust for checkout (deducts from balance)
```

## Implementation Steps

### Step 1: Create Dust Module Models in Backend

Create the module structure in your Medusa backend. The dust module uses three models:

**File: `medusa-backend/src/modules/dust/models/dust-product.ts`**
```typescript
import { model } from "@medusajs/framework/utils"

/**
 * Model to link products to dust settings
 * This allows us to store dust-only flag and dust_price separately from product metadata
 */
const DustProduct = model.define("dust_product", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  dust_only: model.boolean(),
  dust_price: model.number(),
})

export default DustProduct
```

**File: `medusa-backend/src/modules/dust/models/dust-balance.ts`**
```typescript
import { model } from "@medusajs/framework/utils"

const DustBalance = model.define("dust_balance", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  balance: model.number(),
})

export default DustBalance
```

**File: `medusa-backend/src/modules/dust/models/dust-transaction.ts`**
```typescript
import { model } from "@medusajs/framework/utils"

const DustTransaction = model.define("dust_transaction", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  amount: model.number(),
  type: model.text(),
  reference_type: model.text(),
  reference_id: model.text(),
  description: model.text(),
})

export default DustTransaction
```

**File: `medusa-backend/src/modules/dust/service.ts`**
```typescript
import { MedusaService } from "@medusajs/framework/utils"
import DustProduct from "./models/dust-product"
import DustBalance from "./models/dust-balance"
import DustTransaction from "./models/dust-transaction"

class DustModuleService extends MedusaService({
  DustProduct,
  DustBalance,
  DustTransaction,
}) {
  // Balance methods
  async getBalance(customerId: string): Promise<number> {
    // Implementation to get customer balance
  }

  async creditDust(customerId: string, amount: number, ...): Promise<void> {
    // Implementation to credit dust
  }

  async debitDust(customerId: string, amount: number, ...): Promise<void> {
    // Implementation to debit dust
  }

  // Product settings methods
  async setProductDustSettings(productId: string, dustOnly: boolean, dustPrice: number): Promise<void> {
    // Implementation to save product dust settings
  }

  async getProductDustSettings(productId: string): Promise<{dust_only: boolean, dust_price: number} | null> {
    // Implementation to get product settings
  }

  async getProductsDustSettings(productIds: string[]): Promise<Record<string, {dust_only: boolean, dust_price: number}>> {
    // Implementation to get multiple products' settings
  }
}

export default DustModuleService
```

**File: `medusa-backend/src/modules/dust/index.ts`**
```typescript
import DustModuleService from "./service"

export const DUST_MODULE = "dustModuleService"

export default DustModuleService
```

### Step 2: Create Database Migration

**Documentation**: [Database Migrations](https://docs.medusajs.com/resources/development/backend/migrations) | [Creating Migrations](https://docs.medusajs.com/resources/development/backend/migrations/create-migration)

Create a migration file to create the database tables:

**File: `medusa-backend/src/modules/dust/migrations/Migration[timestamp].ts`**
```typescript
import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration[timestamp] extends Migration {
  override async up(): Promise<void> {
    // Create dust_balance table
    this.addSql(`create table if not exists "dust_balance" (
      "id" text not null, 
      "customer_id" text not null, 
      "balance" integer not null, 
      "created_at" timestamptz not null default now(), 
      "updated_at" timestamptz not null default now(), 
      "deleted_at" timestamptz null, 
      constraint "dust_balance_pkey" primary key ("id")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dust_balance_deleted_at" ON "dust_balance" ("deleted_at") WHERE deleted_at IS NULL;`);

    // Create dust_product table
    this.addSql(`create table if not exists "dust_product" (
      "id" text not null, 
      "product_id" text not null, 
      "dust_only" boolean not null, 
      "dust_price" integer not null, 
      "created_at" timestamptz not null default now(), 
      "updated_at" timestamptz not null default now(), 
      "deleted_at" timestamptz null, 
      constraint "dust_product_pkey" primary key ("id")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dust_product_deleted_at" ON "dust_product" ("deleted_at") WHERE deleted_at IS NULL;`);

    // Create dust_transaction table
    this.addSql(`create table if not exists "dust_transaction" (
      "id" text not null, 
      "customer_id" text not null, 
      "amount" integer not null, 
      "type" text not null, 
      "reference_type" text not null, 
      "reference_id" text not null, 
      "description" text not null, 
      "created_at" timestamptz not null default now(), 
      "updated_at" timestamptz not null default now(), 
      "deleted_at" timestamptz null, 
      constraint "dust_transaction_pkey" primary key ("id")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dust_transaction_deleted_at" ON "dust_transaction" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "dust_balance" cascade;`);
    this.addSql(`drop table if exists "dust_product" cascade;`);
    this.addSql(`drop table if exists "dust_transaction" cascade;`);
  }
}
```

**Run the migration:**
```bash
cd medusa-backend
npm run build
npx medusa db:migrate
```

This creates three tables:
- `dust_product` - Stores product dust settings (dust_only, dust_price)
- `dust_balance` - Stores customer dust balances
- `dust_transaction` - Stores dust transaction history

### Step 3: Register Module in Backend

Add to `medusa-backend/src/modules/index.ts` (or create it):

```typescript
import DustModuleService, { DUST_MODULE } from "./dust"

export default {
  [DUST_MODULE]: DustModuleService,
}
```

### Step 4: Create API Routes in Backend

**File: `medusa-backend/src/api/store/dust/route.ts`**
```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DUST_MODULE } from "../../../modules/dust"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const customerId = req.auth_context?.actor_id
  
  if (!customerId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  const dustService = req.scope.resolve(DUST_MODULE)
  const points = await dustService.getPoints(customerId)

  res.json({ points })
}
```

### Step 5: Update Storefront to Use Backend API

Update `app/api/dust-balance/route.ts` to call the backend:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    
    // TODO: Get customer ID from session/auth
    // For now, using test customer ID
    const customerId = "cus_test_1"
    
    const response = await fetch(`${backendUrl}/store/dust`, {
      headers: {
        // TODO: Add authentication headers
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch dust balance')
    }
    
    const data = await response.json()
    return NextResponse.json({ balance: data.points || 0 })
  } catch (error) {
    console.error('Error fetching dust balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dust balance' },
      { status: 500 }
    )
  }
}
```

## Database Tables Created

After running migrations, you'll have three tables:

**1. `dust_product` table** (stores product dust settings):
- `id`: Primary key
- `product_id`: Foreign key to product
- `dust_only`: Boolean (true = can only be purchased with dust)
- `dust_price`: Number (dust points required)

**2. `dust_balance` table** (customer balances):
- `id`: Primary key
- `customer_id`: Foreign key to customer
- `balance`: Number (current dust balance)

**3. `dust_transaction` table** (transaction history):
- `id`: Primary key
- `customer_id`: Foreign key
- `amount`: Number (positive for credit, negative for debit)
- `type`: String ('credit' or 'debit')
- `description`: String
- `reference_type`: String (e.g., 'order')
- `reference_id`: String (e.g., order ID)

## Next Steps

1. **Create the module models** in your Medusa backend (`dust-product.ts`, `dust-balance.ts`, `dust-transaction.ts`)
2. **Create the migration file** to define the database schema
3. **Run migrations** to create the tables: `npx medusa db:migrate`
4. **Implement the service** (`service.ts`) with business logic
5. **Create API routes** for dust management (`/store/dust/*`, `/admin/dust/*`)
6. **Update storefront** to call backend APIs
7. **Create admin widget** for managing dust product settings (see `HANDOVER_DOCUMENT.md`)

## Reference

- [Medusa Loyalty Points Tutorial](https://docs.medusajs.com/resources/how-to-tutorials/tutorials/loyalty-points)
- [Medusa Modules Documentation](https://docs.medusajs.com/learn/fundamentals/modules)
- [Medusa Promotions](https://docs.medusajs.com/commerce-modules/promotion)

