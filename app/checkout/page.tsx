'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Cart, CartItem, CustomerDetails, ShippingAddress } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dustBalance, setDustBalance] = useState(0)
  
  // Form state
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchCart()
    fetchDustBalance()
  }, [])

  async function fetchCart() {
    try {
      // Fetch cart with credentials to ensure cookies are sent
      const res = await fetch('/api/cart', { 
        cache: 'no-store',
        credentials: 'include',
      })
      const data = await res.json()
      
      console.log('Checkout page - Cart data:', data)
      
      if (data.cart) {
        if (data.cart.items && data.cart.items.length > 0) {
          setCart(data.cart)
        } else {
          // Empty cart, redirect to products
          console.log('Cart is empty, redirecting...')
          router.push('/products')
          return
        }
      } else {
        // No cart data, redirect to products
        console.log('No cart data, redirecting...')
        router.push('/products')
        return
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      router.push('/products')
    } finally {
      setLoading(false)
    }
  }

  async function fetchDustBalance() {
    try {
      const res = await fetch('/api/dust-balance')
      const data = await res.json()
      setDustBalance(data.balance || 0)
    } catch (error) {
      console.error('Error fetching dust balance:', error)
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    if (!customerDetails.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!customerDetails.firstName) {
      newErrors.firstName = 'First name is required'
    }

    if (!customerDetails.lastName) {
      newErrors.lastName = 'Last name is required'
    }

    if (!shippingAddress.address1) {
      newErrors.address1 = 'Address is required'
    }

    if (!shippingAddress.city) {
      newErrors.city = 'City is required'
    }

    if (!shippingAddress.state) {
      newErrors.state = 'State is required'
    }

    if (!shippingAddress.postalCode) {
      newErrors.postalCode = 'Postal code is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!cart) {
      alert('Cart is empty')
      return
    }

    setSubmitting(true)
    try {
      // Ensure we have cart ID - use from state or try to get from cookies
      const checkoutCartId = cart?.id || null
      
      if (!checkoutCartId) {
        alert('Cart ID missing. Please try adding items to cart again.')
        router.push('/products')
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({
          cartId: checkoutCartId,
          paymentMethod: cart.currency === 'dust' ? 'dust' : 'fiat',
          customer: customerDetails,
          shippingAddress: shippingAddress,
        }),
      })

      const data = await res.json()

      if (data.success) {
        // Redirect to order confirmation
        router.push(`/order-confirmation?orderId=${data.order.id}`)
      } else {
        alert(data.error || 'Checkout failed')
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      alert('Checkout failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading checkout...</div>
      </main>
    )
  }

  if (!cart || cart.items.length === 0) {
    return null // Will redirect
  }

  const isDustPayment = cart.currency === 'dust'
  const canAfford = isDustPayment ? dustBalance >= cart.total : true

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/products"
          className="text-blue-600 hover:text-blue-800 mb-6 inline-block"
        >
          ← Back to Cart
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Customer Information */}
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-6">Customer Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={customerDetails.firstName}
                      onChange={(e) =>
                        setCustomerDetails({ ...customerDetails, firstName: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={customerDetails.lastName}
                      onChange={(e) =>
                        setCustomerDetails({ ...customerDetails, lastName: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) =>
                      setCustomerDetails({ ...customerDetails, email: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) =>
                      setCustomerDetails({ ...customerDetails, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </section>

              {/* Shipping Address */}
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-6">Shipping Address</h2>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    autoComplete="street-address"
                    value={shippingAddress.address1}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address1: e.target.value })
                    }
                    placeholder="Enter your street address"
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.address1 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.address1 && (
                    <p className="text-red-500 text-sm mt-1">{errors.address1}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.address2}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address2: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      autoComplete="address-level2"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      autoComplete="address-level1"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      autoComplete="postal-code"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errors.postalCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <select
                    autoComplete="country"
                    value={shippingAddress.country}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, country: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="NZ">New Zealand</option>
                  </select>
                </div>
              </section>

              {/* Payment Method Info */}
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-4">Payment Method</h2>
                {isDustPayment ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⚡</span>
                      <span className="font-semibold">Paying with Dust</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Your dust balance: {dustBalance.toLocaleString()} ⚡
                    </p>
                    {!canAfford && (
                      <p className="text-red-600 text-sm mt-2">
                        Insufficient dust balance
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Payment will be processed securely. For this POC, payment is simulated.
                    </p>
                  </div>
                )}
              </section>

              <button
                type="submit"
                disabled={submitting || (isDustPayment && !canAfford)}
                className="w-full bg-green-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Complete Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between border-b pb-4">
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-600">
                        {formatPrice(item.price.amount, item.price.currency_code)} ×{' '}
                        {item.quantity}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatPrice(
                        item.price.amount * item.quantity,
                        item.price.currency_code
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(cart.total, cart.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

