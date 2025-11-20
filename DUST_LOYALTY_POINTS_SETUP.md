# Dust Loyalty Points System Setup

This guide explains how to implement a proper loyalty points system for "Dust" rewards using Medusa's module system, following the [official Medusa loyalty points tutorial](https://docs.medusajs.com/resources/how-to-tutorials/tutorials/loyalty-points).

## Why Use Loyalty Points Instead of Currency?

✅ **Better Architecture:**
- Uses Medusa's built-in promotion system
- Proper database storage (not in-memory)
- Integrates with Medusa's cart/order workflows
- Can earn points on purchases
- Can redeem points for discounts

✅ **Cleaner Implementation:**
- No need to use XPF currency hack
- Products priced normally (EUR/USD)
- Dust is a reward/points system, not a currency
- Better separation of concerns

## Architecture

```
Medusa Backend
├── Dust Module (loyalty points)
│   ├── Data Model: DustPoint (customer_id, points)
│   ├── Service: DustModuleService (addPoints, deductPoints, getPoints)
│   └── API Routes: /admin/dust/*, /store/dust/*
│
Storefront (Next.js)
├── Calls backend API for dust balance
├── Shows dust balance in UI
└── Uses promotions to redeem dust
```

## Implementation Steps

### Step 1: Create Dust Module in Backend

Create the module structure in your Medusa backend:

**File: `medusa-backend/src/modules/dust/models/dust-point.ts`**
```typescript
import { model } from "@medusajs/framework/utils"

const DustPoint = model.define("dust_point", {
  id: model.id().primaryKey(),
  points: model.number().default(0),
  customer_id: model.text().unique("IDX_DUST_CUSTOMER_ID"), 
})

export default DustPoint
```

**File: `medusa-backend/src/modules/dust/service.ts`**
```typescript
import { MedusaService } from "@medusajs/framework/utils"
import DustPoint from "./models/dust-point"
import { InferTypeOf } from "@medusajs/framework/types"

type DustPoint = InferTypeOf<typeof DustPoint>

class DustModuleService extends MedusaService({
  DustPoint,
}) {
  async addPoints(customerId: string, points: number): Promise<DustPoint> {
    const existing = await this.listDustPoints({
      customer_id: customerId,
    })

    if (existing.length > 0) {
      return await this.updateDustPoints({
        id: existing[0].id,
        points: existing[0].points + points,
      })
    }

    return await this.createDustPoints({
      customer_id: customerId,
      points,
    })
  }

  async deductPoints(customerId: string, points: number): Promise<DustPoint> {
    const existing = await this.listDustPoints({
      customer_id: customerId,
    })

    if (existing.length === 0 || existing[0].points < points) {
      throw new Error('Insufficient dust points')
    }

    return await this.updateDustPoints({
      id: existing[0].id,
      points: existing[0].points - points,
    })
  }

  async getPoints(customerId: string): Promise<number> {
    const existing = await this.listDustPoints({
      customer_id: customerId,
    })

    return existing.length > 0 ? existing[0].points : 0
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

### Step 2: Register Module in Backend

Add to `medusa-backend/src/modules/index.ts` (or create it):

```typescript
import DustModuleService, { DUST_MODULE } from "./dust"

export default {
  [DUST_MODULE]: DustModuleService,
}
```

### Step 3: Create API Routes in Backend

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

### Step 4: Update Storefront to Use Backend API

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

### Step 5: Update Products to Use Regular Currency

- Remove XPF currency from products
- Price products in EUR/USD
- Use promotions for dust redemption (see Medusa tutorial)

## Next Steps

1. **Create the module** in your Medusa backend
2. **Run migrations** to create the dust_point table
3. **Create API routes** for dust management
4. **Update storefront** to call backend APIs
5. **Implement promotions** for dust redemption

## Reference

- [Medusa Loyalty Points Tutorial](https://docs.medusajs.com/resources/how-to-tutorials/tutorials/loyalty-points)
- [Medusa Modules Documentation](https://docs.medusajs.com/learn/fundamentals/modules)
- [Medusa Promotions](https://docs.medusajs.com/commerce-modules/promotion)

