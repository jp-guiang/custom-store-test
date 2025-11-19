# Clear Steps - What You Need To Do

## What You Have
✅ PostgreSQL database in TablePlus (`medusa_db`)  
✅ Next.js app ready to connect to Medusa backend

## What You Need
✅ A separate Medusa backend server that uses your existing database

---

## Simple Steps

### Step 1: Create Medusa Backend Folder

The setup is probably stuck. **Cancel it (Ctrl+C)** and let's do it manually:

```bash
# Go to parent directory
cd ..

# Create backend folder manually
mkdir medusa-backend
cd medusa-backend

# Initialize npm project
npm init -y
```

### Step 2: Install Medusa

```bash
npm install @medusajs/medusa
```

### Step 3: Create Basic Files

**Create `medusa-config.js`:**
```javascript
module.exports = {
  projectConfig: {
    database_url: "postgres://medusa_user:password123@localhost:5432/medusa_db",
    database_type: "postgres",
  },
}
```

**Create `.env`:**
```env
DATABASE_URL=postgres://medusa_user:password123@localhost:5432/medusa_db
JWT_SECRET=$(openssl rand -base64 32)
COOKIE_SECRET=$(openssl rand -base64 32)
MEDUSA_BACKEND_URL=http://localhost:9000
```

**Generate secrets:**
```bash
openssl rand -base64 32  # Copy → JWT_SECRET
openssl rand -base64 32  # Copy → COOKIE_SECRET
```

### Step 4: Run Migrations

```bash
npx medusa db:migrate
```

### Step 5: Create Admin User

```bash
npx medusa user -e admin@example.com -p supersecret
```

### Step 6: Start Backend

```bash
npx medusa start
```

---

## OR: Use the Official CLI (Simpler)

Actually, let's use the official way but skip database creation:

```bash
cd ..
npx create-medusa-app@latest medusa-backend --skip-db
```

Then configure `.env` manually with your database URL.

---

## What Happens Next

1. ✅ Backend runs on `http://localhost:9000`
2. ✅ You seed products: `cd custom-store-test && npm run seed`
3. ✅ Your Next.js app fetches from backend: `npm run dev`

---

## The Key Point

**You DON'T need to create a database** - you already have it!  
**You just need a Medusa backend** that connects to your existing database.

