# Medusa Backend Setup Guide

Complete guide to setting up Medusa backend with Admin Dashboard for inventory management, product management, and order processing.

**Documentation:** [Medusa.js Docs](https://docs.medusajs.com/) | [Getting Started](https://docs.medusajs.com/resources/getting-started) | [Admin Dashboard](https://docs.medusajs.com/user-guide/admin/overview)

---

## Overview

**No Medusa account needed!** Medusa is open-source and self-hosted. You generate all secrets locally and set up your own database.

### What You Get

- ✅ **Admin Dashboard** - Built-in admin panel at `http://localhost:9000/app`
- ✅ **Product Management** - Add, edit, delete products through UI
- ✅ **Inventory Management** - Track stock levels, reservations, fulfillment
- ✅ **Order Management** - View and process orders
- ✅ **Customer Management** - View customer data
- ✅ **No Custom Admin Needed** - Everything included!

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Redis (optional, but recommended)

**Documentation:** [Medusa Prerequisites](https://docs.medusajs.com/resources/getting-started/prerequisites)

---

## Step 1: Environment Variables Setup

**Documentation:** [Medusa Environment Variables](https://docs.medusajs.com/resources/getting-started/environment-variables)

### Generate Secrets

No Medusa account needed - generate secrets yourself:

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Cookie Secret (run again to get different value)
openssl rand -base64 32
```

Copy the output values for your `.env` file.

### Database Setup

**Medusa requires PostgreSQL** - it doesn't work with MySQL/PlanetScale.

#### Option A: Local PostgreSQL (Free, Good for Development)

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

#### Using PlanetScale? (Separate Databases Required)

**Important:** If you're using PlanetScale for your existing website:

- ✅ **Keep PlanetScale** - Continue using it for your website
- ✅ **Add PostgreSQL** - Use Supabase/Neon (free) for Medusa only
- ✅ **Separate databases** - No conflicts, each serves its purpose

Your architecture:
```
Your Next.js App
    ├── PlanetScale (MySQL) → Your existing website data
    └── PostgreSQL → Medusa backend data
```

**Documentation:** [Medusa Database Setup](https://docs.medusajs.com/resources/getting-started/database-setup)

### Redis Setup (Optional)

**Documentation:** [Medusa Redis Setup](https://docs.medusajs.com/resources/getting-started/redis-setup)

You can skip Redis for POC/testing. For production, it's recommended.

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

### Complete `.env` File

Create `.env` in your `medusa-backend/` folder:

```env
# Database (Required - PostgreSQL)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa-db

# Redis (Optional - can skip for POC)
REDIS_URL=redis://localhost:6379

# Secrets (Required - generate these yourself)
JWT_SECRET=paste-your-generated-jwt-secret-here
COOKIE_SECRET=paste-your-generated-cookie-secret-here

# Backend URL
MEDUSA_BACKEND_URL=http://localhost:9000
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

2. **Navigate to Backend Directory:**
   ```bash
   cd medusa-backend
   ```

3. **Update `.env` file** with your values (from Step 1)

4. **Run Database Migrations:**
   ```bash
   npm run build
   npx medusa db:migrate
   ```

5. **Seed Database (if you chose starter seed):**
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

### Access Admin

1. **Open Admin Dashboard:**
   ```
   http://localhost:9000/app
   ```

2. **Login with default credentials:**
   - Email: `admin@medusa-test.com`
   - Password: `supersecret`

3. **You'll see the admin dashboard!** ✨

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
- ✅ **Reserves inventory** when items added to cart
- ✅ **Allocates inventory** when order placed
- ✅ **Deducts inventory** when order fulfilled
- ✅ **Releases inventory** when order cancelled
- ✅ **Tracks reservations** across multiple locations

**Documentation:** [Inventory Module](https://docs.medusajs.com/resources/commerce-modules/inventory)

### Manage Orders

**Documentation:** [Order Management](https://docs.medusajs.com/user-guide/orders)

1. **View Orders:**
   - Click "Orders" in sidebar
   - See all customer orders

2. **Process Orders:**
   - Click on an order
   - Update fulfillment status
   - Mark as shipped

---

## Step 4: Connect Next.js Frontend

**Documentation:** [Medusa JS SDK](https://docs.medusajs.com/resources/js-client/overview)

### Update Environment Variables

Add to your Next.js `.env.local`:
```env
# Medusa Backend URL
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_BACKEND_URL=http://localhost:9000
```

### Code Already Supports Backend!

Your code already supports Medusa backend connection:

- ✅ `lib/medusa.ts` - Automatically tries backend first, falls back to hardcoded products
- ✅ `app/api/products/route.ts` - Fetches from backend if available

**How it works:**
1. Set `MEDUSA_BACKEND_URL` in `.env.local`
2. Products automatically fetch from backend
3. Falls back to hardcoded products if backend unavailable

### Verify Connection

1. Start Medusa backend: `npm run start` (in `medusa-backend/` folder)
2. Start Next.js app: `npm run dev` (in your project folder)
3. Visit products page - should show products from backend
4. Check browser console/network tab to verify API calls

---

## Step 5: Custom Currency (Dust) Setup

**Documentation:** [Currency Module](https://docs.medusajs.com/resources/commerce-modules/currency)

To add "Dust" as a custom currency in Medusa:

### Via Admin Dashboard

1. Go to **Settings** → **Currencies**
2. Add custom currency:
   - Code: `dust`
   - Name: `Dust`
   - Symbol: `⚡`

### Via API/Code

You'll need to extend Medusa's currency module to support custom currencies. This requires backend customization.

**For POC:** Keep using the current approach (hardcoded dust prices) until you set up custom currency support in Medusa backend.

---

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│  Next.js App    │────────▶│  Medusa Backend  │
│  (Port 3000)    │  API    │  (Port 9000)     │
│                 │         │                  │
│  - Products     │         │  - Products      │
│  - Cart         │         │  - Cart          │
│  - Checkout     │         │  - Orders        │
│  - Frontend UI  │         │  - Inventory     │
└─────────────────┘         └──────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  Medusa Admin    │
                            │  (Port 9000/app) │
                            │                  │
                            │  - Manage Products│
                            │  - Manage Orders │
                            │  - Inventory     │
                            └──────────────────┘
```

---

## Troubleshooting

**Documentation:** [Medusa Troubleshooting](https://docs.medusajs.com/resources/troubleshooting)

### Backend Won't Start
- Check PostgreSQL is running: `pg_isready`
- Check Redis is running (if using): `redis-cli ping`
- Verify `.env` file has correct database URL
- Check backend logs for errors

### Can't Connect Frontend to Backend
- Ensure backend is running on port 9000
- Check CORS settings in Medusa backend
- Verify `MEDUSA_BACKEND_URL` in `.env.local`
- Check browser console for API errors

### Admin Dashboard Not Loading
- Clear browser cache
- Check backend logs for errors
- Verify admin credentials
- Ensure backend is running

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `createdb medusa-db`
- For cloud databases, check firewall/network settings

---

## Common Questions

### Q: Do I need a Medusa account?
**A:** No! Medusa is open-source and self-hosted. No account needed.

### Q: Can I use PlanetScale/MySQL?
**A:** No, Medusa requires PostgreSQL. Use separate databases - PlanetScale for your website, PostgreSQL for Medusa.

### Q: Do I need Redis?
**A:** Not for POC/testing. Recommended for production.

### Q: Can I use SQLite?
**A:** No, Medusa requires PostgreSQL.

### Q: How do I get the secrets?
**A:** Generate them yourself using `openssl rand -base64 32`

### Q: Do I need to build an admin panel?
**A:** No! Medusa Admin is included. Just set up the backend and access it at `http://localhost:9000/app`

---

## Next Steps

1. ✅ Backend running on port 9000
2. ✅ Admin dashboard accessible
3. ✅ Frontend connected to backend
4. 🔄 Migrate cart/checkout to use Medusa APIs
5. 🔄 Set up custom Dust currency in backend
6. 🔄 Configure payment providers (Stripe, etc.)

**Documentation:** [Medusa Next Steps](https://docs.medusajs.com/resources/getting-started/next-steps)

---

## Additional Resources

- [Medusa Documentation](https://docs.medusajs.com/)
- [Medusa Admin Guide](https://docs.medusajs.com/user-guide/admin/overview)
- [Medusa JS SDK](https://docs.medusajs.com/resources/js-client/overview)
- [Medusa Inventory Module](https://docs.medusajs.com/resources/commerce-modules/inventory)
- [Medusa Product Module](https://docs.medusajs.com/resources/commerce-modules/product)
- [Medusa Community](https://discord.gg/medusajs)
