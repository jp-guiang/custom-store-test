# Project Handover Document

## Overview

This document provides a comprehensive guide for implementing the Medusa.js e-commerce system with dust loyalty points into an existing website. The project consists of two main components:

1. **Medusa Backend** (`~/Documents/Eriks Curiosa/medusa-backend`) - Admin panel and API server
2. **Next.js Storefront** (`custom-store-test`) - Customer-facing storefront

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementing Medusa Backend](#implementing-medusa-backend)
3. [Implementing Admin Panel](#implementing-admin-panel)
4. [Connecting Storefront to Backend](#connecting-storefront-to-backend)
5. [Dust Promos Implementation](#dust-promos-implementation)
6. [Product Rendering](#product-rendering)
7. [Checkout Process](#checkout-process)
8. [Important Notes & Gotchas](#important-notes--gotchas)

---

## Architecture Overview

### System Components

```
┌─────────────────────┐         ┌──────────────────────┐
│   Next.js Storefront │         │  Medusa Backend      │
│   (Port 3000)       │────────▶│  (Port 9000)         │
│                     │  REST   │                      │
│  - Products Page    │  API    │  - Admin Panel       │
│  - Cart            │         │  - Product API       │
│  - Checkout        │         │  - Dust API          │
│  - Dust Balance    │         │  - Database          │
└─────────────────────┘         └──────────────────────┘
         │                                │
         │                                │
         └──────────────┬─────────────────┘
                        │
                ┌───────▼────────┐
                │   PostgreSQL   │
                │   Database      │
                └─────────────────┘
```

### Key Technologies

- **Backend**: Medusa.js v2 (Node.js/TypeScript)
- **Frontend**: Next.js 14 (App Router, TypeScript)
- **Database**: PostgreSQL
- **Admin UI**: Medusa Admin Dashboard (built-in)
- **API Communication**: REST API with Publishable API Keys

---

## Implementing Medusa Backend

**Documentation**: [Medusa Getting Started](https://docs.medusajs.com/resources/getting-started) | [Installation Guide](https://docs.medusajs.com/resources/getting-started/installation) | [Prerequisites](https://docs.medusajs.com/resources/getting-started/prerequisites)

### Prerequisites

1. **Node.js 18+** installed
2. **PostgreSQL** database (local or cloud)
3. **Backend project** located at `~/Documents/Eriks Curiosa/medusa-backend`

### Step 1: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd ~/Documents/Eriks\ Curiosa/medusa-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   Create `.env` file in backend root:
   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/medusa_db
   JWT_SECRET=your_jwt_secret_here
   COOKIE_SECRET=your_cookie_secret_here
   ```

4. **Run database migrations:**
   ```bash
   npx medusa db:migrate
   ```
   **Documentation**: [Database Migrations](https://docs.medusajs.com/resources/development/backend/migrations)

5. **Create admin user:**
   ```bash
   npx medusa user -e admin@example.com -p your_password
   ```
   **Documentation**: [Creating Admin Users](https://docs.medusajs.com/resources/development/backend/create-admin)

6. **Start backend server:**
   ```bash
   npm run dev
   # Backend runs on http://localhost:9000
   # Admin panel: http://localhost:9000/app
   ```

### Step 2: Verify Backend is Running

- **Health check**: `curl http://localhost:9000/health`
- **Admin panel**: Open `http://localhost:9000/app` in browser
- **Login**: Use admin credentials created in Step 1

---

## Implementing Admin Panel

**Documentation**: 
- [Medusa Admin Overview](https://docs.medusajs.com/resources/admin)
- [Admin Dashboard](https://docs.medusajs.com/resources/admin/dashboard)
- [Admin Customization](https://docs.medusajs.com/resources/admin/customization)

The admin panel is **built into Medusa** - no custom implementation needed! It runs automatically when you start the Medusa backend server.

### Accessing Admin Panel

1. **URL**: `http://localhost:9000/app`
2. **Login**: Use admin credentials created during backend setup
3. **Features Available**:
   - Product management (create, edit, delete) - [Product Management Docs](https://docs.medusajs.com/resources/admin/products)
   - Order management - [Order Management Docs](https://docs.medusajs.com/resources/admin/orders)
   - Customer management - [Customer Management Docs](https://docs.medusajs.com/resources/admin/customers)
   - Inventory management - [Inventory Management Docs](https://docs.medusajs.com/resources/admin/inventory)
   - Settings (including Publishable API Keys) - [Settings Docs](https://docs.medusajs.com/resources/admin/settings)

### How Admin Panel Connects to Storefront

**Key Connection Point**: **Publishable API Keys**

The admin panel and storefront are connected through **Publishable API Keys**:

1. **Admin creates key**: In admin panel → Settings → Publishable API Keys
2. **Key is copied**: Format `pk_xxxxxxxxxxxxx`
3. **Storefront uses key**: Added to `.env` as `MEDUSA_PUBLISHABLE_API_KEY`
4. **Storefront authenticates**: All API requests include `x-publishable-api-key` header
5. **Backend validates**: Medusa backend validates the key and allows access to store API

**Documentation**: 
- [Publishable API Keys Guide](https://docs.medusajs.com/resources/store/authentication/publishable-api-keys)
- [Store API Authentication](https://docs.medusajs.com/resources/store/authentication)

**Flow Diagram**:
```
Admin Panel (Port 9000/app)
    │
    │ Creates Publishable API Key
    │
    ▼
Backend API (Port 9000)
    │
    │ Validates API Key
    │
    ▼
Storefront (Port 3000)
    │
    │ Uses API Key in requests
    │ Fetches products, dust balance, etc.
    │
    ▼
Products displayed to customers
```

### Custom Admin Widget: Dust Product Settings

**Documentation**: 
- [Admin Widgets Guide](https://docs.medusajs.com/resources/admin/widgets)
- [Widget Development](https://docs.medusajs.com/resources/admin/widgets/development)
- [Widget Configuration](https://docs.medusajs.com/resources/admin/widgets/configuration)

**This is how admins configure dust products** - the widget appears directly in the Medusa admin panel.

**Location**: `medusa-backend/src/admin/widgets/dust-product-widget.tsx`

**What it does**:
- Appears on product detail pages in admin (below product details)
- Allows marking products as "dust-only" (checkbox)
- Sets dust price for products (number input)
- Saves settings to `dust_product` table via API call

**How it works**:
1. Admin opens a product in admin panel
2. Widget loads existing dust settings from `/admin/products/:id/dust`
3. Admin checks "dust-only" checkbox and enters price
4. Admin clicks "Save Dust Settings"
5. Widget calls `POST /admin/products/:id/dust` to save settings
6. Settings are stored in `dust_product` table
7. Storefront automatically picks up changes on next product fetch

**To enable the widget**:
1. The widget is already registered in the backend
2. Rebuild admin panel if needed:
   ```bash
   cd ~/Documents/Eriks\ Curiosa/medusa-backend
   npm run build
   ```
3. Restart backend server
4. Navigate to any product in admin panel
5. Scroll down to see "Dust Points Settings" widget

**Widget Code Flow**:
```typescript
// Widget fetches current settings
GET /admin/products/:product_id/dust

// Admin updates settings
POST /admin/products/:product_id/dust
{
  "dust_only": true,
  "dust_price": 1000
}

// Backend saves to dust_product table
// Storefront fetches via /store/dust/products
```

### Admin API Endpoints for Dust

**Documentation**: [Admin API Routes](https://docs.medusajs.com/resources/development/backend/api-routes/admin) | [Admin API Authentication](https://docs.medusajs.com/resources/admin/authentication)

**These endpoints are used by the admin widget** to save dust product settings.

**Mark product as dust-only** (used by admin widget):
```bash
POST /admin/products/:product_id/dust
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "dust_only": true,
  "dust_price": 100
}
```
**Location**: `medusa-backend/src/api/admin/products/[id]/dust/route.ts`
**What it does**: Saves settings to `dust_product` table via `DustModuleService.setProductDustSettings()`

**Get dust settings** (used by admin widget to load current settings):
```bash
GET /admin/products/:product_id/dust
Authorization: Bearer YOUR_ADMIN_TOKEN
```
**Returns**: `{ "dust_only": true, "dust_price": 100 }`

**Credit dust to customer** (for awarding loyalty points):
```bash
POST /admin/dust/credit
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "customer_id": "cus_123",
  "amount": 500,
  "description": "Welcome bonus"
}
```
**Location**: `medusa-backend/src/api/admin/dust/credit/route.ts`
**What it does**: Adds dust to customer balance via `DustModuleService.creditDust()`

**Complete Admin → Storefront Flow**:
```
1. Admin opens product in admin panel
   ↓
2. Admin widget loads: GET /admin/products/:id/dust
   ↓
3. Admin checks "dust-only" and sets price
   ↓
4. Admin clicks save: POST /admin/products/:id/dust
   ↓
5. Backend saves to dust_product table
   ↓
6. Storefront fetches: GET /store/dust/products?product_ids=...
   ↓
7. Product appears in "Dust Products" section
```

---

## Connecting Storefront to Backend

**Documentation**: [Publishable API Keys](https://docs.medusajs.com/resources/store/authentication/publishable-api-keys) | [Store API Overview](https://docs.medusajs.com/resources/store)

### Step 1: Get Publishable API Key

1. **Open Admin Panel**: `http://localhost:9000/app`
2. **Navigate to**: Settings → Publishable API Keys
3. **Create new key** (or use existing):
   - Name: `Storefront Key`
   - Click "Create"
4. **Copy the key** (format: `pk_xxxxxxxxxxxxx`)

**Documentation**: [Creating Publishable API Keys](https://docs.medusajs.com/resources/admin/settings/publishable-api-keys)

### Step 2: Configure Storefront Environment

**File**: `custom-store-test/.env` (or `.env.local`)

```env
# Medusa Backend URL
MEDUSA_BACKEND_URL=http://localhost:9000

# Publishable API Key (REQUIRED)
MEDUSA_PUBLISHABLE_API_KEY=pk_your_key_here

# Database (if using embedded modules - not needed for separate backend)
# DATABASE_URL=postgres://...
```

### Step 3: Verify Connection

1. **Restart Next.js dev server:**
   ```bash
   cd custom-store-test
   npm run dev
   ```

2. **Check products page**: `http://localhost:3000/products`
   - Products from backend should appear

3. **Check API response**: `http://localhost:3000/api/products`
   - Should show `"source": "medusa-backend"`

### How It Works

**Documentation**: [Medusa JS SDK](https://docs.medusajs.com/resources/js-client/overview) | [Store API Products](https://docs.medusajs.com/resources/store/products)

**Key File**: `lib/medusa-client.ts`

The storefront uses `@medusajs/js-sdk` to connect to backend:

```typescript
import Medusa from "@medusajs/js-sdk"

export const medusaClient = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  publishableKey: process.env.MEDUSA_PUBLISHABLE_API_KEY,
})
```

**Product Fetching Flow**:
1. Storefront calls `/api/products` (Next.js API route)
2. API route calls `getProductsFromBackend()` from `lib/medusa-client.ts`
3. Function fetches from backend: `/store/products-with-metadata` (custom endpoint)
4. Falls back to `/store/products` if custom endpoint fails - [Store Products API](https://docs.medusajs.com/api/store#tag/Product)
5. Also fetches dust settings from `/store/dust/products`
6. Transforms and returns products to frontend

---

## Dust Promos Implementation

**Documentation**: 
- [Medusa Modules Overview](https://docs.medusajs.com/resources/commerce-modules/overview)
- [Creating Custom Modules](https://docs.medusajs.com/resources/development/backend/modules/create-module)
- [Database Models](https://docs.medusajs.com/resources/development/backend/models)
- [Loyalty Points Tutorial](https://docs.medusajs.com/resources/how-to-tutorials/tutorials/loyalty-points)

This section explains **how dust loyalty points are implemented** - both in the backend (admin) and frontend (storefront).

### Overview: How Dust Promos Work

1. **Admin marks product as dust-only** → Stored in `dust_product` table
2. **Storefront fetches dust settings** → Detects dust products
3. **Customer views dust products** → Separate section, shows dust price
4. **Customer adds to cart** → Validates dust balance
5. **Customer checks out** → Deducts dust from balance

### Backend Implementation

#### Database Tables

**Documentation**: [Database Migrations](https://docs.medusajs.com/resources/development/backend/migrations) | [Creating Migrations](https://docs.medusajs.com/resources/development/backend/migrations/create-migration)

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

#### Backend Module: Custom Dust Module

**Documentation**: 
- [Creating Custom Modules](https://docs.medusajs.com/resources/development/backend/modules/create-module)
- [Module Services](https://docs.medusajs.com/resources/development/backend/modules/services)
- [Module Registration](https://docs.medusajs.com/resources/development/backend/modules/register-module)

**Location**: `medusa-backend/src/modules/dust/`

**What it does**: This is a **custom Medusa module** that handles all dust loyalty point logic.

**Service**: `service.ts` provides:
- `getBalance(customerId)` - Get customer dust balance
- `creditDust(customerId, amount, ...)` - Add dust to customer
- `debitDust(customerId, amount, ...)` - Remove dust from customer
- `setProductDustSettings(productId, dustOnly, dustPrice)` - Configure product as dust-only
- `getProductDustSettings(productId)` - Get product settings
- `getProductsDustSettings(productIds[])` - Get multiple products' settings

**How it's registered**: The module is registered in `medusa-backend/src/modules/dust/index.ts` and loaded by Medusa automatically.

#### Backend API Endpoints

**Documentation**: [Store API Routes](https://docs.medusajs.com/resources/development/backend/api-routes/store) | [Admin API Routes](https://docs.medusajs.com/resources/development/backend/api-routes/admin) | [API Reference](https://docs.medusajs.com/api/store)

**Store Endpoints** (public, requires publishable key):

**✅ Currently Used by Storefront:**
- `GET /store/products-with-metadata` - **PRIMARY**: Fetches all products from admin panel
  - Used in: `lib/medusa-client.ts` (line 55)
  - Falls back to `/store/products` if unavailable
- `GET /store/dust/products?product_ids=id1,id2` - Fetches dust settings for products
  - Used in: `lib/medusa-client.ts` (line 100)
  - Returns map: `{ "prod_123": { "dust_only": true, "dust_price": 1000 } }`
- `GET /store/dust/balance` - Get current customer's dust balance
  - Used in: `app/api/dust-balance/route.ts` (line 17)
  - Falls back to in-memory balance if backend unavailable

**❌ Available in Backend but NOT Used by Storefront:**
- `POST /store/dust/apply-to-cart` - Apply dust to cart (exists in backend, but checkout uses `processDustPayment()` directly)
- `GET /store/dust/transactions` - Get dust transaction history (exists in backend, but not called from frontend)

**Admin Endpoints** (requires admin token):
- `POST /admin/products/:id/dust` - Set product dust settings
- `GET /admin/products/:id/dust` - Get product dust settings
- `POST /admin/dust/credit` - Credit dust to customer
- `POST /admin/dust/debit` - Debit dust from customer
- `GET /admin/dust/balance/:customer_id` - Get customer balance

**Documentation**: [Store API Authentication](https://docs.medusajs.com/resources/store/authentication) | [Admin API Authentication](https://docs.medusajs.com/resources/admin/authentication)

### Frontend Implementation: How Storefront Displays Dust Products

**Documentation**: [Store API Products](https://docs.medusajs.com/resources/store/products) | [Store API Authentication](https://docs.medusajs.com/resources/store/authentication)

#### How Storefront Fetches Dust Settings

**Key File**: `lib/medusa-client.ts`

**Step-by-step process**:

1. **Fetch products from backend**:
   ```typescript
   GET /store/products-with-metadata?region_id=xxx
   Headers: { 'x-publishable-api-key': 'pk_xxx' }
   ```
   - Custom endpoint returns products WITH metadata
   - Falls back to `/store/products` if custom endpoint fails

2. **Fetch dust settings from `dust_product` table** (primary source):
   ```typescript
   GET /store/dust/products?product_ids=id1,id2,id3
   Headers: { 'x-publishable-api-key': 'pk_xxx' }
   ```
   - Returns map of product IDs → dust settings
   - Format: `{ "prod_123": { "dust_only": true, "dust_price": 1000 } }`

3. **Merge settings into products**:
   - Prioritize `dust_product` table settings
   - Fallback to product metadata if table doesn't have settings
   - Fallback to tags if neither exist

**Code Flow** (`lib/medusa-client.ts`):
```typescript
// 1. Fetch products from custom endpoint (includes metadata)
const products = await fetch('/store/products-with-metadata?region_id=xxx')
// Note: This endpoint returns products with a 'dust' object, but we fetch 
// dust settings separately for more control

// 2. Fetch dust settings from dust_product table (primary source)
const dustSettingsResponse = await fetch('/store/dust/products?product_ids=id1,id2,id3')
const dustSettingsMap = dustSettingsResponse.settings // { "prod_123": { dust_only: true, dust_price: 1000 } }

// 3. Transform products and merge dust settings into metadata
products.map(product => {
  // Priority: dust_product table → metadata → title check (for testing)
  const dustSettings = dustSettingsMap[product.id]
  const finalDustOnly = dustSettings?.dust_only || 
                        product.metadata?.dust_only || 
                        product.title?.toLowerCase().includes('dust')
  const finalDustPrice = dustSettings?.dust_price || 
                         product.metadata?.dust_price
  
  return {
    ...product,
    metadata: {
      ...product.metadata,
      dust_only: finalDustOnly,
      dust_price: finalDustPrice,
    },
    // Tags are automatically assigned: 'dust-only' or 'fiat'
  }
})
```

**Important**: The storefront **always fetches dust settings separately** from `/store/dust/products`, even though `/store/products-with-metadata` includes a `dust` object. This ensures we have the most up-to-date settings from the `dust_product` table.

#### Detecting Dust Products

**Key File**: `app/products/page.tsx`

Products are filtered based on `metadata.dust_only` flag:

```typescript
const isDustProduct = 
  product.metadata?.dust_only === true || 
  product.metadata?.dust_only === 'true' || 
  product.metadata?.dust_only === 1 ||
  product.tags?.some(t => t.value === 'dust-only')
```

**Dust products** are shown in a separate section: "Products Available Only with Dust"

**Fiat products** are shown in: "Products Available for Purchase"

**Why multiple checks?** Handles different data types (boolean, string, number) for robustness.

#### Displaying Dust Prices

**Key File**: `lib/utils.ts`

Dust prices are formatted differently from currency:

```typescript
export function formatPrice(amount: number, currency: string): string {
  // Dust prices are stored as full units (e.g., 1000 = 1000 dust)
  // Don't divide by 100 like currency
  if (currency === 'dust' || currency === 'xpf') {
    return `${amount.toLocaleString()} ⚡ Dust`
  }
  
  // Currency prices are in cents, divide by 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}
```

**Example**: 
- Dust product: `dust_price: 1000` → displays as "1,000 ⚡ Dust"
- Fiat product: `amount: 5000` (cents) → displays as "$50.00"

---

## Product Rendering

### Regular Products (Fiat)

**Location**: `app/products/page.tsx`

**Rendering Logic**:
1. Products filtered: `metadata.dust_only !== true` AND no `dust-only` tag
2. Display regular price from `variant.prices[0].amount` (in cents)
3. Format: `formatPrice(amount, currency_code)` → "$50.00"
4. Add to cart uses regular price and currency

**Key Code**:
```typescript
const fiatProducts = products.filter((p) => {
  const dustOnlyValue = p.metadata?.dust_only
  const isDustProduct = dustOnlyValue === true || 
                        dustOnlyValue === 'true' || 
                        dustOnlyValue === 1 ||
                        p.tags?.some(t => t.value === 'dust-only')
  
  return !isDustProduct // Show in fiat section
})
```

### Dust Products

**Location**: `app/products/page.tsx`

**Rendering Logic**:
1. Products filtered: `metadata.dust_only === true` OR has `dust-only` tag
2. Display dust price from `metadata.dust_price` (full units, not cents)
3. Format: `formatPrice(dustPrice, 'dust')` → "1,000 ⚡ Dust"
4. Show dust balance check before allowing add to cart
5. Add to cart uses `dust_price` and `currency_code: 'dust'`

**Key Code**:
```typescript
const dustProducts = products.filter((p) => {
  const dustOnlyValue = p.metadata?.dust_only
  const isDustProduct = dustOnlyValue === true || 
                        dustOnlyValue === 'true' || 
                        dustOnlyValue === 1 ||
                        p.tags?.some(t => t.value === 'dust-only')
  
  return isDustProduct // Show in dust section
})

// When adding to cart:
if (isDustProduct) {
  priceAmount = dustPrice // Use dust_price from metadata
  currencyCode = 'dust'
}
```

### Product Detail Page

**Location**: `app/products/[handle]/page.tsx`

**Logic**:
- Same filtering as products listing page
- Shows product details, images, description
- Displays appropriate price (fiat or dust)
- Shows dust balance for dust products
- Validates dust balance before allowing add to cart

---

## Checkout Process

### Cart Logic

**Key File**: `lib/cart.ts`

**Important Rules**:
1. **Cannot mix currencies**: Dust products and fiat products cannot be in the same cart
2. **Cart currency**: Determined by first product added
3. **Validation**: `addToCart()` throws error if trying to mix currencies

**Code**:
```typescript
// Check if adding a dust product to a cart with fiat products
const isDustProduct = price.currency_code === 'dust' || price.currency_code === 'xpf'
const hasFiatItems = cart.items.some(item => 
  item.price.currency_code !== 'dust' && item.price.currency_code !== 'xpf'
)

if (isDustProduct && hasFiatItems) {
  throw new Error('Cannot add dust products to a cart with regular products...')
}
```

### Checkout Flow

**Key File**: `app/api/checkout/route.ts`

**Steps**:

1. **Validate cart**:
   - Cart exists and has items
   - No mixed currencies

2. **Determine payment method**:
   ```typescript
   const isDustPayment = cart.currency === 'dust' || 
                         cart.currency === 'xpf' || 
                         paymentMethod === 'dust'
   ```

3. **For dust payments**:
   - Validate all items are dust products
   - Check customer dust balance
   - Process dust payment (deduct from balance)
   - Create order with `paymentMethod: 'dust'`

4. **For fiat payments**:
   - Create order with `paymentMethod: 'fiat'`
   - (Stripe integration would go here)

**Dust Payment Validation**:
```typescript
if (isDustPayment) {
  // Ensure all items are dust products
  const hasNonDustItems = cart.items.some(item => 
    item.price.currency_code !== 'dust' && item.price.currency_code !== 'xpf'
  )
  
  if (hasNonDustItems) {
    return error('Dust can only be used for dust-only products')
  }
  
  // Check balance
  const balance = getUserDustBalance(customerId)
  if (balance < cart.total) {
    return error('Insufficient dust balance')
  }
  
  // Process payment
  processDustPayment(customerId, cart.total)
}
```

### Order Creation

**Key File**: `lib/services/checkout.service.ts`

Orders are created with:
- Cart items
- Payment method (`dust` or `fiat`)
- Transaction ID (for dust: generated, for fiat: from payment provider)
- Customer details
- Shipping address

---

## Important Notes & Gotchas

### 1. Product Metadata vs Dust Product Table

**Two sources of truth**:
- **Primary**: `dust_product` table (persistent, managed via admin)
- **Fallback**: Product `metadata.dust_only` and `metadata.dust_price`

**Why both?**
- `dust_product` table is the official source
- Metadata is used as fallback for backwards compatibility
- Storefront checks both, prioritizing `dust_product` table

### 2. Price Format Differences

**Dust prices**: Stored as **full units** (e.g., `1000` = 1000 dust)
**Fiat prices**: Stored as **cents** (e.g., `5000` = $50.00)

**Formatting**:
- Dust: `formatPrice(1000, 'dust')` → "1,000 ⚡ Dust" (no division)
- Fiat: `formatPrice(5000, 'usd')` → "$50.00" (divide by 100)

### 3. Custom Endpoint: `/store/products-with-metadata`

**Why it exists**:
- Standard `/store/products` endpoint doesn't return metadata (security) - [Store Products API](https://docs.medusajs.com/api/store#tag/Product)
- Custom endpoint explicitly includes metadata using Query API - [Query API Docs](https://docs.medusajs.com/resources/development/backend/query)
- Storefront tries custom endpoint first, falls back to standard

**Location**: `medusa-backend/src/api/store/products-with-metadata/route.ts`

**What it returns**:
- Products with `metadata` field included
- Each product includes a `dust` object: `{ dust_only: boolean, dust_price: number | null }`
- **Note**: The storefront doesn't use the `dust` object directly - it fetches dust settings separately from `/store/dust/products` to ensure it has the latest data from the `dust_product` table

**Documentation**: [Creating Custom API Routes](https://docs.medusajs.com/resources/development/backend/api-routes)

### 4. Dust Balance Management

**Current Implementation**:
- Frontend uses **in-memory** balance for testing (`lib/dust-payment.ts`)
- Backend has **database** balance (`dust_balance` table)
- **TODO**: Connect frontend to backend balance API

**Test Endpoint**: `POST /api/dust-balance/test-credit` - Credits 10,000 dust for testing

### 5. Cart Storage

**Current**: In-memory Map (`lib/cart.ts`)
**Production**: Should use database or Redis

**Cart ID**: Stored in HTTP-only cookie (`cart_id`)

### 6. Region Context for Prices

**Documentation**: [Regions & Currencies](https://docs.medusajs.com/resources/store/regions) | [Pricing Context](https://docs.medusajs.com/resources/store/products#pricing-context)

**Important**: Products must be fetched with `region_id` to get correct prices

**Code**:
```typescript
// Get default region first
const regionsResponse = await fetch(`${backendUrl}/store/regions`, {
  headers: { 'x-publishable-api-key': apiKey }
})
const regionId = regionsResponse.regions[0].id

// Fetch products with region_id
const productsUrl = `${backendUrl}/store/products?region_id=${regionId}`
```

### 7. Dust Product Detection

**Priority order** (in `lib/medusa-client.ts`):
1. **Primary**: `dust_product` table settings (via `/store/dust/products` endpoint)
2. **Fallback**: Product `metadata.dust_only` (boolean, string 'true', or number 1)
3. **Temporary**: Product title contains "dust" (for testing until table is populated)
4. **Tag check**: Tag `dust-only` exists (used for filtering in UI)

**Code handles all cases** for robustness and backwards compatibility.

**Important**: The storefront merges dust settings into `metadata` before returning products, so the frontend always checks `metadata.dust_only` regardless of the original source.

### 8. Admin Widget Rebuild

**After modifying admin widgets**:
```bash
cd ~/Documents/Eriks\ Curiosa/medusa-backend
npm run build
# Restart server
```

### 9. Environment Variables

**Backend** (`medusa-backend/.env`):
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - For authentication
- `COOKIE_SECRET` - For sessions

**Frontend** (`custom-store-test/.env`):
- `MEDUSA_BACKEND_URL` - Backend API URL
- `MEDUSA_PUBLISHABLE_API_KEY` - **REQUIRED** for fetching products

### 10. Database Migrations

**Documentation**: [Database Migrations](https://docs.medusajs.com/resources/development/backend/migrations) | [Creating Migrations](https://docs.medusajs.com/resources/development/backend/migrations/create-migration)

**Backend migrations**:
- Located: `medusa-backend/src/modules/dust/migrations/`
- Run: `npx medusa db:migrate`
- Creates: `dust_product`, `dust_balance`, `dust_transaction` tables

---

## Quick Reference

### Backend Project Structure

```
medusa-backend/
├── src/
│   ├── modules/
│   │   └── dust/              # Dust loyalty points module
│   │       ├── service.ts      # Core business logic
│   │       ├── models/        # Database models
│   │       └── migrations/    # Database migrations
│   ├── api/
│   │   ├── admin/             # Admin API endpoints
│   │   │   └── dust/          # Admin dust endpoints
│   │   └── store/             # Store API endpoints
│   │       ├── dust/          # Public dust endpoints
│   │       └── products-with-metadata/  # Custom products endpoint
│   └── admin/
│       └── widgets/
│           └── dust-product-widget.tsx  # Admin UI widget
└── medusa-config.ts           # Medusa configuration
```

### Frontend Project Structure

```
custom-store-test/
├── app/
│   ├── products/
│   │   ├── page.tsx           # Products listing (fiat + dust)
│   │   └── [handle]/page.tsx  # Product detail page
│   ├── checkout/
│   │   └── page.tsx           # Checkout page
│   └── api/
│       ├── products/route.ts  # Products API route
│       ├── cart/route.ts      # Cart API route
│       ├── checkout/route.ts  # Checkout API route
│       └── dust-balance/route.ts  # Dust balance API route
├── lib/
│   ├── medusa-client.ts       # Backend connection & product fetching
│   ├── cart.ts                # Cart logic & storage
│   ├── dust-payment.ts        # Dust payment processing
│   └── utils.ts               # Price formatting utilities
└── .env                       # Environment variables
```

### Key API Endpoints

**Backend Store API** (public):
**✅ Used by Storefront:**
- `GET /store/products-with-metadata` - Products with metadata (used in `lib/medusa-client.ts`)
- `GET /store/dust/products?product_ids=id1,id2` - Dust product settings (used in `lib/medusa-client.ts`)
- `GET /store/dust/balance` - Customer dust balance (used in `app/api/dust-balance/route.ts`)

**❌ Available but Not Used:**
- `POST /store/dust/apply-to-cart` - Apply dust to cart (checkout processes directly)
- `GET /store/dust/transactions` - Dust transaction history (not implemented in frontend)

**Backend Admin API** (requires auth):
- `POST /admin/products/:id/dust` - Set product dust settings
- `GET /admin/products/:id/dust` - Get product dust settings
- `POST /admin/dust/credit` - Credit dust to customer
- `GET /admin/dust/balance/:customer_id` - Get customer balance

**Frontend API Routes**:
- `GET /api/products` - Fetch products from backend
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add/remove/update cart items
- `POST /api/checkout` - Process checkout
- `GET /api/dust-balance` - Get dust balance

---

## Troubleshooting

### Products Not Showing

1. **Check backend is running**: `curl http://localhost:9000/health`
2. **Check API key**: Verify `MEDUSA_PUBLISHABLE_API_KEY` in `.env`
3. **Check products are published**: Admin panel → Products → Status = "Published"
4. **Check API response**: Visit `http://localhost:3000/api/products`

### Dust Products Not Appearing in Dust Section

1. **Check dust settings**: Admin panel → Product → Dust Points Settings widget
2. **Verify `dust_product` table**: Check database for product entry
3. **Check metadata**: Product should have `metadata.dust_only: true`
4. **Check tags**: Product might have `dust-only` tag

### Checkout Failing

1. **Check cart currency**: Ensure all items have same currency
2. **Check dust balance**: For dust products, verify customer has enough dust
3. **Check console errors**: Browser console for error messages
4. **Check API logs**: Backend logs for errors

### Admin Widget Not Showing

1. **Rebuild admin**: `cd medusa-backend && npm run build`
2. **Restart backend**: Restart Medusa server
3. **Clear browser cache**: Hard refresh (Cmd+Shift+R)
4. **Check widget registration**: Verify widget is in `src/admin/widgets/`

---

## Medusa Pricing Plans & Hosting Options

**Documentation**: 
- [Medusa Cloud Pricing](https://docs.medusajs.com/cloud/pricing)
- [Medusa Cloud Overview](https://docs.medusajs.com/cloud)
- [Self-Hosting Medusa](https://docs.medusajs.com/resources/deployment/self-hosting)

### Current Setup: Self-Hosted

**Important**: The current implementation is **self-hosted** - you're running Medusa backend on your own infrastructure (`~/Documents/Eriks Curiosa/medusa-backend`). This means:

- ✅ **No monthly fees** for Medusa platform
- ✅ **Full control** over infrastructure and data
- ✅ **Customizable** without platform restrictions
- ⚠️ **You manage** hosting, scaling, backups, and maintenance
- ⚠️ **You're responsible** for uptime and performance

### Medusa Cloud Plans (If You Choose to Migrate)

If you decide to migrate to **Medusa Cloud** (hosted platform), here are the available plans:

#### 1. Hobby Plan
- **Price**: Starting at **$29/month**
- **Best for**: Developers and small businesses getting started
- **Features**:
  - Core cloud features
  - Basic infrastructure
  - Some limitations (brief downtime during deployments)
  - Single point of failure (may have occasional downtime)
  - **Not recommended for scaling** to production

**Documentation**: [Hobby Plan Details](https://docs.medusajs.com/cloud/pricing#hobby-plan)

#### 2. Pro Plan
- **Price**: Starting at **$299/month**
- **Best for**: Launching and scaling production applications
- **Features**:
  - Everything in Hobby Plan, plus:
  - ✅ Production-ready infrastructure
  - ✅ Concurrent previews
  - ✅ Automatic backups
  - ✅ Multiple cloud seats
  - ✅ Priority support on cloud issues
  - ✅ Better uptime and reliability

**Documentation**: [Pro Plan Details](https://docs.medusajs.com/cloud/pricing#pro-plan)

#### 3. Enterprise Plan
- **Price**: **Custom pricing** (contact Medusa sales)
- **Best for**: Companies with advanced needs and high scale
- **Features**:
  - Everything in Pro Plan, plus:
  - ✅ Medusa platform support
  - ✅ Direct access to core team
  - ✅ SLA-backed uptimes
  - ✅ Custom resource pricing
  - ✅ Upgrade support
  - ✅ Dedicated support channels

**Documentation**: [Enterprise Plan Details](https://docs.medusajs.com/cloud/pricing#enterprise-plan)

### Self-Hosting vs. Medusa Cloud

**Self-Hosting** (Current Setup):
- **Cost**: Infrastructure costs only (servers, databases, etc.)
- **Control**: Full control over everything
- **Maintenance**: You handle updates, backups, scaling
- **Best for**: Teams with DevOps expertise, custom requirements, cost-sensitive projects

**Medusa Cloud**:
- **Cost**: Monthly subscription ($29-$299+)
- **Control**: Managed platform, less customization
- **Maintenance**: Medusa handles infrastructure, updates, backups
- **Best for**: Teams wanting to focus on business logic, need reliability guarantees, want support

**Documentation**: 
- [Self-Hosting Guide](https://docs.medusajs.com/resources/deployment/self-hosting)
- [Medusa Cloud Migration](https://docs.medusajs.com/cloud/migration)
- [Deployment Options](https://docs.medusajs.com/resources/deployment)

### Cost Considerations

**Self-Hosted Costs** (approximate):
- **Server**: $20-100/month (VPS/cloud instance)
- **Database**: $15-50/month (managed PostgreSQL)
- **Storage**: $5-20/month (for product images)
- **CDN**: $10-50/month (optional, for images/assets)
- **Total**: ~$50-220/month (depending on scale)
- **Plus**: Your time for maintenance and updates

**Medusa Cloud Costs**:
- **Hobby**: $29/month (limited, not for production)
- **Pro**: $299/month (production-ready)
- **Enterprise**: Custom (varies by needs)
- **Plus**: May have additional usage-based costs

### Recommendation

**For Production Implementation**:

1. **Start with Self-Hosted** (if you have DevOps resources):
   - Lower cost initially
   - Full control
   - Good for learning and customization
   - Can migrate to Cloud later if needed

2. **Consider Medusa Cloud Pro** (if you want managed infrastructure):
   - Production-ready from day one
   - Automatic backups and updates
   - Priority support
   - Worth the cost if you value time over money

3. **Enterprise Plan** (if you're a large company):
   - Custom pricing and SLA guarantees
   - Direct team access
   - Best for mission-critical applications

**Documentation**: 
- [Pricing Comparison](https://medusajs.com/pricing)
- [Cloud Features](https://docs.medusajs.com/cloud)
- [Self-Hosting Guide](https://docs.medusajs.com/resources/deployment/self-hosting)

---

## Next Steps for Production

1. **Connect frontend dust balance to backend API** (currently in-memory)
2. **Implement customer authentication** (currently using `TEST_USER_ID`)
3. **Add Stripe integration** for fiat payments
4. **Move cart to database** (currently in-memory)
5. **Add order tracking** page
6. **Implement email notifications** (Resend API configured)
7. **Add inventory management** (currently basic)
8. **Add shipping integration**
9. **Add customer accounts** and order history
10. **Add analytics** and reporting

---

## Support & Resources

### Official Medusa Documentation

- **Medusa Documentation**: https://docs.medusajs.com/
- **Getting Started**: https://docs.medusajs.com/resources/getting-started
- **Store API Reference**: https://docs.medusajs.com/api/store
- **Admin API Reference**: https://docs.medusajs.com/api/admin
- **Medusa JS SDK**: https://docs.medusajs.com/resources/js-client/overview
- **Admin Widgets**: https://docs.medusajs.com/resources/admin/widgets
- **Custom Modules**: https://docs.medusajs.com/resources/development/backend/modules
- **API Routes**: https://docs.medusajs.com/resources/development/backend/api-routes
- **Database Migrations**: https://docs.medusajs.com/resources/development/backend/migrations

### Project-Specific Resources

- **Backend Project**: `~/Documents/Eriks Curiosa/medusa-backend`
- **Frontend Project**: `custom-store-test`
- **Backend Setup Guide**: `medusa-backend/SETUP_DUST_PRODUCTS.md`
- **Connection Guide**: `custom-store-test/CONNECT_STOREFRONT_TO_BACKEND.md`

---

## Contact

For questions or issues during implementation, refer to:
- Backend code comments
- Frontend code comments
- This handover document
- Medusa.js official documentation

Good luck with the implementation! 🚀

