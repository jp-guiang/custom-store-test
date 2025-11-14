import { NextResponse } from 'next/server'
import { getProductsFromMedusa, seedProducts } from '@/lib/medusa'
import { initializeInventory } from '@/lib/inventory'

export async function GET() {
  try {
    // Try to fetch from Medusa backend first
    // Falls back to hardcoded products if backend unavailable
    const products = await getProductsFromMedusa()
    
    // Initialize inventory from products
    // This ensures inventory is tracked for all products
    initializeInventory(products)
    
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

