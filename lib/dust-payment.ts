// Dust payment provider for custom currency
// In production, this would integrate with your user balance system

import { TEST_USER_ID, DEFAULT_DUST_BALANCE } from './constants'
import { generateId } from './utils'

// In-memory user balances for POC
// In production, this would be stored in database
const userBalances: Map<string, number> = new Map()

// Initialize a test user with dust balance
userBalances.set(TEST_USER_ID, DEFAULT_DUST_BALANCE)

export function getUserDustBalance(userId: string = TEST_USER_ID): number {
  return userBalances.get(userId) || 0
}

export function deductDust(
  userId: string = TEST_USER_ID,
  amount: number
): { success: boolean; newBalance: number; error?: string } {
  const currentBalance = getUserDustBalance(userId)

  if (currentBalance < amount) {
    return {
      success: false,
      newBalance: currentBalance,
      error: 'Insufficient dust balance',
    }
  }

  const newBalance = currentBalance - amount
  userBalances.set(userId, newBalance)

  return {
    success: true,
    newBalance,
  }
}

export function addDust(
  userId: string = TEST_USER_ID,
  amount: number
): number {
  const currentBalance = getUserDustBalance(userId)
  const newBalance = currentBalance + amount
  userBalances.set(userId, newBalance)
  return newBalance
}

export function processDustPayment(
  userId: string = TEST_USER_ID,
  amount: number
): { success: boolean; transactionId?: string; error?: string } {
  const result = deductDust(userId, amount)

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    }
  }

  // Generate transaction ID
  const transactionId = generateId('dust_tx')

  return {
    success: true,
    transactionId,
  }
}

