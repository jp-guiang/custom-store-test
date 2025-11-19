// Script to seed products into Medusa Product Module database
// Run with: npx tsx scripts/seed-products.ts

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') })

import { seedProductsToDatabase } from '../lib/medusa'
import { initializeMedusaModules } from '../lib/medusa-modules'

async function main() {
  try {
    console.log('Initializing Medusa modules...')
    console.log('This will create database tables automatically if they don\'t exist...')
    await initializeMedusaModules()
    
    // Wait a moment for migrations to complete
    console.log('Waiting for database migrations to complete...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Seeding products to database...')
    const products = await seedProductsToDatabase()
    
    console.log(`✅ Successfully seeded ${products.length} products to database!`)
    console.log('\nProducts:')
    products.forEach((p: any) => {
      console.log(`  - ${p.title} (${p.handle})`)
    })
    
    process.exit(0)
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      console.error('❌ Database tables do not exist yet.')
      console.error('This might mean migrations haven\'t run yet.')
      console.error('\nTry running: npm run dev')
      console.error('Then visit http://localhost:3000/api/products to trigger initialization')
      console.error('Then run this seed script again.')
    } else {
      console.error('❌ Failed to seed products:', error)
    }
    process.exit(1)
  }
}

main()

