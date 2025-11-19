# Seeding Products - Instructions

## The Issue

Embedded Medusa modules don't automatically create database tables when `loadModules` is called. Tables are created when modules are first used (lazy initialization).

## Solution: Two-Step Process

### Step 1: Start Next.js Dev Server (Creates Tables)

```bash
npm run dev
```

**What happens:**
- Next.js starts
- Medusa modules initialize
- When you visit `/api/products`, modules create tables automatically
- Tables are now ready!

### Step 2: Seed Products

**In a new terminal**, run:

```bash
npm run seed
```

**What happens:**
- Connects to database
- Checks for existing products
- Creates 5 products if none exist
- ✅ Done!

---

## Alternative: One-Step Process

If you want to do it all at once:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit this URL in your browser** (triggers table creation):
   ```
   http://localhost:3000/api/products
   ```

3. **Run seed script:**
   ```bash
   npm run seed
   ```

---

## Verify It Worked

After seeding, check your database:

```bash
psql -U medusa_user -d medusa_db -c "SELECT title, handle FROM product;"
```

You should see 5 products:
- Premium T-Shirt
- Wireless Headphones
- Exclusive Digital Art
- VIP Membership Badge
- Gaming Mouse

---

## Why This Happens

Embedded Medusa modules use **lazy initialization**:
- Tables are created when modules are first used
- Not when `loadModules()` is called
- This is different from full Medusa backend (which runs migrations explicitly)

**Solution:** Trigger module usage (like calling `/api/products`) to create tables, then seed.

