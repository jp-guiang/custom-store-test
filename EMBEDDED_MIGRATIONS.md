# Database Migrations for Embedded Medusa Modules

## Quick Answer

**You don't need to run `medusa db:migrate` in your Next.js project!**

Embedded Medusa modules handle migrations automatically when they initialize with a database connection.

---

## How Migrations Work with Embedded Modules

### Automatic Migrations

When you configure embedded Medusa modules with a database connection, they automatically:

1. **Create tables** on first initialization
2. **Run migrations** when modules start up
3. **Update schema** if modules are updated

**No manual migration commands needed!**

### Example Flow

```typescript
// lib/medusa-modules.ts
export async function initializeMedusaModules() {
  medusaApp = await loadModules({
    modulesConfig: {
      [Modules.PRODUCT]: {
        resolve: "@medusajs/product",
        options: {
          database: {
            clientUrl: process.env.DATABASE_URL,  // ← Database connection
            schema: "public",
          },
        },
      },
      // ... other modules
    },
    sharedResourcesConfig: {
      database: {
        clientUrl: process.env.DATABASE_URL,  // ← Shared database config
      },
    },
  })
  
  // Modules automatically create tables here!
  // No manual migration needed
}
```

**When you run `npm run dev`:**
1. Next.js starts
2. `initializeMedusaModules()` is called
3. Modules connect to database
4. **Tables are created automatically** ✅
5. Your app is ready!

---

## When Do You Need `medusa db:migrate`?

### ❌ NOT for Embedded Modules

**Don't run `medusa db:migrate` in your Next.js project:**
```bash
# ❌ This will fail (you're seeing this error)
npx medusa db:migrate
```

**Why it fails:**
- Your Next.js project doesn't have `medusa-config.js`
- Medusa CLI expects a full backend project structure
- Embedded modules handle migrations differently

### ✅ ONLY for Separate Medusa Backend

**Run `medusa db:migrate` ONLY in the separate Medusa backend project:**

```bash
# ✅ This works (in medusa-backend folder)
cd medusa-backend
npx medusa db:migrate
```

**Why it works:**
- Separate backend has `medusa-config.js`
- Full Medusa project structure
- Uses Medusa's migration system

---

## Step-by-Step: Setting Up Database

### Step 1: Set Up PostgreSQL

```bash
# Local PostgreSQL
brew install postgresql
brew services start postgresql
createdb medusa-db
```

**Or use cloud (Supabase/Neon):**
- Get connection string from dashboard
- Add to `.env.local`

### Step 2: Add Database URL

**`.env.local`:**
```env
DATABASE_URL=postgres://user:password@host:5432/database
```

### Step 3: Update Module Configuration

**`lib/medusa-modules.ts`:**
```typescript
[Modules.PRODUCT]: {
  resolve: "@medusajs/product",
  options: {
    database: {
      clientUrl: process.env.DATABASE_URL,  // ← Add this
      schema: "public",
    },
  },
},
```

### Step 4: Start Your App

```bash
npm run dev
```

**That's it!** Tables are created automatically on first run.

---

## Troubleshooting

### Error: "Cannot connect to database"

**Check:**
- ✅ PostgreSQL is running (`pg_isready`)
- ✅ `DATABASE_URL` is correct in `.env.local`
- ✅ Database exists (`createdb medusa-db`)
- ✅ User has permissions

### Error: "Tables already exist"

**This is fine!** Modules detect existing tables and skip creation.

### Error: "Migration failed"

**Check:**
- Database connection is valid
- User has CREATE TABLE permissions
- No conflicting schema changes

### Want to Reset Database?

**Drop and recreate:**
```bash
# Drop database
dropdb medusa-db

# Recreate
createdb medusa-db

# Restart Next.js (tables will be recreated)
npm run dev
```

---

## Summary

| Scenario | Command Needed? |
|----------|----------------|
| **Embedded Modules (Next.js)** | ❌ No - Automatic |
| **Separate Medusa Backend** | ✅ Yes - `npx medusa db:migrate` |

**For your Next.js project:**
1. ✅ Set up PostgreSQL
2. ✅ Add `DATABASE_URL` to `.env.local`
3. ✅ Update `lib/medusa-modules.ts` with database config
4. ✅ Run `npm run dev` (tables created automatically)
5. ❌ **Don't run `medusa db:migrate`**

**For separate Medusa backend (admin dashboard):**
1. ✅ Set up PostgreSQL (same database)
2. ✅ Configure `medusa-backend/.env`
3. ✅ Run `npx medusa db:migrate` (in backend folder)
4. ✅ Start backend: `npm run start`

---

## Key Takeaway

**Embedded modules = Automatic migrations** 🎉

Just configure the database connection and start your app. The modules handle everything else!

