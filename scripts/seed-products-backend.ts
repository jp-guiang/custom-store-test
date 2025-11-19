// Script to seed products into Medusa Backend via Admin API
// Run with: npx tsx scripts/seed-products-backend.ts
// Requires: Medusa backend running on http://localhost:9000

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env') })

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || 'supersecret'

interface Product {
  title: string
  description: string
  handle: string
  status: 'published' | 'draft'
  options: Array<{ title: string; values: string[] }>
  variants: Array<{
    title: string
    sku: string
    prices: Array<{
      currency_code: string
      amount: number
    }>
    inventory_quantity: number
  }>
  tags: Array<{ value: string }>
}

const products: Product[] = [
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

async function login() {
  const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to login: ${response.statusText}`)
  }

  const data = await response.json()
  return data.user?.session?.access_token || data.access_token
}

async function createProduct(token: string, product: Product) {
  const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create product ${product.handle}: ${response.statusText} - ${error}`)
  }

  return response.json()
}

async function main() {
  try {
    console.log('🔐 Logging in to Medusa backend...')
    const token = await login()
    console.log('✅ Logged in successfully')

    console.log(`\n📦 Seeding ${products.length} products...`)
    
    for (const product of products) {
      try {
        console.log(`  Creating: ${product.title}...`)
        await createProduct(token, product)
        console.log(`  ✅ Created: ${product.title}`)
      } catch (error: any) {
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log(`  ⚠️  Skipped: ${product.title} (already exists)`)
        } else {
          console.error(`  ❌ Failed: ${product.title}`, error.message)
        }
      }
    }

    console.log(`\n✅ Successfully seeded products!`)
    console.log(`\nVisit: ${MEDUSA_BACKEND_URL}/app to see products in admin dashboard`)
    
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Failed to seed products:', error.message)
    console.error('\nMake sure:')
    console.error('  1. Medusa backend is running: npm run start (in medusa-backend folder)')
    console.error('  2. Admin user exists: npx medusa user -e admin@example.com -p supersecret')
    console.error('  3. Backend URL is correct:', MEDUSA_BACKEND_URL)
    process.exit(1)
  }
}

main()

