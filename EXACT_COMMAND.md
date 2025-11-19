# Exact Command To Run

## Cancel Current Setup

Press **Ctrl+C** to cancel the current setup.

## Run This Exact Command

```bash
cd ..
npx create-medusa-app@latest medusa-backend --db-url postgres://medusa_user:password123@localhost:5432/medusa_db
```

**Important:** The `--db-url` flag tells it to:
- ✅ Skip database creation
- ✅ Use your existing database
- ✅ Still run migrations

## When Prompted

- **Install Next.js Starter Storefront?** → **No**

That's it! It won't ask about database creation because you already provided the URL.

---

## Why This Works

The `--db-url` flag bypasses the database creation step entirely and uses your existing database directly.

