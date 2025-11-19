import { NextResponse } from 'next/server'
import { getProductsFromMedusa } from '@/lib/medusa'
import { initializeInventory } from '@/lib/inventory'

export async function GET() {
  try {
    // Fetch products from Medusa backend (or fallback to hardcoded)
    // Disable caching to ensure we get fresh data from backend
    const products = await getProductsFromMedusa()
    
    // Determine source for response
    const source = process.env.MEDUSA_PUBLISHABLE_API_KEY 
      ? 'medusa-backend' 
      : 'fallback-hardcoded'
    
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
      source,
      count: products.length,
      note: source === 'medusa-backend' 
        ? 'Products fetched from Medusa backend. Inventory managed by embedded Medusa Inventory Module.'
        : 'Using fallback products. Configure MEDUSA_PUBLISHABLE_API_KEY to connect to backend.',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

