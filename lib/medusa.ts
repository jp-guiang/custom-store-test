// Medusa SDK configuration
// Supports both POC (hardcoded) and production (Medusa backend)

import Medusa from "@medusajs/js-sdk"

// Initialize Medusa SDK
// Set MEDUSA_BACKEND_URL in .env.local to connect to backend
// Example: MEDUSA_BACKEND_URL=http://localhost:9000
export const medusa = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
})

// Fetch products from Medusa backend (if available)
export async function getProductsFromMedusa() {
  try {
    const { products } = await medusa.store.product.list()
    return products
  } catch (error) {
    console.warn('Medusa backend not available, using hardcoded products:', error)
    // Fallback to hardcoded products for POC
    return seedProducts()
  }
}

// Seed products using Medusa's data structure
// Following Medusa.js Product Module schema
// Used as fallback when Medusa backend is not available
export async function seedProducts() {
  const products = [
    {
      title: 'Premium T-Shirt',
      description: 'High-quality cotton t-shirt available in multiple colors',
      handle: 'premium-tshirt',
      status: 'published',
      options: [],
      variants: [
        {
          title: 'Default',
          sku: 'TSHIRT-001',
          prices: [
            {
              currency_code: 'usd',
              amount: 2999, // $29.99
            }
          ],
          inventory_quantity: 100,
        }
      ],
      tags: [{ value: 'fiat' }],
    },
    {
      title: 'Wireless Headphones',
      description: 'Noise-cancelling wireless headphones with premium sound',
      handle: 'wireless-headphones',
      status: 'published',
      options: [],
      variants: [
        {
          title: 'Default',
          sku: 'HEADPHONES-001',
          prices: [
            {
              currency_code: 'usd',
              amount: 9999, // $99.99
            }
          ],
          inventory_quantity: 50,
        }
      ],
      tags: [{ value: 'fiat' }],
    },
    {
      title: 'Exclusive Digital Art',
      description: 'Limited edition digital artwork - Dust only!',
      handle: 'exclusive-digital-art',
      status: 'published',
      options: [],
      variants: [
        {
          title: 'Default',
          sku: 'ART-DUST-001',
          prices: [
            {
              currency_code: 'dust',
              amount: 5000, // 5000 dust
            }
          ],
          inventory_quantity: 999,
        }
      ],
      tags: [{ value: 'dust-only' }],
    },
    {
      title: 'VIP Membership Badge',
      description: 'Show off your status with this exclusive VIP badge - Dust only!',
      handle: 'vip-membership-badge',
      status: 'published',
      options: [],
      variants: [
        {
          title: 'Default',
          sku: 'VIP-DUST-001',
          prices: [
            {
              currency_code: 'dust',
              amount: 10000, // 10000 dust
            }
          ],
          inventory_quantity: 999,
        }
      ],
      tags: [{ value: 'dust-only' }],
    },
  ]

  // Return products using Medusa's data structure
  // This follows Medusa.js Product Module schema
  return products.map((p, idx) => ({
    id: `prod_${idx + 1}`,
    ...p,
    images: [], // Medusa product images array
    variants: p.variants.map((v, vIdx) => ({
      id: `variant_${idx + 1}_${vIdx + 1}`,
      ...v,
      prices: v.prices.map((price, pIdx) => ({
        id: `price_${idx + 1}_${vIdx + 1}_${pIdx + 1}`,
        ...price,
      })),
    })),
  }))
}

// Usage:
// - For POC: Products are hardcoded (seedProducts)
// - For Production: Use getProductsFromMedusa() to fetch from backend
// 
// The API route (app/api/products/route.ts) will automatically use
// getProductsFromMedusa() which falls back to seedProducts() if backend unavailable

