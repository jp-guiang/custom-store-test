import { NextResponse } from 'next/server'
import { getUserDustBalance } from '@/lib/dust-payment'
import { TEST_USER_ID } from '@/lib/constants'

/**
 * GET /api/dust-balance
 * Fetches dust balance from Medusa backend
 * Falls back to in-memory balance for testing
 * Note: This requires customer authentication in production
 */
export async function GET() {
  try {
    const backendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
    
    // Try to fetch from backend first
    try {
      const response = await fetch(`${backendUrl}/store/dust/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers when customer auth is implemented
          // 'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_API_KEY || '',
        },
        // For now, we'll need to handle auth differently
        // The backend expects req.auth_context?.actor_id
        // This will need to be updated when customer authentication is implemented
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.balance !== undefined && data.balance !== null) {
          return NextResponse.json({ balance: data.balance })
        }
      }
    } catch (backendError) {
      // Backend might not be available or endpoint doesn't exist yet
      console.log('Backend dust balance not available, using in-memory balance')
    }
    
    // Fallback to in-memory balance (used by checkout)
    // This ensures displayed balance matches checkout balance
    const balance = getUserDustBalance(TEST_USER_ID)
    return NextResponse.json({ balance })
  } catch (error) {
    console.error('Error fetching dust balance:', error)
    // Return in-memory balance on error (graceful degradation)
    const balance = getUserDustBalance(TEST_USER_ID)
    return NextResponse.json({ balance })
  }
}

