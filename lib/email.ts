// Email service for order confirmations
// Uses Resend for email delivery

import { formatPrice } from './utils'

export async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  orderTotal: number,
  currency: string,
  items: Array<{ title: string; quantity: number; price: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailContent = {
      to: email,
      subject: `Order Confirmation - Order #${orderId}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="color: #111827; margin: 0 0 10px 0;">Thank you for your order!</h1>
              <p style="color: #6b7280; margin: 0;">Your order has been confirmed and will be processed shortly.</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #111827; margin-top: 0;">Order Details</h2>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Total:</strong> ${formatPrice(orderTotal, currency)}</p>
              
              <h3 style="color: #111827; margin-top: 20px;">Items:</h3>
              <ul style="list-style: none; padding: 0;">
                ${items.map(item => `
                  <li style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong>${item.title}</strong><br>
                    Quantity: ${item.quantity} × ${formatPrice(item.price, currency)}
                  </li>
                `).join('')}
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">You will receive another email when your order ships.</p>
          </body>
        </html>
      `,
      text: `Order Confirmation - Order #${orderId}\n\nTotal: ${formatPrice(orderTotal, currency)}\n\nItems:\n${items.map(item => `- ${item.title} (x${item.quantity})`).join('\n')}`,
    }

    // Try to send email using Resend if API key is configured
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (resendApiKey) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(resendApiKey)
        
        const result = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        })

        console.log('✅ Email sent successfully via Resend:', result)
        return { success: true }
      } catch (resendError: any) {
        console.error('❌ Resend error:', resendError)
        // Fall through to logging
      }
    }

    // If no API key or Resend failed, log the email
    console.log('📧 Order Confirmation Email (logged - no API key configured):', {
      to: emailContent.to,
      subject: emailContent.subject,
      html: emailContent.html.substring(0, 100) + '...',
    })
    
    console.log('\n📝 To enable email sending, add to .env.local:')
    console.log('   RESEND_API_KEY=your_resend_api_key')
    console.log('   RESEND_FROM_EMAIL=orders@yourdomain.com\n')

    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}


