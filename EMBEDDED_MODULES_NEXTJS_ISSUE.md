# Embedded Medusa Modules + Next.js Issue

## The Problem

Embedded Medusa modules use **dynamic `require()`** calls that Next.js webpack can't statically analyze. This causes:

```
Error: Cannot find module '@medusajs/product'
```

## Why This Happens

1. Medusa modules use `require()` with dynamic paths
2. Next.js webpack tries to bundle everything statically
3. Webpack can't resolve dynamic requires at build time
4. Module resolution fails

## Current Status

**Embedded Medusa modules may not work reliably in Next.js API routes** due to webpack bundling limitations.

## Solutions

### Option 1: Use Separate Medusa Backend (Recommended)

Instead of embedded modules, use a **separate Medusa backend**:

1. **Storefront (Next.js):** Use Medusa JS SDK to call backend API
2. **Backend (Medusa):** Full Medusa server with admin dashboard
3. **Shared Database:** Both connect to same PostgreSQL

**Benefits:**
- ✅ No webpack issues
- ✅ Admin dashboard included
- ✅ Production-ready
- ✅ Better separation of concerns

**See:** `HYBRID_SETUP_GUIDE.md`

### Option 2: Use Edge Runtime (Experimental)

Try using Edge Runtime for API routes (may have limitations):

```typescript
export const runtime = 'edge'
```

### Option 3: Server-Only Initialization

Ensure modules only initialize server-side:

```typescript
// Only import in API routes, never in client components
if (typeof window === 'undefined') {
  // Initialize modules
}
```

### Option 4: Use Hardcoded Products (Current Fallback)

For now, the code falls back to hardcoded products when modules fail:

```typescript
// lib/medusa.ts
export async function getProductsFromMedusa() {
  try {
    // Try Medusa modules
    const productModule = await getProductModule()
    // ...
  } catch (error) {
    // Fallback to hardcoded
    return seedProducts()
  }
}
```

**Current State:** ✅ App works with hardcoded products

## Recommendation

**For production:** Use **Option 1 (Separate Backend)** - it's the most reliable approach.

**For development/POC:** Continue using hardcoded products (current fallback) until you're ready to set up the separate backend.

## Next Steps

1. **Short term:** Keep using hardcoded products (works now)
2. **Long term:** Set up separate Medusa backend per `HYBRID_SETUP_GUIDE.md`

