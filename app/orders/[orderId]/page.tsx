'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Order } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

const STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_STEPS = [
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
] as const

function getStatusStepIndex(status: Order['status']): number {
  const index = STATUS_STEPS.findIndex(step => step.key === status)
  return index >= 0 ? index : 0
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Order not found')
          }
          throw new Error('Failed to fetch order')
        }
        const data = await res.json()
        setOrder(data.order)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-xl text-center py-12">Loading order...</div>
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error || 'Order not found'}</p>
            <Link
              href="/orders"
              className="mt-4 inline-block text-red-600 hover:underline"
            >
              ← Back to Orders
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const currentStepIndex = getStatusStepIndex(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/orders"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Orders
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order #{order.id.slice(-8).toUpperCase()}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {formatPrice(order.total, order.currency)}
                </div>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
            </div>
          </div>

          {/* Tracking Status */}
          {!isCancelled && (
            <div className="px-6 py-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
              <div className="relative">
                <div className="flex justify-between">
                  {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index <= currentStepIndex
                    const isCurrent = index === currentStepIndex && order.status !== 'completed'
                    
                    return (
                      <div key={step.key} className="flex-1 relative">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm ${
                              isCompleted
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className={`mt-2 text-xs font-medium text-center ${
                            isCompleted ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </div>
                          {isCurrent && (
                            <div className="mt-1 text-xs text-blue-600 font-semibold">
                              Current
                            </div>
                          )}
                        </div>
                        {index < STATUS_STEPS.length - 1 && (
                          <div
                            className={`absolute top-6 left-1/2 w-full h-0.5 ${
                              isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                            style={{ zIndex: -1 }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tracking Information */}
          {order.tracking && (
            <div className="px-6 py-6 border-b bg-blue-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tracking Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.tracking.trackingNumber && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                    <p className="font-semibold text-gray-900">{order.tracking.trackingNumber}</p>
                  </div>
                )}
                {order.tracking.carrier && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Carrier</p>
                    <p className="font-semibold text-gray-900">{order.tracking.carrier}</p>
                  </div>
                )}
                {order.tracking.shippedAt && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Shipped On</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.tracking.shippedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                {order.tracking.estimatedDelivery && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Delivery</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.tracking.estimatedDelivery).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                {order.tracking.deliveredAt && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Delivered On</p>
                    <p className="font-semibold text-green-600">
                      {new Date(order.tracking.deliveredAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
              {order.tracking.trackingUrl && (
                <div className="mt-4">
                  <a
                    href={order.tracking.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                  >
                    Track Package →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="px-6 py-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-3 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.price.amount * item.quantity, item.price.currency_code)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatPrice(item.price.amount, item.price.currency_code)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="px-6 py-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <div className="text-gray-700">
                {order.customer && (
                  <p className="font-semibold">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                )}
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {order.paymentMethod === 'dust' ? '⚡ Dust' : 'Credit Card'}
                </span>
              </div>
              {order.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-sm text-gray-900">{order.transactionId}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(order.total, order.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/products"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  )
}

