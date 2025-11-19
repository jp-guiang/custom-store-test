# Setup Separate Medusa Backend - Step by Step

## Overview

We're switching from embedded modules to a **separate Medusa backend**:
- ✅ **Next.js Storefront** → Uses Medusa JS SDK to call backend API
- ✅ **Medusa Backend** → Full Medusa server with admin dashboard
- ✅ **Shared PostgreSQL** → Both use same database

---

## Step 1: Create Medusa Backend Project

```bash
# Go to parent directory (or wherever you want the backend)
cd ..

# Create Medusa backend
npx create-medusa-app@latest medusa-backend

# When prompted:
# - Project name: medusa-backend
# - Database: PostgreSQL
# - Redis: Yes (optional but recommended)
# - Starter Database Seed: No (we'll seed our own products)
```

---

## Step 2: Configure Backend Database

**Get your DATABASE_URL from TablePlus:**
- In TablePlus, right-click your database → "Copy Connection String"
- Format: `postgres://user:password@localhost:5432/database_name`

**Update `medusa-backend/.env`:**

```env
# Use YOUR existing PostgreSQL database
DATABASE_URL=postgres://medusa_user:password123@localhost:5432/medusa_db

# Redis (optional - install with: brew install redis)
REDIS_URL=redis://localhost:6379

# Generate secrets (run these commands):
# openssl rand -base64 32  # For JWT_SECRET
# openssl rand -base64 32  # For COOKIE_SECRET (run again)
JWT_SECRET=your-generated-jwt-secret-here
COOKIE_SECRET=your-generated-cookie-secret-here

# Backend URL
MEDUSA_BACKEND_URL=http://localhost:9000
```

**Generate Secrets:**
```bash
cd medusa-backend
openssl rand -base64 32  # Copy this → JWT_SECRET
openssl rand -base64 32  # Copy this → COOKIE_SECRET
```

---

## Step 3: Run Migrations

```bash
cd medusa-backend
npm run build
npx medusa db:migrate
```

This creates all the database tables Medusa needs.

---

## Step 4: Create Admin User

```bash
cd medusa-backend
npx medusa user -e admin@example.com -p supersecret
```

---

## Step 5: Start Medusa Backend

```bash
cd medusa-backend
npm run start
```

Backend runs on: `http://localhost:9000`

**Verify it's working:**
- Visit: `http://localhost:9000/health` (should return `OK`)
- Visit: `http://localhost:9000/app` (admin dashboard)

---

## Step 6: Update Next.js Storefront

We'll update your Next.js app to use Medusa JS SDK instead of embedded modules.

**Changes needed:**
1. Update `lib/medusa.ts` to use Medusa JS SDK
2. Remove embedded module initialization
3. Configure Medusa client to point to backend

---

## Step 7: Seed Products

**Option A: Via Admin Dashboard**
1. Login to `http://localhost:9000/app`
2. Go to Products → New Product
3. Add products manually

**Option B: Via API**
```bash
# Use Medusa API to create products
curl -X POST http://localhost:9000/admin/products \
  -H "Content-Type: application/json" \
  -d '{"title": "Premium T-Shirt", ...}'
```

**Option C: Via Seed Script**
We'll create a script that uses Medusa JS SDK to seed products.

---

## Step 8: Test Everything

1. **Backend:** `http://localhost:9000/health` → Should return `OK`
2. **Admin:** `http://localhost:9000/app` → Login and see dashboard
3. **Storefront:** `http://localhost:3000/products` → Should fetch from backend

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Next.js App   │────────▶│  Medusa Backend  │
│  (Port 3000)   │  HTTP   │   (Port 9000)    │
│                 │         │                   │
│  Uses JS SDK   │         │  Admin Dashboard  │
└─────────────────┘         └────────┬─────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │  PostgreSQL  │
                              │  (TablePlus)  │
                              └──────────────┘
```

---

## Next Steps

1. ✅ Create Medusa backend project
2. ✅ Configure database connection
3. ✅ Run migrations
4. ✅ Create admin user
5. ✅ Start backend
6. ⏳ Update Next.js to use JS SDK
7. ⏳ Seed products
8. ⏳ Test everything

Let's start! 🚀

