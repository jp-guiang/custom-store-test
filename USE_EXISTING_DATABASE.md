# Use Existing Database in TablePlus

## Quick Answer

Since you already have a database in TablePlus, use the `--db-url` flag:

```bash
cd ..
npx create-medusa-app@latest medusa-backend --db-url postgres://medusa_user:password123@localhost:5432/medusa_db
```

**When prompted:**
- **Install Next.js Starter Storefront?** → **No**

That's it! It won't ask about database creation because you already provided the URL.

---

## Option 2: Answer "No" to Database Creation

If you run without the flag:

```bash
cd ..
npx create-medusa-app@latest medusa-backend
```

**When prompted:**
- ✅ **Install Next.js Starter Storefront?** → **No**
- ✅ **Create database?** → **No** ← Important!
- ✅ **Postgres username:** → `medusa_user` (or your TablePlus username)
- ✅ **Postgres password:** → `password123` (or your TablePlus password)
- ✅ **Database name:** → `medusa_db` (or your TablePlus database name)
- ✅ **Host:** → `localhost`
- ✅ **Port:** → `5432`

---

## Get Your Database URL from TablePlus

**In TablePlus:**
1. Right-click your database
2. Select "Copy Connection String"
3. Format: `postgres://username:password@host:port/database_name`

**Example:**
```
postgres://medusa_user:password123@localhost:5432/medusa_db
```

---

## After Setup

Once the backend is created:

1. **Generate secrets:**
   ```bash
   cd medusa-backend
   openssl rand -base64 32  # Copy → JWT_SECRET
   openssl rand -base64 32  # Copy → COOKIE_SECRET
   ```

2. **Add to `medusa-backend/.env`:**
   ```env
   DATABASE_URL=postgres://medusa_user:password123@localhost:5432/medusa_db
   JWT_SECRET=paste-your-jwt-secret-here
   COOKIE_SECRET=paste-your-cookie-secret-here
   MEDUSA_BACKEND_URL=http://localhost:9000
   ```

3. **Run migrations:**
   ```bash
   npm run build
   npx medusa db:migrate
   ```

4. **Create admin user:**
   ```bash
   npx medusa user -e admin@example.com -p supersecret
   ```

5. **Start backend:**
   ```bash
   npm run start
   ```

---

## Verify It Works

- ✅ Backend: `http://localhost:9000/health` → Should return `OK`
- ✅ Admin: `http://localhost:9000/app` → Login with your admin email/password

