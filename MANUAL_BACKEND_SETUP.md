# Manual Backend Setup (Database Already Exists)

## The Issue

Medusa CLI tries to create the database, but it already exists. We'll configure it manually instead.

---

## Step 1: Let Setup Complete

**Let the setup finish** (even if it shows the database error). It will still create the folder structure.

Once you see the error, press **Enter** or **Ctrl+C** to continue/exit.

---

## Step 2: Navigate to Backend Folder

```bash
cd ../medusa-backend
```

---

## Step 3: Configure .env File

**Edit `medusa-backend/.env`:**

```env
# Database (use existing database)
DATABASE_URL=postgres://medusa_user:password123@localhost:5432/medusa_db

# Generate secrets (run these commands):
# openssl rand -base64 32  → JWT_SECRET
# openssl rand -base64 32  → COOKIE_SECRET

JWT_SECRET=paste-your-generated-secret-here
COOKIE_SECRET=paste-your-generated-secret-here

# Backend URL
MEDUSA_BACKEND_URL=http://localhost:9000

# Optional: Redis (if you have it installed)
# REDIS_URL=redis://localhost:6379
```

**Generate secrets:**
```bash
openssl rand -base64 32  # Copy this → JWT_SECRET
openssl rand -base64 32  # Copy this → COOKIE_SECRET
```

---

## Step 4: Install Dependencies

```bash
cd medusa-backend
npm install
```

---

## Step 5: Run Migrations

```bash
npm run build
npx medusa db:migrate
```

This will create all the tables in your existing database.

---

## Step 6: Create Admin User

```bash
npx medusa user -e admin@example.com -p supersecret
```

---

## Step 7: Start Backend

```bash
npm run start
```

Backend should start on: `http://localhost:9000`

**Verify:**
- Health: http://localhost:9000/health → Should return `OK`
- Admin: http://localhost:9000/app → Login with admin@example.com / supersecret

---

## Step 8: Seed Products

**From your Next.js project:**

```bash
cd ../custom-store-test
npm run seed
```

---

## Troubleshooting

### "Database does not exist"
- The database exists, but Medusa might need to verify connection
- Check DATABASE_URL is correct
- Test connection: `psql -U medusa_user -d medusa_db -c "SELECT 1;"`

### "Permission denied"
- Database exists, so migrations should work
- If migrations fail, check user has CREATE TABLE permissions

### Backend won't start
- Check DATABASE_URL format
- Verify PostgreSQL is running: `pg_isready`
- Check port 9000 is available: `lsof -i :9000`

---

## Quick Commands Summary

```bash
# 1. Navigate to backend
cd ../medusa-backend

# 2. Generate secrets
openssl rand -base64 32  # → JWT_SECRET
openssl rand -base64 32  # → COOKIE_SECRET

# 3. Edit .env (add DATABASE_URL and secrets)

# 4. Install & build
npm install
npm run build

# 5. Run migrations
npx medusa db:migrate

# 6. Create admin
npx medusa user -e admin@example.com -p supersecret

# 7. Start backend
npm run start
```

