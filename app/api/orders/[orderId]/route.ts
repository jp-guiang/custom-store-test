import { NextResponse } from 'next/server'
import { getOrder } from '@/lib/orders'
import type { NextRequest } from 'next/server'

// GET /api/orders/[orderId] - Get a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    
    const order = getOrder(orderId)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Failed to fetch order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

