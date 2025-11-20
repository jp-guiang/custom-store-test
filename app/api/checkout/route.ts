import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCart, clearCart, getOrCreateCart, hasMixedCurrencies, getCartCurrencies, carts } from '@/lib/cart'
import { processDustPayment, getUserDustBalance } from '@/lib/dust-payment'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { TEST_USER_ID, CART_COOKIE_NAME } from '@/lib/constants'
import { CheckoutService } from '@/lib/services/checkout.service'
import type { Order } from '@/lib/types'

/**
 * Helper function to send order confirmation email
 * Following DRY principle - eliminates duplication
 */
async function sendOrderConfirmationEmailForOrder(
  order: Order,
  email?: string
): Promise<void> {
  if (!email) return

  await sendOrderConfirmationEmail(
    email,
    order.id,
    order.total,
    order.currency,
    order.items.map(item => ({
      title: item.title,
      quantity: item.quantity,
      price: item.price.amount,
    }))
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartId: bodyCartId, paymentMethod, customer, shippingAddress } = body
    
    // Get cartId from body or cookies - use let so we can reassign if needed
    let cartId = bodyCartId || request.cookies.get(CART_COOKIE_NAME)?.value

    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID required' }, { status: 400 })
    }

    // Get cart - try multiple methods to ensure we find it
    let cart = getCart(cartId)
    
    // If cart not found, try cookie cartId
    if (!cart) {
      const cookieCartId = request.cookies.get(CART_COOKIE_NAME)?.value
      if (cookieCartId && cookieCartId !== cartId) {
        cart = getCart(cookieCartId)
        // Update cartId to match cookie if found
        if (cart) {
          cartId = cookieCartId
        }
      }
    }
    
    // Still no cart? Try to get or create (shouldn't happen, but safety)
    if (!cart) {
      const cookieCartId = request.cookies.get(CART_COOKIE_NAME)?.value
      if (cookieCartId) {
        cart = getOrCreateCart(cookieCartId)
        if (cart && cart.items.length > 0) {
          cartId = cookieCartId
        }
      }
    }
    
    // Final check
    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json(
        { 
          error: 'Cart is empty or not found', 
          cartId,
          cookieCartId: request.cookies.get(CART_COOKIE_NAME)?.value,
          cart: cart || null,
          debug: {
            requestedCartId: bodyCartId,
            usedCartId: cartId,
          }
        },
        { status: 400 }
      )
    }

    // Check for mixed currencies - not allowed
    if (hasMixedCurrencies(cart)) {
      return NextResponse.json(
        { 
          error: 'Cannot checkout with mixed currencies. Please checkout fiat and dust products separately.',
          currencies: getCartCurrencies(cart)
        },
        { status: 400 }
      )
    }

    // Determine payment method from cart currency
    // Dust can only be used for dust-only products
    const isDustPayment = cart.currency === 'dust' || paymentMethod === 'dust'

    if (isDustPayment) {
      // Validate that all items in cart are dust products
      // Dust cannot be used to discount regular products
      const hasNonDustItems = cart.items.some(item => {
        // Check if item has dust currency
        return item.price.currency_code !== 'dust' && item.price.currency_code !== 'xpf'
      })
      
      if (hasNonDustItems) {
        return NextResponse.json(
          {
            error: 'Dust can only be used to purchase dust-only products. Please remove regular products from your cart.',
          },
          { status: 400 }
        )
      }
      
      // Check dust balance
      const balance = getUserDustBalance(TEST_USER_ID)
      if (balance < cart.total) {
        return NextResponse.json(
          {
            error: 'Insufficient dust balance',
            balance,
            required: cart.total,
          },
          { status: 400 }
        )
      }

      // Process dust payment
      const paymentResult = processDustPayment(TEST_USER_ID, cart.total)
      if (!paymentResult.success) {
        return NextResponse.json(
          { error: paymentResult.error },
          { status: 400 }
        )
      }

      // Create order with customer and shipping info
      const order = CheckoutService.createOrderFromCart(
        cart,
        'dust',
        paymentResult.transactionId,
        customer,
        shippingAddress
      )

      // Clear cart
      clearCart(cartId)

      // Send order confirmation email
      await sendOrderConfirmationEmailForOrder(order, customer?.email)

      return NextResponse.json({
        success: true,
        order,
        message: 'Order placed successfully with dust payment!',
      })
    } else {
      // For fiat payments, we'd integrate with Stripe or other payment providers
      // For POC, we'll simulate a successful payment
      const order = CheckoutService.createOrderFromCart(
        cart,
        'fiat',
        undefined, // Will generate transaction ID
        customer,
        shippingAddress
      )

      // Clear cart
      clearCart(cartId)

      // Send order confirmation email
      await sendOrderConfirmationEmailForOrder(order, customer?.email)

      return NextResponse.json({
        success: true,
        order,
        message: 'Order placed successfully!',
      })
    }
  } catch (error) {
    console.error('Error processing checkout:', error)
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    )
  }
}

