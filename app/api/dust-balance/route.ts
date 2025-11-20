import { NextResponse } from 'next/server'

/**
 * GET /api/dust-balance
 * Fetches dust balance from Medusa backend
 * Note: This requires customer authentication in production
 */
export async function GET() {
  try {
    const backendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
    
    
    // Call Medusa backend dust balance API
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
    
    if (!response.ok) {
      // If unauthorized, return 0 balance (customer not logged in)
      if (response.status === 401) {
        return NextResponse.json({ balance: 0 })
      }
      
      throw new Error(`Backend returned ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json({ balance: data.balance || 0 })
  } catch (error) {
    console.error('Error fetching dust balance:', error)
    // Return 0 balance on error (graceful degradation)
    return NextResponse.json({ balance: 0 })
  }
}

