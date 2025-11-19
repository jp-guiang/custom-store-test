# Quick Start: Medusa Backend Setup

## Your Database Info
- **Database:** `medusa_db`
- **User:** `medusa_user`
- **Password:** `password123`
- **Host:** `localhost:5432`
- **Connection String:** `postgres://medusa_user:password123@localhost:5432/medusa_db`

---

## Step 1: Create Medusa Backend

```bash
# Go to parent directory
cd ..

# Create backend
npx create-medusa-app@latest medusa-backend

# When prompted:
# - Database: PostgreSQL
# - Redis: Yes (or No if you don't have Redis)
# - Starter Database Seed: No
```

---

## Step 2: Configure Backend

**Edit `medusa-backend/.env`:**

```env
DATABASE_URL=postgres://medusa_user:password123@localhost:5432/medusa_db

# Generate secrets:
openssl rand -base64 32  # → JWT_SECRET
openssl rand -base64 32  # → COOKIE_SECRET

JWT_SECRET=paste-generated-secret-here
COOKIE_SECRET=paste-generated-secret-here

MEDUSA_BACKEND_URL=http://localhost:9000

# Optional (if you installed Redis):
REDIS_URL=redis://localhost:6379
```

---

## Step 3: Run Migrations

```bash
cd medusa-backend
npm run build
npx medusa db:migrate
```

---

## Step 4: Create Admin User

```bash
cd medusa-backend
npx medusa user -e admin@example.com -p supersecret
```

---

## Step 5: Start Backend

```bash
cd medusa-backend
npm run start
```

**Verify:**
- Health check: http://localhost:9000/health → Should return `OK`
- Admin dashboard: http://localhost:9000/app → Login with admin@example.com / supersecret

---

## Step 6: Seed Products

**From your Next.js project folder:**

```bash
cd custom-store-test
npm run seed
```

This will create 5 products in your Medusa backend.

---

## Step 7: Start Next.js Storefront

```bash
cd custom-store-test
npm run dev
```

**Visit:** http://localhost:3000/products

Products should now be fetched from Medusa backend! 🎉

---

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL is correct
- Check if port 9000 is available: `lsof -i :9000`

### Can't login to admin
- Make sure admin user exists: `npx medusa user`
- Check JWT_SECRET and COOKIE_SECRET are set

### Products not showing
- Make sure backend is running
- Check MEDUSA_BACKEND_URL in .env matches backend URL
- Run seed script: `npm run seed`

---

## Architecture

```
Next.js Storefront (Port 3000)
    ↓ HTTP API calls
Medusa Backend (Port 9000)
    ↓
PostgreSQL Database (TablePlus)
```

Both Next.js and Medusa backend use the **same database**!

