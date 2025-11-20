// Product fetching from Medusa Backend via JS SDK
// Falls back to hardcoded products if backend not available

import { getProductsFromBackend } from './medusa-client'

export async function getProductsFromMedusa() {
  // If publishable API key is configured, prioritize backend
  if (process.env.MEDUSA_PUBLISHABLE_API_KEY) {
    try {
      // Try to fetch from Medusa backend
      const products = await getProductsFromBackend()
      
      // Return products from backend (even if empty array)
      // This ensures products from admin panel show up
      if (products && Array.isArray(products)) {
        return products
      }
      
      // Backend returned something unexpected, return empty
      return []
    } catch (error: any) {
      // If backend fails, log error but don't fall back
      // This ensures we see the error and fix the connection
      console.error('❌ Failed to fetch from Medusa backend:', error.message)
      throw error // Re-throw so API route can handle it
    }
  }
  
  // No API key configured, use fallback for development
  return seedProducts()
}

// Hardcoded products (no database needed for testing)
// Returns products in Medusa-compatible format
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
    {
      title: 'Gaming Mouse',
      description: 'High-precision gaming mouse with RGB lighting',
      handle: 'gaming-mouse',
      status: 'published',
      options: [],
      variants: [
        {
          title: 'Default',
          sku: 'MOUSE-001',
          prices: [
            {
              currency_code: 'usd',
              amount: 4999, // $49.99
            }
          ],
          inventory_quantity: 75,
        }
      ],
      tags: [{ value: 'fiat' }],
    },
  ]

  // Return products in Medusa-compatible format
  return products.map((p, idx) => ({
    id: `prod_${idx + 1}`,
    title: p.title,
    description: p.description,
    handle: p.handle,
    status: p.status,
    images: [],
    options: p.options,
    tags: p.tags,
    variants: p.variants.map((v, vIdx) => ({
      id: `variant_${idx + 1}_${vIdx + 1}`,
      title: v.title,
      sku: v.sku,
      inventory_quantity: v.inventory_quantity,
      prices: v.prices.map((price, pIdx) => ({
        id: `price_${idx + 1}_${vIdx + 1}_${pIdx + 1}`,
        currency_code: price.currency_code,
        amount: price.amount,
      })),
    })),
  }))
}

