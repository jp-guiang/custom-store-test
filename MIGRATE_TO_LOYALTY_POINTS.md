# Migrating from XPF Currency to Loyalty Points System

This guide explains how to migrate from using XPF currency (hack) to a proper loyalty points system using Medusa's built-in dust module.

## Current State

✅ **Backend Already Has Dust Module!**
- Located at: `medusa-backend/src/modules/dust`
- Has API routes: `/store/dust/balance`, `/store/dust/apply-to-cart`
- Uses proper database storage (not in-memory)

## Migration Steps

### Step 1: Remove XPF Currency from Products

1. **In Medusa Admin Panel:**
   - Go to Products
   - For each product that uses XPF:
     - Remove XPF price
     - Add EUR/USD price instead
   - Products should now be priced in regular currency

2. **Update Product Tags:**
   - Remove `dust-only` tag from products
   - Products will be available for regular purchase
   - Dust redemption will be handled via promotions (see Step 2)

### Step 2: Create Dust Redemption Promotions

Instead of pricing products in XPF, create promotions that allow customers to redeem dust:

**In Medusa Admin → Promotions:**

1. **Create a "Dust Redemption" Promotion:**
   - Type: Fixed amount discount
   - Rules: Customer must have sufficient dust balance
   - Application: Apply discount equal to dust amount redeemed

2. **Or use Dynamic Promotions:**
   - Create promotions that customers can apply at checkout
   - Promotion validates dust balance
   - Deducts dust when applied

### Step 3: Update Storefront Code

#### Remove XPF Currency Handling

**Files to Update:**
- `lib/utils.ts` - Remove XPF handling from `formatPrice()`
- `lib/cart.ts` - Remove XPF normalization
- `app/products/page.tsx` - Remove XPF filtering
- `app/checkout/page.tsx` - Remove XPF payment handling
- `lib/medusa-client.ts` - Remove XPF tag assignment

#### Update Dust Balance API

The storefront already calls `/api/dust-balance` which now calls the backend. However, **customer authentication is required**.

**Current Issue:**
- Backend requires `req.auth_context?.actor_id` (authenticated customer)
- Storefront currently doesn't have customer authentication

**Solutions:**

**Option A: Add Customer Authentication (Recommended)**
- Implement Medusa customer authentication
- Store customer session/token
- Pass auth headers to backend API

**Option B: Temporary Test Endpoint**
- Create a test endpoint in backend that accepts customer_id as query param
- Use for development/testing only
- Remove before production

**Option C: Use Admin API (Not Recommended)**
- Use admin API with admin token
- Not secure for storefront use

### Step 4: Update Checkout Flow

Instead of checking currency, use promotions:

1. **Customer applies dust promotion** at checkout
2. **Backend validates** dust balance via promotion rules
3. **Dust is deducted** when order is placed
4. **Order completes** with discount applied

## Implementation Checklist

- [ ] Remove XPF currency from all products in admin
- [ ] Price products in EUR/USD
- [ ] Create dust redemption promotions
- [ ] Remove XPF handling from `lib/utils.ts`
- [ ] Remove XPF handling from `lib/cart.ts`
- [ ] Remove XPF filtering from `app/products/page.tsx`
- [ ] Update checkout to use promotions instead of currency check
- [ ] Implement customer authentication (or test endpoint)
- [ ] Test dust balance API with authenticated customer
- [ ] Test dust redemption flow

## Reference

- [Medusa Loyalty Points Tutorial](https://docs.medusajs.com/resources/how-to-tutorials/tutorials/loyalty-points)
- [Medusa Promotions](https://docs.medusajs.com/commerce-modules/promotion)
- [Medusa Customer Authentication](https://docs.medusajs.com/commerce-modules/customer)

