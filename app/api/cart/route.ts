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
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          )
        }
        cart = addToCart(cartId, productId, variantId, title, price, quantity)
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

