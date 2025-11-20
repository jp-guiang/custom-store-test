import { NextResponse } from 'next/server'
import { addDust, getUserDustBalance } from '@/lib/dust-payment'
import { TEST_USER_ID } from '@/lib/constants'

/**
 * POST /api/dust-balance/test-credit
 * Test endpoint to credit 10000 dust to test user
 * For testing purposes only - remove in production
 */
export async function POST() {
  try {
    const amount = 10000
    
    // Credit dust using in-memory system (used by checkout)
    const newBalance = addDust(TEST_USER_ID, amount)
    
    // Also try to credit via backend if endpoint exists
    const backendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
    try {
      const response = await fetch(`${backendUrl}/store/dust/credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          // Note: In production, this would use actual customer ID from auth
        }),
      })
      
      if (response.ok) {
        const backendData = await response.json()
        return NextResponse.json({
          success: true,
          message: `Credited ${amount.toLocaleString()} dust`,
          balance: backendData.balance || newBalance,
          source: 'backend',
        })
      }
    } catch (backendError) {
      // Backend endpoint might not exist yet, that's okay
      console.log('Backend credit endpoint not available, using in-memory balance')
    }
    
    return NextResponse.json({
      success: true,
      message: `Credited ${amount.toLocaleString()} dust`,
      balance: newBalance,
      source: 'in-memory',
    })
  } catch (error) {
    console.error('Error crediting dust:', error)
    return NextResponse.json(
      { error: 'Failed to credit dust', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dust-balance/test-credit
 * Check current balance
 */
export async function GET() {
  try {
    const balance = getUserDustBalance(TEST_USER_ID)
    return NextResponse.json({
      balance,
      userId: TEST_USER_ID,
    })
  } catch (error) {
    console.error('Error fetching dust balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dust balance' },
      { status: 500 }
    )
  }
}

