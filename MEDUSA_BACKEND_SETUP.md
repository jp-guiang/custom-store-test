# Medusa Integration Guide

Complete guide for integrating Medusa.js with your Next.js application. Two approaches available: **Embedded Modules** or **Separate Backend** (Current Setup).

**Documentation:** [Medusa.js Docs](https://docs.medusajs.com/) | [Getting Started](https://docs.medusajs.com/resources/getting-started) | [Modules SDK](https://docs.medusajs.com/resources/commerce-modules/overview)

---

## Overview

**Documentation:** [Medusa Backend Setup](https://docs.medusajs.com/resources/getting-started) | [Admin Dashboard](https://docs.medusajs.com/user-guide/admin/overview)

- **Admin Dashboard** - Built-in admin panel at `http://localhost:9000/app`
- **Product Management** - Add, edit, delete products through UI
- **Dust Product Widget** - Custom admin widget for dust product settings
- **Inventory Management** - Track stock levels, reservations, fulfillment
- **Order Management** - View and process orders
- **Customer Management** - View customer data
- **No Custom Admin Needed** - Everything included!
- **Products fetched via REST API** - Using custom endpoints for metadata support

### Architecture (Current Setup)

```
┌─────────────────┐         ┌──────────────────┐
│  Next.js App    │────────▶│  Medusa Backend  │
│  (Port 3000)    │  REST   │  (Port 9000)     │
│                 │  API    │                  │
│  - Products     │         │  - Products      │
│  - Cart (mem)   │         │  - Dust Module   │
│  - Checkout     │         │  - Database      │
│  - Frontend UI  │         │                  │
│                 │         │  ┌──────────────┐│
│  Embedded:      │         │  │ Admin Panel  ││
│  - Inventory    │         │  │ (Port 9000/  ││
│    Module       │         │  │  app)        ││
└─────────────────┘         │  └──────────────┘│
                             └──────────────────┘
```

**Key Points:**
- Products fetched via REST API from backend
- Inventory managed by embedded module (initialized from backend products)
- Cart/Orders currently in-memory (not using Medusa APIs yet)
- Admin panel runs in backend server

### Why We Use Separate Backend

- Need admin dashboard
- Multiple frontends (web, mobile, etc.)
- Team members need admin access
- Want full Medusa features out of the box

---

**Documentation:** [Medusa Prerequisites](https://docs.medusajs.com/resources/getting-started/prerequisites)
## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud) - **Required for backend**
- Redis (optional, but recommended for backend)
- Publishable API Key - **Required** (get from admin panel)
- Medusa Backend running on port 9000

---

## Step 1: Environment Variables Setup

**Documentation:** [Medusa Environment Variables](https://docs.medusajs.com/resources/getting-started/environment-variables)

### Generate Secrets

Honestly not sure why I needed to do this, because I was able to run it without the secrets, but the docs say I should
be doing this

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Cookie Secret (run again to get different value)
openssl rand -base64 32
```

Copy the output values for your `.env` file.

### Database Setup

**Medusa requires PostgreSQL** - it doesn't work with MySQL/PlanetScale.

#### Local PostgreSQL

```bash
# Mac
brew install postgresql
brew services start postgresql
createdb medusa-db
```

Connection string:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa-db
```

If you use something like table plus the format would look like this
DATABASE_URL=postgress://medusa_user:password:localhost:5432/medusa_db
username = medusa_user
db name = medusa_db

#### Option B: Cloud PostgreSQL (Free Tier, Good for Production)

**Using Supabase (Recommended - Easiest):**
1. Sign up at [supabase.com](https://supabase.com) (free)
2. Create new project
3. Go to Settings → Database
4. Copy "URI" connection string
5. Format: `postgres://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

**Using Neon (Alternative):**
1. Sign up at [neon.tech](https://neon.tech) (free)
2. Create project
3. Copy connection string

**Free Tier Limits:**
- Supabase: 500MB database
- Neon: 3GB database

**Important:** Since we are using PlanetScale:

- **Add PostgreSQL** - Use Supabase/Neon (free) for Medusa only
- **Separate databases** - No conflicts, each serves its purpose

```
Your Next.js App
    ├── PlanetScale (MySQL)
    └── PostgreSQL → Medusa backend data
```

**Documentation:** [Medusa Database Setup](https://docs.medusajs.com/resources/getting-started/database-setup)

### Redis Setup (Optional)

**Documentation:** [Medusa Redis Setup](https://docs.medusajs.com/resources/getting-started/redis-setup)

**Local Redis:**
```bash
brew install redis
brew services start redis
```

Connection string:
```env
REDIS_URL=redis://localhost:6379
```

**Cloud Redis (Optional):**
- Use [Upstash](https://upstash.com) (free tier)

### Complete `.env` File for Backend

Create `.env` in your `medusa-backend/` folder:

```env
# Database (Required - PostgreSQL)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa-db

# Redis (Optional - can skip for POC)
REDIS_URL=redis://localhost:6379

# Secrets (Required - generate these yourself)
JWT_SECRET=paste-your-generated-jwt-secret-here
COOKIE_SECRET=paste-your-generated-cookie-secret-here
```

### Complete `.env` File for Storefront

Create `.env` or `.env.local` in your Next.js project root:

```env
# Medusa Backend URL (REQUIRED)
MEDUSA_BACKEND_URL=http://localhost:9000

# Publishable API Key (REQUIRED - Get from admin panel)
MEDUSA_PUBLISHABLE_API_KEY=pk_your_key_here

# Database (Optional - only if using embedded modules with database)
# DATABASE_URL=postgres://...
```

---

## Step 2: Install Medusa Backend

**Documentation:** [Medusa Installation](https://docs.medusajs.com/resources/getting-started/installation)

1. **Create Medusa Backend Project:**
   ```bash
   npx create-medusa-app@latest medusa-backend
   ```
   
   When prompted:
   - Choose **"Create a new project"**
   - Choose **"Database: PostgreSQL"**
   - Choose **"Redis: Yes"** (optional but recommended)
   - Choose **"Starter Database Seed: Yes"** (includes sample products)

2. **Navigate to Backend Directory:** This needs to be its own directory, not within the store project
   ```bash
   cd medusa-backend
   ```

3. **Update `.env` file** with your values (from Step 1)

4. **Run Database Migrations:**
   ```bash
   npm run build
   npx medusa db:migrate
   ```

5. **Seed Database**
   ```bash
   npx medusa db:seed
   ```

6. **Start Medusa Backend:**
   ```bash
   npm run start
   ```
   
   Backend runs on: `http://localhost:9000`

**Documentation:** [Medusa Development](https://docs.medusajs.com/resources/getting-started/development)

---

## Step 3: Access Admin Dashboard

**Documentation:** [Medusa Admin Dashboard](https://docs.medusajs.com/user-guide/admin/overview)

### Create Admin User

**Option 1: Use Default Seeded Credentials** (if you ran `npx medusa db:seed`)

If you seeded the database, you can use the default admin account:
- Email: `admin@medusa-test.com`
- Password: `supersecret`

**Option 2: Create Your Own Admin User**

Create a new admin user from the CLI:

```bash
cd medusa-backend
npx medusa user -e your-email@example.com -p your-password
```

Replace `your-email@example.com` and `your-password` with your desired credentials.

**Documentation:** [Creating Admin Users](https://docs.medusajs.com/resources/development/backend/create-admin)

### Access Admin

1. **Open Admin Dashboard:**
   ```
   http://localhost:9000/app
   ```

2. **Login with your credentials:**
   - Use the email and password you created (or default credentials if you used seed)

3. **You'll see the admin dashboard!**

### Manage Products

**Documentation:** [Product Management](https://docs.medusajs.com/user-guide/products)

1. **Navigate to Products:**
   - Click "Products" in sidebar
   - View all products

2. **Add New Product:**
   - Click "New Product"
   - Fill in product details:
     - Title, Description
     - Images
     - Variants (size, color, etc.)
     - Prices (USD, Dust, etc.)
     - Inventory quantities
   - Click "Save"

3. **Edit Product:**
   - Click on any product
   - Edit details
   - Update inventory
   - Save changes

### Manage Inventory

**Documentation:** [Inventory Management](https://docs.medusajs.com/user-guide/inventory/inventory)

1. **Go to "Inventory" section** in sidebar
2. **View all inventory items**
3. **Adjust Stock:**
   - Click on an inventory item
   - Update quantity
   - Save changes
4. **View Reservations:**
   - See items reserved in carts
   - Track pending orders

**How Inventory Works:**
- **Reserves inventory** when items added to cart
- **Allocates inventory** when order placed
- **Deducts inventory** when order fulfilled
- **Releases inventory** when order cancelled
- **Tracks reservations** across multiple locations

## Step 4: Connect Next.js Frontend to Separate Backend

**Documentation:** [Medusa JS SDK](https://docs.medusajs.com/resources/js-client/overview)

### Current Setup: Separate Backend (Already Configured)

**Your project is already configured to use a separate Medusa backend!**

#### Environment Variables Required

Add to your Next.js `.env` or `.env.local`:
```env
# Medusa Backend URL (REQUIRED)
MEDUSA_BACKEND_URL=http://localhost:9000

# Publishable API Key (REQUIRED - Get from admin panel)
MEDUSA_PUBLISHABLE_API_KEY=pk_your_key_here

# Database (optional - only if using embedded modules for inventory)
# DATABASE_URL=postgres://...
```

**How to get Publishable API Key:**
1. Start Medusa backend: `cd medusa-backend && npm run start`
2. Open admin: `http://localhost:9000/app`
3. Go to Settings → Publishable API Keys
4. Create new key and copy it
5. Add to `.env` as `MEDUSA_PUBLISHABLE_API_KEY`

#### How Product Fetching Works

**Current Implementation** (`lib/medusa.ts` → `lib/medusa-client.ts`):

1. **Checks for API Key**: If `MEDUSA_PUBLISHABLE_API_KEY` is set, uses backend
2. **Fetches Products**: Uses direct REST API calls (not SDK's `medusa.store.product.list()`)
3. **Custom Endpoints**: 
   - `/store/products-with-metadata` - Gets products WITH metadata (primary), we need this because dust products contain metadata, default sdks wont return this info
   - `/store/products` - Fallback if custom endpoint fails
   - `/store/dust/products` - Gets dust product settings from `dust_product` table
4. **Region Context**: Fetches default region first to get correct prices
5. **Merges Data**: Combines product data with dust settings

**Why not use `medusa.store.product.list()`?**
- Standard SDK method doesn't return product metadata
- We need `metadata.dust_only` and `metadata.dust_price` for dust products
- Custom endpoint explicitly includes metadata using Query API
- Direct REST calls give us more control over region context and pricing

**Code Flow:**
```typescript
// lib/medusa.ts
getProductsFromMedusa()
  ↓
// lib/medusa-client.ts  
getProductsFromBackend()
  ↓
// Direct REST API calls
fetch('/store/products-with-metadata?region_id=xxx')
fetch('/store/dust/products?product_ids=id1,id2')
  ↓
// Merge dust settings into products
  ↓
// Return transformed products
```

#### Verify Connection

1. **Start Medusa backend**: `cd medusa-backend`
2. **Start Next.js app**: `npm run dev`
3. **Check products page**: `http://localhost:3000/products`
   - Should show products from backend admin panel
4. **Check API response**: `http://localhost:3000/api/products`
   - Should show `"source": "medusa-backend"`

#### Embedded Modules Usage

**Embedded modules are still used, but only for inventory:**
- Inventory Module: Used in `lib/inventory.ts` via `initializeInventory()`
- Product Module: NOT used for fetching products (uses backend instead)
- Modules initialized in `lib/medusa-modules.ts` but product fetching bypasses them

---

## Step 5: Dust Loyalty Points Setup

**Documentation:** [Loyalty Points Tutorial](https://docs.medusajs.com/resources/how-to-tutorials/tutorials/loyalty-points)

**Important:** Your project uses a **loyalty points system** (not a custom currency). Dust is managed through a custom Dust module, not as a currency.

### How Dust Works in Your Setup

1. **Custom Dust Module** (`medusa-backend/src/modules/dust/`)
   - Manages dust balances (`dust_balance` table)
   - Tracks transactions (`dust_transaction` table)
   - Stores product settings (`dust_product` table)

2. **Admin Widget** (`medusa-backend/src/admin/widgets/dust-product-widget.tsx`)
   - Appears in admin panel on product pages
   - Allows marking products as "dust-only"
   - Sets dust price for products

3. **Storefront Integration**
   - Products detected by `metadata.dust_only` flag
   - Dust prices from `dust_product` table (via `/store/dust/products` endpoint)
   - Cart uses `currency_code: 'dust'` for dust products (for identification, not as actual currency)

**See:** `DUST_LOYALTY_POINTS_SETUP.md` for complete details on dust implementation.

---

## Comparison: Embedded vs Separate Backend

| Feature | Embedded Modules | Separate Backend |
|--------|-----------------|------------------|
| **Setup Complexity** | Simple | Moderate |
| **Database Required** | Optional (POC) | Required |
| **Admin Dashboard** | No (build custom) | Yes (built-in) |
| **Deployment** | Single app | Two apps |
| **Latency** | Lower (no network) | Higher (API calls) |
| **Development** | Easier (one codebase) | More complex (two codebases) |
| **Best For** | POC, Single app | Production, Multiple frontends |

### Current Setup

- **Using Separate Backend** - Products from admin panel, built-in admin dashboard
- **Embedded Modules** - Used for inventory management only

---

## Additional Resources

- [Medusa Documentation](https://docs.medusajs.com/)
- [Medusa Admin Guide](https://docs.medusajs.com/user-guide/admin/overview)
- [Medusa JS SDK](https://docs.medusajs.com/resources/js-client/overview)
- [Medusa Inventory Module](https://docs.medusajs.com/resources/commerce-modules/inventory)
- [Medusa Product Module](https://docs.medusajs.com/resources/commerce-modules/product)
- [Medusa Community](https://discord.gg/medusajs)
