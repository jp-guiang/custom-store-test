import { NextResponse } from 'next/server'
import { getUserDustBalance } from '@/lib/dust-payment'
import { TEST_USER_ID } from '@/lib/constants'

export async function GET() {
  try {
    const balance = getUserDustBalance(TEST_USER_ID)
    return NextResponse.json({ balance })
  } catch (error) {
    console.error('Error fetching dust balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dust balance' },
      { status: 500 }
    )
  }
}

