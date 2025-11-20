import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getOrCreateCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  getCart,
} from '@/lib/cart'
import type { Cart } from '@/lib/types'
import { CART_COOKIE_NAME, CART_COOKIE_MAX_AGE, CURRENCY_CODES } from '@/lib/constants'
import { generateId } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const cartId = request.cookies.get(CART_COOKIE_NAME)?.value

    if (!cartId) {
      return NextResponse.json({
        cart: {
          id: null,
          items: [],
          total: 0,
          currency: CURRENCY_CODES.USD,
        },
      })
    }

    const cart = getCart(cartId) || getOrCreateCart(cartId)

    return NextResponse.json({ cart })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, productId, variantId, title, price, quantity, itemId } =
      body

    let cartId = request.cookies.get(CART_COOKIE_NAME)?.value

    if (!cartId) {
      cartId = generateId('cart')
    }

    let cart: Cart

    switch (action) {
      case 'add':
        if (!productId || !variantId || !title || !price) {
          console.error('Cart API - Missing required fields:', {
            productId,
            variantId,
            title,
            price,
            hasPrice: !!price,
          })
          return NextResponse.json(
            { error: 'Missing required fields', details: { productId, variantId, title, price } },
            { status: 400 }
          )
        }
        
        // Validate price structure
        if (!price.amount || price.amount <= 0) {
          console.error('Cart API - Invalid price amount:', price)
          return NextResponse.json(
            { error: 'Invalid price amount', price },
            { status: 400 }
          )
        }
        
        if (!price.currency_code) {
          console.error('Cart API - Missing currency_code:', price)
          return NextResponse.json(
            { error: 'Missing currency_code', price },
            { status: 400 }
          )
        }
        
        try {
          cart = addToCart(cartId, productId, variantId, title, price, quantity)
          console.log('Cart API - Item added successfully:', {
            cartId,
            itemCount: cart.items.length,
            total: cart.total,
            currency: cart.currency,
          })
        } catch (error: any) {
          console.error('Cart API - Error adding to cart:', error)
          return NextResponse.json(
            { error: error.message || 'Failed to add item to cart' },
            { status: 400 }
          )
        }
        break

      case 'remove':
        if (!itemId) {
          return NextResponse.json(
            { error: 'Missing itemId' },
            { status: 400 }
          )
        }
        cart = removeFromCart(cartId, itemId)
        break

      case 'update':
        if (!itemId || quantity === undefined) {
          return NextResponse.json(
            { error: 'Missing itemId or quantity' },
            { status: 400 }
          )
        }
        cart = updateCartItemQuantity(cartId, itemId, quantity)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const response = NextResponse.json({ cart })
    response.cookies.set(CART_COOKIE_NAME, cartId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: CART_COOKIE_MAX_AGE,
    })

    return response
  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}

