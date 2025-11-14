import { NextResponse } from 'next/server'
import { getProductsFromMedusa } from '@/lib/medusa'
import { initializeInventory } from '@/lib/inventory'

export async function GET() {
  try {
    // Fetch products from embedded Medusa Product Module
    const products = await getProductsFromMedusa()
    
    // Initialize inventory in embedded Medusa Inventory Module
    // Map products to the format expected by initializeInventory
    const productsForInventory = products
      .filter((p: any) => p.variants !== null && Array.isArray(p.variants))
      .map((p: any) => ({
        id: p.id,
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          sku: v.sku || '',
          inventory_quantity: v.inventory_quantity || 999, // Default quantity
        })),
      }))
    
    // Initialize inventory (creates inventory items if they don't exist)
    await initializeInventory(productsForInventory)
    
    return NextResponse.json({
      products,
      source: 'medusa-embedded',
      note: 'Products fetched from embedded Medusa Product Module. Inventory managed by embedded Medusa Inventory Module.',
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

