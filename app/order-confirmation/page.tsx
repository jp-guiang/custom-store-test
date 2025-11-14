'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Order } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      // In a real app, fetch from API
      // For POC, we'll simulate getting the order
      // The order was just created, so we can reconstruct it from the checkout response
      // For now, show a success message
      setLoading(false)
      // In production, fetch: const res = await fetch(`/api/orders/${orderId}`)
    } else {
      setLoading(false)
    }
  }, [orderId])

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading order...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-label="Order confirmed"
                role="img"
              >
                <title>Order confirmed</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your order has been received.
            </p>
            {orderId && (
              <p className="text-sm text-gray-500 mt-2">
                Order ID: <span className="font-mono">{orderId}</span>
              </p>
            )}
          </div>

          <div className="border-t pt-6 mt-6">
            <p className="text-gray-600 mb-4">
              A confirmation email has been sent to your email address.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You can track your order status in your account dashboard.
            </p>

            <div className="flex gap-4 justify-center">
              <Link
                href="/products"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </Link>
              <Link
                href="/orders"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

