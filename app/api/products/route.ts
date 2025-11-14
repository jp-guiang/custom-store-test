import { NextResponse } from 'next/server'
import { getProductsFromMedusa } from '@/lib/medusa'
import { initializeInventory } from '@/lib/inventory'

export async function GET() {
  try {
    // Try to fetch from Medusa backend first
    // Falls back to hardcoded products if backend unavailable
    const products = await getProductsFromMedusa()
    
    // Initialize inventory from products
    // This ensures inventory is tracked for all products
    // Map products to the format expected by initializeInventory
    const productsForInventory = products
      .filter(p => p.variants !== null && Array.isArray(p.variants))
      .map(p => ({
        id: p.id,
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          sku: v.sku || '',
          inventory_quantity: v.inventory_quantity || 0,
        })),
      }))
    
    initializeInventory(productsForInventory)
    
    // Determine source
    const isBackend = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    
    return NextResponse.json({
      products,
      source: isBackend ? 'medusa-backend' : 'medusa-hardcoded',
      note: isBackend 
        ? 'Products fetched from Medusa backend' 
        : 'Products are hardcoded. Set MEDUSA_BACKEND_URL to connect to backend.',
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

