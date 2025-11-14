# Custom Store Test - Medusa.js Proof of Concept

A Next.js e-commerce proof of concept with Medusa.js integration, featuring custom currency ("dust") support.

## Features

- ✅ Welcome page with link to products
- ✅ Product listing page with 4 products:
  - 2 products available for purchase with fiat currency (USD)
  - 2 products available ONLY with dust currency
- ✅ Shopping cart functionality (add, remove items)
- ✅ Custom dust payment provider
- ✅ Checkout flow with payment processing
- ✅ Order confirmation and redirect back to products page
- ✅ Dust balance display
- ✅ Success notifications
- ✅ Shopify-like address autocomplete (Google Places API)
- ✅ Country detection and address suggestions
- ✅ Medusa backend integration support (see MEDUSA_BACKEND_SETUP.md)

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Medusa.js** (Commerce modules - embedded approach)
  - `@medusajs/product` - Product Module
  - `@medusajs/pricing` - Pricing Module
  - `@medusajs/currency` - Currency Module
  - `@medusajs/js-sdk` - Medusa JavaScript SDK

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Configure environment variables (optional):**
   Create `.env.local` file:
   ```env
   # For Google Places API address autocomplete (optional)
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key
   
   # For Medusa backend connection (optional)
   MEDUSA_BACKEND_URL=http://localhost:9000
   NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
   
   # For email notifications (optional)
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
custom-store-test/
├── app/
│   ├── api/
│   │   ├── products/route.ts      # Product listing API
│   │   ├── cart/route.ts          # Cart management API
│   │   ├── checkout/route.ts      # Checkout and payment processing
│   │   └── dust-balance/route.ts  # Dust balance API
│   ├── products/
│   │   └── page.tsx               # Products listing page
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Welcome page
│   └── globals.css                # Global styles
├── lib/
│   ├── cart.ts                    # Cart management logic
│   ├── dust-payment.ts            # Dust payment provider
│   └── orders.ts                  # Order management
└── package.json
```

## How It Works

### Products

The store has 4 products:
1. **Premium T-Shirt** - $29.99 (Fiat)
2. **Wireless Headphones** - $99.99 (Fiat)
3. **Exclusive Digital Art** - 5,000 ⚡ Dust (Dust only)
4. **VIP Membership Badge** - 10,000 ⚡ Dust (Dust only)

### Cart System

- Cart is stored in memory (for POC)
- Cart ID is stored in cookies
- Supports adding/removing items
- Shows total price in appropriate currency

### Dust Payment

- Test user starts with **50,000 dust**
- Dust-only products check balance before allowing add to cart
- Payment deducts dust from user balance
- Generates transaction ID for tracking

### Checkout Flow

1. User adds products to cart
2. Clicks "Checkout" button
3. System processes payment:
   - For dust: Validates balance and deducts dust
   - For fiat: Simulates payment (would integrate Stripe in production)
4. Creates order with transaction ID
5. Clears cart
6. Redirects to products page with success message

## API Keys Required

**For this POC: None required!**

The proof of concept uses in-memory storage and simulated payments. For production, you would need:

- **Database**: PostgreSQL connection string
- **Email Service**: SendGrid/Resend API key (for order notifications)
- **Payment Processing**: Stripe API keys (for fiat payments)
- **Redis**: Connection string (optional, for caching)

## Testing the Flow

1. Visit the welcome page at `/`
2. Click "View All Products"
3. Add products to cart (both fiat and dust products)
4. View cart summary at the top of products page
5. Click "Checkout" to process payment
6. You'll be redirected back to products page with success message
7. Cart will be cleared and dust balance updated

## Medusa.js Integration

This project uses **Medusa.js embedded modules** approach (Option B from the research):

- ✅ Medusa Product Module initialized in `lib/medusa.ts`
- ✅ Products fetched using Medusa's data structures
- ✅ Medusa-compatible product schema
- ✅ Ready to connect to full Medusa backend when needed

**Current Architecture:**
- Embedded Medusa modules in Next.js API routes
- In-memory storage for POC (no database required)
- Products use Medusa's data structure
- Can easily migrate to full Medusa backend later

**To use a full Medusa backend:**
1. Follow the guide in `MEDUSA_BACKEND_SETUP.md`
2. Set `MEDUSA_BACKEND_URL` in `.env.local`
3. Products will automatically fetch from backend (falls back to hardcoded if unavailable)
4. Access Medusa Admin at `http://localhost:9000/app`

## Notes

- This is a proof of concept using in-memory storage
- Cart and orders are stored in memory (will reset on server restart)
- Dust balance is initialized to 50,000 for test user
- Products are fetched through Medusa Product Module initialization
- In production, you'd integrate with:
  - Full Medusa backend server OR
  - Database for persistent storage with embedded modules
  - Real payment providers (Stripe for fiat)
  - User authentication system
  - Email notification service
  - Medusa Admin dashboard

## Next Steps for Production

1. Set up PostgreSQL database
2. Integrate Medusa Admin dashboard
3. Add user authentication
4. Integrate Stripe for fiat payments
5. Set up email notifications
6. Add order tracking page
7. Implement persistent cart storage
8. Add product images
9. Set up inventory management
