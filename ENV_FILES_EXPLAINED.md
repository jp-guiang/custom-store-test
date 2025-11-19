# Environment Variables - Where They Go

## Medusa Backend `.env` (medusa-backend/.env)

**These secrets are ONLY for the backend:**

```env
# Database connection
DATABASE_URL=postgres://medusa_user:password123@localhost:5432/medusa_db

# Backend secrets (generate with openssl)
JWT_SECRET=your-generated-secret-here
COOKIE_SECRET=your-generated-secret-here

# Backend URL
MEDUSA_BACKEND_URL=http://localhost:9000

# Optional: Redis
REDIS_URL=redis://localhost:6379
```

**Why:** These are used by the backend server to:
- Sign authentication tokens (JWT_SECRET)
- Encrypt cookies (COOKIE_SECRET)
- Connect to database (DATABASE_URL)

---

## Next.js Frontend `.env` (custom-store-test/.env)

**Only needs the backend URL:**

```env
# Database (not needed for frontend, but harmless if left)
DATABASE_URL=postgres://medusa_user:password123@localhost:5432/medusa_db

# Backend URL (tells frontend where to connect)
MEDUSA_BACKEND_URL=http://localhost:9000
```

**Why:** The frontend only needs to know:
- Where the backend API is (MEDUSA_BACKEND_URL)
- It doesn't need JWT_SECRET or COOKIE_SECRET (those are backend-only)

---

## Summary

| Variable | Backend `.env` | Frontend `.env` |
|----------|----------------|-----------------|
| `DATABASE_URL` | ✅ Yes | ❌ No (not needed) |
| `JWT_SECRET` | ✅ Yes | ❌ No |
| `COOKIE_SECRET` | ✅ Yes | ❌ No |
| `MEDUSA_BACKEND_URL` | ✅ Yes | ✅ Yes |

---

## Quick Answer

**Secrets (JWT_SECRET, COOKIE_SECRET):**
- ✅ **Backend only** (`medusa-backend/.env`)
- ❌ **NOT in frontend** (`custom-store-test/.env`)

**Backend URL:**
- ✅ **Both** (so frontend knows where to connect)

---

## Security Note

**Never put backend secrets in the frontend!** The frontend is public code, so secrets would be exposed. Only the backend needs them for authentication.

