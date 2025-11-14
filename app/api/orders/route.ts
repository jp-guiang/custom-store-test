import { NextResponse } from 'next/server'
import { getUserOrders } from '@/lib/orders'
import { TEST_USER_ID } from '@/lib/constants'

// GET /api/orders - Get all orders for the current user
export async function GET() {
  try {
    // In production, get userId from session/auth
    const userId = TEST_USER_ID
    
    const orders = getUserOrders(userId)
    
    // Sort by createdAt descending (newest first)
    const sortedOrders = orders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    return NextResponse.json({ 
      orders: sortedOrders,
      count: sortedOrders.length 
    })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

