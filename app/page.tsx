import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          Welcome to Custom Store
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Powered by <span className="font-semibold text-blue-600">Medusa.js</span>
        </p>
        <p className="text-lg text-gray-500 mb-8">
          Proof of concept e-commerce store with custom currency support
        </p>
        <Link 
          href="/products"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          View All Products
        </Link>
      </div>
    </main>
  )
}

