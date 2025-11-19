# Connect Storefront to Medusa Backend

This guide explains how to connect your Next.js storefront to your Medusa backend so products from the admin panel show up in your storefront.

## Prerequisites

- ✅ Medusa backend is running on `http://localhost:9000`
- ✅ You have products in your Medusa backend (created via admin panel)
- ✅ Backend is accessible (test with: `curl http://localhost:9000/health`)

## Step 1: Get Publishable API Key

The Medusa backend requires a **Publishable API Key** to allow your storefront to fetch products.

### Option A: Via Admin Dashboard (Recommended)

1. **Open Medusa Admin Panel:**
   - Navigate to: `http://localhost:9000/app`
   - Login with your admin credentials

2. **Go to Settings:**
   - Click on **Settings** in the sidebar
   - Click on **Publishable API Keys**

3. **Create or Copy Existing Key:**
   - If you see an existing key, click on it to view details
   - If no key exists, click **"Create Publishable API Key"**
     - Name: `Storefront Key` (or any name you prefer)
     - Click **"Create"**

4. **Copy the Key:**
   - Click on the key you just created
   - Copy the **"Key"** value (it looks like: `pk_xxxxxxxxxxxxx`)

### Option B: Via API (Advanced)

If you prefer using the API:

```bash
# First, get an admin token (replace with your admin credentials)
curl -X POST http://localhost:9000/admin/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'

# Then create a publishable key (replace TOKEN with the token from above)
curl -X POST http://localhost:9000/admin/publishable-api-keys \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Storefront Key"
  }'
```

## Step 2: Add API Key to Environment Variables

1. **Open your `.env` file** in the storefront root directory:
   ```bash
   # Location: custom-store-test/.env
   ```

2. **Add the publishable API key:**
   ```env
   DATABASE_URL=postgres://medusa_user:password123@localhost:5432/medusa_db

   # Medusa Backend URL
   MEDUSA_BACKEND_URL=http://localhost:9000

   # Medusa Publishable API Key (required to fetch products from backend)
   # Get this from Medusa Admin Panel: Settings → Publishable API Keys
   MEDUSA_PUBLISHABLE_API_KEY=pk_your_key_here
   ```

3. **Replace `pk_your_key_here`** with the actual key you copied from Step 1

## Step 3: Restart Your Development Server

After adding the API key, restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 4: Verify Connection

1. **Check the products page:**
   - Navigate to: `http://localhost:3000/products`
   - Products from your Medusa backend should now appear!

2. **Check the browser console:**
   - Open Developer Tools (F12)
   - Look for: `✅ Fetched X products from Medusa backend`

3. **Check the API response:**
   - Visit: `http://localhost:3000/api/products`
   - You should see:
     ```json
     {
       "products": [...],
       "source": "medusa-backend",
       "count": X,
       "note": "Products fetched from Medusa backend..."
     }
     ```

## Troubleshooting

### Error: "Publishable API key required"

**Solution:** Make sure you've added `MEDUSA_PUBLISHABLE_API_KEY` to your `.env` file and restarted the dev server.

### Error: "Failed to fetch products from Medusa backend"

**Check:**
1. Is the backend running? Test with: `curl http://localhost:9000/health`
2. Is the API key correct? Double-check it in the admin panel
3. Check the backend logs for any errors

### Products not showing up

**Check:**
1. Are products published in the admin panel? (Status should be "Published")
2. Do products have variants and prices configured?
3. Check browser console for error messages
4. Check the API response at `/api/products` to see what's being returned

### Still seeing fallback products

**Solution:** The code falls back to hardcoded products if:
- `MEDUSA_PUBLISHABLE_API_KEY` is not set
- Backend connection fails

Make sure the API key is set correctly and the backend is running.

## How It Works

1. **Storefront** (`custom-store-test`) uses `@medusajs/js-sdk` to connect to backend
2. **Backend** (`medusa-backend`) serves products via REST API
3. **Publishable API Key** authenticates storefront requests
4. Products are fetched from backend and displayed in your storefront

## Next Steps

Once connected:
- ✅ Products from admin panel will automatically appear in storefront
- ✅ Any changes in admin panel will reflect in storefront (after refresh)
- ✅ You can manage products entirely through the Medusa admin panel

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   Next.js Storefront │         │  Medusa Backend      │
│   (Port 3000)       │────────▶│  (Port 9000)         │
│                     │         │                      │
│  - Products Page    │         │  - Admin Panel       │
│  - Cart            │         │  - Product API       │
│  - Checkout        │         │  - Database          │
└─────────────────────┘         └──────────────────────┘
         │                                │
         │                                │
         └──────────────┬─────────────────┘
                        │
                ┌───────▼────────┐
                │   PostgreSQL    │
                │   Database      │
                └─────────────────┘
```

