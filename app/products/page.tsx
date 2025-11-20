'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import type { Product } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { MIN_QUANTITY, MAX_QUANTITY } from '@/lib/constants'
import { clamp } from '@/lib/utils'
import { dispatchCartUpdate } from '@/lib/api-client'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [dustBalance, setDustBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [cartItems, setCartItems] = useState<Record<string, { id: string; quantity: number }>>({})

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart', {
        credentials: 'include',
      })
      const data = await res.json()
      const cart = data.cart
      
        if (cart?.items) {
          const itemsMap: Record<string, { id: string; quantity: number }> = {}
          const quantitiesMap: Record<string, number> = {}
          
          cart.items.forEach((item: { id: string; title: string; quantity: number }) => {
            itemsMap[item.title] = { id: item.id, quantity: item.quantity }
            quantitiesMap[item.title] = item.quantity
          })
          
          setCartItems(itemsMap)
          setQuantities(quantitiesMap)
        }
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

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
    fetchProducts()
    fetchDustBalance()
    fetchCart()

    // Check for success parameter in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('order') === 'success') {
        setShowSuccess(true)
        // Clear the URL parameter
        window.history.replaceState({}, '', '/products')
        // Hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000)
      }

      // Listen for cart updates
      const handleCartUpdate = () => {
        fetchCart()
      }
      window.addEventListener('cartUpdated', handleCartUpdate)
      return () => window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [fetchCart, fetchProducts, fetchDustBalance])

  async function handleAddToCart(product: Product, quantity: number = 1) {
    setAddingToCart(product.id)
    try {
      // Get first variant with a price, or use first variant
      const variant = product.variants && product.variants.length > 0 
        ? product.variants.find((v) => v.prices && v.prices.length > 0) || product.variants[0]
        : null
      
      if (!variant) {
        throw new Error('Product variant not found')
      }

      const price = variant.prices?.[0]
      if (!price) {
        throw new Error('Product price not found')
      }

      // For dust products, use dust_price from metadata
      const isDustProduct = product.metadata?.dust_only === true
      const dustPrice = product.metadata?.dust_price
      
      // Determine the price to use: dust_price if available, otherwise regular price
      const priceAmount = isDustProduct && dustPrice !== undefined 
        ? dustPrice 
        : price.amount
      
      // Use 'dust' currency code for dust products, otherwise use the variant's currency
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

      const result = await res.json()
      
      // Check if there's an error message
      if (result.error) {
        alert(result.error)
        return
      }
      
      dispatchCartUpdate()
      await fetchCart()
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      const errorMessage = error.message || 'Failed to add item to cart'
      alert(errorMessage)
    } finally {
      setAddingToCart(null)
    }
  }

  async function handleUpdateQuantity(product: Product, newQuantity: number) {
    const cartItem = cartItems[product.title]
    if (!cartItem) {
      // Not in cart, just update local state
      setQuantities({ ...quantities, [product.title]: newQuantity })
      return
    }

    if (newQuantity <= 0) {
      handleRemoveFromCart(product)
      return
    }

    try {
      await fetch('/api/cart', {
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

      dispatchCartUpdate()
      await fetchCart()
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity')
    }
  }

  async function handleRemoveFromCart(product: Product) {
    const cartItem = cartItems[product.title]
    if (!cartItem) return

    try {
      await fetch('/api/cart', {
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
      await fetchCart()
      setQuantities({ ...quantities, [product.title]: 1 })
    } catch (error) {
      console.error('Error removing from cart:', error)
      alert('Failed to remove item from cart')
    }
  }

  function incrementQuantity(product: Product) {
    const currentQty = quantities[product.title] || MIN_QUANTITY
    const newQty = clamp(currentQty + 1, MIN_QUANTITY, MAX_QUANTITY)
    handleUpdateQuantity(product, newQty)
  }

  function decrementQuantity(product: Product) {
    const currentQty = quantities[product.title] || MIN_QUANTITY
    const newQty = clamp(currentQty - 1, MIN_QUANTITY, MAX_QUANTITY)
    handleUpdateQuantity(product, newQty)
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading products...</div>
      </main>
    )
  }

  // Filter products by metadata.dust_only flag or tags
  // Products with metadata.dust_only === true OR tag 'dust-only' are dust products
  const fiatProducts = products.filter((p) => {
    // Check metadata for dust_only flag (handle boolean true, string "true", or string "1")
    // Metadata values might come as strings from API, so check both types
    const dustOnlyValue = p.metadata?.dust_only as any
    const isDustProduct = dustOnlyValue === true || 
                         dustOnlyValue === 'true' || 
                         dustOnlyValue === '1' ||
                         dustOnlyValue === 1
    
    if (isDustProduct) {
      return false // Don't show dust products in fiat section
    }
    
    // Check tags as fallback
    if (p.tags && p.tags.length > 0) {
      const hasDustTag = p.tags.some((t) => t.value === 'dust-only')
      if (hasDustTag) {
        return false // Don't show dust-tagged products in fiat section
      }
      return p.tags.some((t) => t.value === 'fiat')
    }
    
    // Show products without dust_only metadata/tags in fiat section (default)
    return true
  })
  
  const dustProducts = products.filter((p) => {
    // Check metadata for dust_only flag (handle boolean true, string "true", or string "1")
    // Metadata values might come as strings from API, so check both types
    const dustOnlyValue = p.metadata?.dust_only as any
    const isDustProduct = dustOnlyValue === true || 
                         dustOnlyValue === 'true' || 
                         dustOnlyValue === '1' ||
                         dustOnlyValue === 1
    
    if (isDustProduct) {
      return true // Show dust products
    }
    
    // Check tags as fallback
    if (p.tags && p.tags.length > 0) {
      return p.tags.some((t) => t.value === 'dust-only')
    }
    
    return false
  })

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold">✓ Order placed successfully!</span>
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="text-green-700 hover:text-green-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                All Products
              </h1>
              <p className="text-gray-600">
                Browse our collection powered by{' '}
                <span className="font-semibold text-blue-600">Medusa.js</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Products available in fiat and dust currencies
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Dust Balance</div>
              <div className="text-2xl font-bold text-yellow-600">
                {dustBalance.toLocaleString()} ⚡
              </div>
            </div>
          </div>
        </div>


        {/* Fiat Products Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Products Available with Fiat Currency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fiatProducts.map((product) => {
              // Get first variant with a price, or use first variant
              const variant = product.variants && product.variants.length > 0 
                ? product.variants.find((v) => v.prices && v.prices.length > 0) || product.variants[0]
                : null
              const price = variant?.prices?.[0]
              const isAdding = addingToCart === product.id
              const quantity = quantities[product.title] || 1
              
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow block"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-green-600">
                      {price
                        ? formatPrice(price.amount, price.currency_code)
                        : 'N/A'}
                    </span>
                  </div>
                  
                  {/* Quantity Selector */}
                  <div className="mb-4">
                    <label htmlFor={`quantity-${product.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          decrementQuantity(product)
                        }}
                        disabled={quantity <= MIN_QUANTITY}
                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <input
                        id={`quantity-${product.id}`}
                        type="number"
                        min={MIN_QUANTITY}
                        max={MAX_QUANTITY}
                        value={quantity}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value) || MIN_QUANTITY
                          const clampedQty = clamp(newQty, MIN_QUANTITY, MAX_QUANTITY)
                          handleUpdateQuantity(product, clampedQty)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          incrementQuantity(product)
                        }}
                        disabled={quantity >= MAX_QUANTITY}
                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleAddToCart(product, quantity)
                    }}
                    disabled={isAdding}
                    className="w-full px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isAdding ? 'Adding...' : 'Add to Cart'}
                  </button>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Dust Products Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Products Available Only with Dust ⚡
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dustProducts.map((product) => {
              // Use dust_price from metadata if available, otherwise use variant price
              const dustPriceRaw = product.metadata?.dust_price
              const dustPrice = dustPriceRaw !== undefined ? Number(dustPriceRaw) : undefined
              const variant = product.variants && product.variants.length > 0 
                ? product.variants.find((v) => v.prices && v.prices.length > 0) || product.variants[0]
                : null
              const price = variant?.prices?.[0]
              
              // For dust products, use dust_price from metadata (in dust points)
              // If dust_price is set, use it; otherwise fall back to variant price
              const priceAmount = dustPrice !== undefined && !Number.isNaN(dustPrice) ? dustPrice : (price?.amount || 0)
              
              const isAdding = addingToCart === product.id
              const quantity = quantities[product.title] || 1
              const canAfford = dustBalance >= priceAmount * quantity
              
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="bg-white rounded-lg shadow-md p-6 border-2 border-yellow-400 hover:shadow-lg transition-shadow block"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500 text-xl">⚡</span>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {product.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  {!canAfford && (
                    <div className="mb-2 text-sm text-red-600">
                      Insufficient dust. Need{' '}
                      {formatPrice(priceAmount * quantity, 'dust')}
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-yellow-600">
                      {dustPrice !== undefined && !Number.isNaN(dustPrice)
                        ? formatPrice(dustPrice, 'dust')
                        : price
                        ? formatPrice(priceAmount, 'dust')
                        : 'N/A'}
                    </span>
                  </div>

                  {/* Quantity Selector */}
                  <div className="mb-4">
                    <label htmlFor={`quantity-${product.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          decrementQuantity(product)
                        }}
                        disabled={quantity <= MIN_QUANTITY}
                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <input
                        id={`quantity-${product.id}`}
                        type="number"
                        min={MIN_QUANTITY}
                        max={MAX_QUANTITY}
                        value={quantity}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value) || MIN_QUANTITY
                          const clampedQty = clamp(newQty, MIN_QUANTITY, MAX_QUANTITY)
                          handleUpdateQuantity(product, clampedQty)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          incrementQuantity(product)
                        }}
                        disabled={quantity >= MAX_QUANTITY}
                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleAddToCart(product, quantity)
                    }}
                    disabled={isAdding || !canAfford}
                    className="w-full px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-yellow-500 text-white hover:bg-yellow-600"
                  >
                    {isAdding ? 'Adding...' : 'Buy with Dust'}
                  </button>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

