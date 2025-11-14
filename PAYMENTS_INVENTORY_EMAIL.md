# Payments, Inventory & Email - Implementation Guide

## 1. Email Notifications ✅

### Current Status
- ✅ **Email service created** (`lib/email.ts`)
- ✅ **Order confirmation emails** sent after checkout
- ⚠️ **Currently logging** emails (for POC)
- 🔄 **Ready for production** integration

### How It Works
When an order is placed:
1. Order is created
2. Email service is called with order details
3. Email is logged to console (POC)
4. In production, integrates with SendGrid/Resend/Mailgun

### Production Setup
To enable real emails, uncomment and configure in `lib/email.ts`:

```typescript
// Example with Resend:
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({
  from: 'orders@yourstore.com',
  to: email,
  subject: emailContent.subject,
  html: emailContent.html,
})
```

**Required:**
- Email service API key (Resend, SendGrid, etc.)
- Environment variable: `RESEND_API_KEY` or `SENDGRID_API_KEY`

---

## 2. How Medusa Handles Payments

### Medusa's Payment System

Medusa uses a **Payment Provider** system with these concepts:

#### Payment Providers
Medusa supports multiple payment providers:
- **Stripe** (most common)
- **PayPal**
- **Manual** (bank transfers, etc.)
- **Custom providers** (like our Dust payment!)

#### Payment Flow in Medusa

1. **Create Payment Sessions**
   ```typescript
   // Medusa creates payment sessions for available providers
   await medusa.carts.createPaymentSessions(cartId)
   ```

2. **Select Payment Method**
   ```typescript
   // Customer selects payment provider
   await medusa.carts.setPaymentSession(cartId, {
     provider_id: 'stripe'
   })
   ```

3. **Authorize Payment**
   ```typescript
   // Payment is authorized (not charged yet)
   await medusa.carts.authorizePayment(cartId)
   ```

4. **Complete Cart**
   ```typescript
   // This captures the payment and creates the order
   await medusa.carts.complete(cartId)
   ```

#### Our Current Implementation

**What we're doing:**
- ✅ Custom Dust payment provider (simulated)
- ✅ Fiat payment simulation
- ⚠️ Not using Medusa's payment provider system yet

**What Medusa would do:**
- Payment providers registered in backend
- Payment sessions created automatically
- Multiple payment options available
- Payment authorization workflow
- Automatic payment capture on order completion

#### To Use Full Medusa Payment System

1. **Set up Medusa Backend** with payment providers:
   ```typescript
   // In Medusa backend config
   {
     payment_providers: [
       {
         resolve: "@medusajs/payment-stripe",
         options: {
           api_key: process.env.STRIPE_API_KEY
         }
       }
     ]
   }
   ```

2. **Create Payment Sessions**:
   ```typescript
   // In checkout flow
   const { cart } = await medusa.carts.createPaymentSessions(cartId)
   // cart.payment_sessions contains available payment methods
   ```

3. **Select & Authorize**:
   ```typescript
   await medusa.carts.setPaymentSession(cartId, { provider_id: 'stripe' })
   await medusa.carts.authorizePayment(cartId)
   ```

4. **Complete Order**:
   ```typescript
   const { type, data } = await medusa.carts.complete(cartId)
   // Payment is captured, order is created
   ```

---

## 3. Inventory Management

### Current Status
- ⚠️ **Products are hardcoded** in `lib/medusa.ts`
- ⚠️ **Inventory quantities** are hardcoded in product variants
- ✅ **Inventory management system** created (`lib/inventory.ts`)
- 🔄 **Ready to integrate** with product system

### How We're Managing Products Now

**Hardcoded Products:**
```typescript
// lib/medusa.ts - Products are defined in code
const products = [
  {
    title: 'Premium T-Shirt',
    variants: [{
      inventory_quantity: 100  // Hardcoded!
    }]
  }
]
```

**Problems:**
- ❌ Can't add/edit products without code changes
- ❌ No admin interface
- ❌ Inventory not tracked dynamically
- ❌ No stock updates

### How Medusa Manages Inventory

Medusa has an **Inventory Module** that:
- Tracks stock levels per variant
- Handles reservations (when items in cart)
- Manages fulfillment (when order ships)
- Supports multiple locations/warehouses
- Provides inventory APIs

**Medusa Inventory Flow:**
1. **Product Created** → Inventory item created
2. **Added to Cart** → Inventory reserved
3. **Order Placed** → Inventory allocated
4. **Order Fulfilled** → Inventory deducted
5. **Order Cancelled** → Inventory released

### Our Inventory System (Created)

I've created `lib/inventory.ts` with:
- ✅ Inventory tracking per variant
- ✅ Availability checking
- ✅ Reservation system
- ✅ Fulfillment tracking
- ✅ Stock level management

**To Use:**
```typescript
import { initializeInventory, checkAvailability, reserveInventory } from '@/lib/inventory'

// Initialize from products
await initializeInventory(products)

// Check if product available
if (checkAvailability(variantId, quantity)) {
  // Reserve inventory
  reserveInventory(variantId, quantity)
}
```

### Moving to Dynamic Products

**Option 1: Medusa Backend (Recommended)**
- Set up full Medusa backend
- Use Medusa Admin to manage products
- Products stored in database
- Inventory managed by Medusa Inventory Module

**Option 2: Database + Admin Panel**
- Create product database schema
- Build admin panel for product management
- Use our inventory system
- More work, but full control

**Option 3: Keep Hardcoded (POC Only)**
- Fine for testing
- Not scalable
- Good for demos

---

## Summary

### ✅ What We Have
1. **Email Service** - Ready, just needs API key
2. **Custom Payment** - Dust payment working
3. **Inventory System** - Created, needs integration
4. **Hardcoded Products** - Working for POC

### 🔄 What's Missing for Production
1. **Real Email Service** - Add Resend/SendGrid API key
2. **Medusa Payment Providers** - Integrate Stripe/PayPal
3. **Dynamic Products** - Move to database or Medusa backend
4. **Inventory Integration** - Connect inventory system to checkout
5. **Admin Panel** - For managing products/inventory

### 📝 Next Steps
1. **For Email**: Add `RESEND_API_KEY` to `.env.local`
2. **For Payments**: Set up Medusa backend or integrate Stripe directly
3. **For Products**: Choose Option 1 (Medusa) or Option 2 (Custom DB)
4. **For Inventory**: Integrate `lib/inventory.ts` into checkout flow

