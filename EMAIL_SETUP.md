# Email Setup Instructions

## Current Status
- ✅ Email service configured with Resend
- ✅ Email templates created
- ⚠️ **Requires API key to send real emails**

## How to Enable Email Sending

### Option 1: Resend (Recommended - Easy Setup)

1. **Sign up for Resend:**
   - Go to https://resend.com
   - Create a free account (100 emails/day free)

2. **Get your API key:**
   - Go to https://resend.com/api-keys
   - Create a new API key
   - Copy the key

3. **Add to `.env.local`:**
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=orders@yourdomain.com
   ```
   
   **Note:** For testing, you can use `onboarding@resend.dev` as the from email (Resend's test domain)

4. **Restart your dev server:**
   ```bash
   npm run dev
   ```

### Option 2: SendGrid

1. Sign up at https://sendgrid.com
2. Get API key from dashboard
3. Add to `.env.local`:
   ```bash
   SENDGRID_API_KEY=your_sendgrid_key
   SENDGRID_FROM_EMAIL=orders@yourdomain.com
   ```
4. Update `lib/email.ts` to use SendGrid instead of Resend

### Option 3: Mailgun

1. Sign up at https://mailgun.com
2. Get API key and domain
3. Add to `.env.local`:
   ```bash
   MAILGUN_API_KEY=your_mailgun_key
   MAILGUN_DOMAIN=your_domain
   MAILGUN_FROM_EMAIL=orders@yourdomain.com
   ```

## Testing

After adding your API key:
1. Place a test order
2. Check your email inbox
3. Check server console for email logs

## Current Behavior

**Without API key:**
- Emails are logged to console
- No actual emails sent
- Order still processes successfully

**With API key:**
- Real emails sent via Resend
- Order confirmation emails delivered
- Professional email templates

## Email Template

The email includes:
- Order confirmation message
- Order ID
- Total amount
- List of items
- Professional HTML styling

