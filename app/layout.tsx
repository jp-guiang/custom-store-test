import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import CartIcon from '@/components/CartIcon'

export const metadata: Metadata = {
  title: 'Custom Store - Medusa.js POC',
  description: 'E-commerce store powered by Medusa.js with custom currency support',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Header with cart icon */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Custom Store
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href="/products"
                  className="text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Products
                </Link>
                <CartIcon />
              </div>
            </div>
          </div>
        </header>

        {children}
        
        <footer className="bg-gray-100 py-4 mt-auto">
          <div className="max-w-6xl mx-auto px-8 text-center text-sm text-gray-600">
            Powered by{' '}
            <a
              href="https://medusajs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Medusa.js
            </a>
            {' '}• Proof of Concept
          </div>
        </footer>
      </body>
    </html>
  )
}

