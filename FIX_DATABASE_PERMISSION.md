# Fix: Database Already Exists

## The Issue

The database `medusa_db` already exists (you created it in TablePlus), so the Medusa CLI can't create it again.

## Solution: Skip Database Creation

When running `npx create-medusa-app`, choose **"No"** when asked to create the database, since it already exists.

---

## Option 1: Re-run Setup (Recommended)

**Cancel the current setup** (Ctrl+C) and run again:

```bash
npx create-medusa-app@latest medusa-backend
```

**When prompted:**
- ✅ **Install Next.js Starter Storefront?** → **No** (you already have a storefront)
- ✅ **Create database?** → **No** (database already exists)
- ✅ **Postgres username:** → `medusa_user`
- ✅ **Postgres password:** → `password123`
- ✅ **Database name:** → `medusa_db`
- ✅ **Host:** → `localhost`
- ✅ **Port:** → `5432`

---

## Option 2: Manual Setup

If the setup already created the folder, configure it manually:

**1. Navigate to backend folder:**
```bash
cd ../medusa-backend
```

**2. Edit `.env` file:**
```env
DATABASE_URL=postgres://medusa_user:password123@localhost:5432/medusa_db

# Generate secrets:
JWT_SECRET=your-generated-jwt-secret
COOKIE_SECRET=your-generated-cookie-secret

MEDUSA_BACKEND_URL=http://localhost:9000
```

**3. Generate secrets:**
```bash
openssl rand -base64 32  # Copy → JWT_SECRET
openssl rand -base64 32  # Copy → COOKIE_SECRET
```

**4. Run migrations:**
```bash
npm run build
npx medusa db:migrate
```

**5. Create admin user:**
```bash
npx medusa user -e admin@example.com -p supersecret
```

**6. Start backend:**
```bash
npm run start
```

---

## Verify Database Connection

Test that you can connect:

```bash
psql -U medusa_user -d medusa_db -c "SELECT version();"
```

If this works, your database is ready! ✅

---

## Next Steps

Once backend is running:
1. ✅ Backend: `http://localhost:9000/health` → Should return `OK`
2. ✅ Admin: `http://localhost:9000/app` → Login
3. ✅ Seed products: `cd custom-store-test && npm run seed`
4. ✅ Test storefront: `npm run dev` → Visit `http://localhost:3000/products`

