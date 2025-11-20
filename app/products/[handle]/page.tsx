'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Product, CartItem } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { MIN_QUANTITY, MAX_QUANTITY } from '@/lib/constants'
import { clamp } from '@/lib/utils'
import { dispatchCartUpdate } from '@/lib/api-client'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const handle = params.handle as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [dustBalance, setDustBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [cartItem, setCartItem] = useState<CartItem | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      const products = data.products || []
      const foundProduct = products.find((p: Product) => p.handle === handle)
      
      if (!foundProduct) {
        router.push('/products')
        return
      }
      
      setProduct(foundProduct)
    } catch (error) {
      console.error('Error fetching product:', error)
      router.push('/products')
    } finally {
      setLoading(false)
    }
  }, [handle, router])

  const fetchDustBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/dust-balance')
      const data = await res.json()
      setDustBalance(data.balance || 0)
    } catch (error) {
      console.error('Error fetching dust balance:', error)
    }
  }, [])

  useEffect(() => {
    fetchProduct()
    fetchDustBalance()
  }, [fetchProduct, fetchDustBalance])

  const fetchCartItem = useCallback(async () => {
    if (!product) return
    
    try {
      const res = await fetch('/api/cart', {
        credentials: 'include',
      })
      const data = await res.json()
      const cart = data.cart
      
      if (cart && cart.items) {
        const item = cart.items.find((item: CartItem) => 
          item.title === product.title
        )
        if (item) {
          setCartItem(item)
          setQuantity(item.quantity)
        } else {
          setCartItem(null)
          setQuantity(1)
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }, [product])

  useEffect(() => {
    if (product) {
      fetchCartItem()
    }

    // Listen for cart updates
    const handleCartUpdate = () => {
      if (product) {
        fetchCartItem()
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('cartUpdated', handleCartUpdate)
      return () => window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [product, fetchCartItem])



  async function handleAddToCart() {
    if (!product) return
    
    setUpdating(true)
    try {
      const variant = product.variants[0]
      const price = variant.prices[0]

      // For dust products, use dust_price from metadata
      const dustPrice = product.metadata?.dust_price
      const priceAmount = isDustProduct && dustPrice !== undefined 
        ? dustPrice 
        : price.amount
      const currencyCode = isDustProduct ? 'dust' : price.currency_code

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'add',
          productId: product.id,
          variantId: variant.id,
          title: product.title,
          price: {
            amount: priceAmount,
            currency_code: currencyCode,
          },
          quantity: quantity,
        }),
      })

      const data = await res.json()
      dispatchCartUpdate()
      await fetchCartItem()
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart')
    } finally {
      setUpdating(false)
    }
  }

  async function handleUpdateQuantity(newQuantity: number) {
    if (!product || !cartItem || newQuantity < 1) return
    
    setUpdating(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'update',
          itemId: cartItem.id,
          quantity: newQuantity,
        }),
      })

      const data = await res.json()
      setQuantity(newQuantity)
      dispatchCartUpdate()
      await fetchCartItem()
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity')
    } finally {
      setUpdating(false)
    }
  }

  async function handleRemoveFromCart() {
    if (!cartItem) return
    
    setUpdating(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'remove',
          itemId: cartItem.id,
        }),
      })

      dispatchCartUpdate()
      setCartItem(null)
      setQuantity(1)
    } catch (error) {
      console.error('Error removing from cart:', error)
      alert('Failed to remove item from cart')
    } finally {
      setUpdating(false)
    }
  }

  function incrementQuantity() {
    if (quantity < MAX_QUANTITY) {
      const newQuantity = clamp(quantity + 1, MIN_QUANTITY, MAX_QUANTITY)
      setQuantity(newQuantity)
    }
  }

  function decrementQuantity() {
    if (quantity > MIN_QUANTITY) {
      const newQuantity = clamp(quantity - 1, MIN_QUANTITY, MAX_QUANTITY)
      setQuantity(newQuantity)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading product...</div>
      </main>
    )
  }

  if (!product) {
    return null
  }

  const variant = product.variants[0]
  const price = variant.prices[0]
  // Check if product is dust by metadata
  const isDustProduct = product.metadata?.dust_only === true || 
                        product.metadata?.dust_only === 'true' ||
                        product.metadata?.dust_only === 1 ||
                        product.tags.some((t) => t.value === 'dust-only')
  const dustPrice = product.metadata?.dust_price !== undefined 
    ? Number(product.metadata.dust_price) 
    : undefined
  // For dust products, use dust_price from metadata if available, otherwise use variant price
  // dust_price is stored as full units (e.g., 1000 for 1000 dust)
  const priceAmount = isDustProduct && dustPrice !== undefined 
    ? dustPrice 
    : (price?.amount || 0)
  const canAfford = isDustProduct ? dustBalance >= priceAmount * quantity : true

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/products"
          className="text-blue-600 hover:text-blue-800 mb-6 inline-block"
        >
          ← Back to Products
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            {isDustProduct && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-yellow-500 text-2xl">⚡</span>
                <span className="text-sm font-semibold text-yellow-600">
                  Dust Only Product
                </span>
              </div>
            )}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {product.title}
            </h1>
            <p className="text-lg text-gray-600 mb-6">{product.description}</p>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Price</div>
                <div className="text-3xl font-bold text-gray-900">
                  {isDustProduct && dustPrice !== undefined && !Number.isNaN(dustPrice)
                    ? formatPrice(dustPrice, 'dust')
                    : isDustProduct
                    ? formatPrice(priceAmount, 'dust')
                    : price
                    ? formatPrice(price.amount, price.currency_code)
                    : 'N/A'}
                </div>
              </div>
              {isDustProduct && (
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Your Dust Balance</div>
                  <div className="text-xl font-bold text-yellow-600">
                    {dustBalance.toLocaleString()} ⚡
                  </div>
                </div>
              )}
            </div>

            {isDustProduct && !canAfford && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">
                  Insufficient dust. You need{' '}
                  {formatPrice(priceAmount * quantity, 'dust')}
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <label htmlFor="quantity-input" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={decrementQuantity}
                  disabled={quantity <= MIN_QUANTITY || updating}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  −
                </button>
                <input
                  id="quantity-input"
                  type="number"
                  min={MIN_QUANTITY}
                  max={MAX_QUANTITY}
                  value={quantity}
                  onChange={(e) => {
                    const newQty = parseInt(e.target.value) || MIN_QUANTITY
                    const clampedQty = clamp(newQty, MIN_QUANTITY, MAX_QUANTITY)
                    setQuantity(clampedQty)
                  }}
                  className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 text-lg font-semibold"
                  disabled={updating}
                />
                <button
                  type="button"
                  onClick={incrementQuantity}
                  disabled={quantity >= MAX_QUANTITY || updating}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={updating || (isDustProduct && !canAfford)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Adding...' : isDustProduct ? 'Add to Cart (Dust)' : 'Add to Cart'}
              </button>
            </div>

            {/* Total Price */}
            {price && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Total:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(price.amount * quantity, price.currency_code)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

