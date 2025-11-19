// Medusa JS SDK Client Configuration
// Used to connect Next.js storefront to separate Medusa backend

import Medusa from "@medusajs/js-sdk"

// Initialize Medusa client pointing to backend API
// Requires publishable API key from Medusa admin panel
export const medusaClient = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.MEDUSA_PUBLISHABLE_API_KEY,
})

// Helper function to get products from Medusa backend
export async function getProductsFromBackend() {
  try {
    // Check if publishable API key is configured
    if (!process.env.MEDUSA_PUBLISHABLE_API_KEY) {
      throw new Error('MEDUSA_PUBLISHABLE_API_KEY is required. Get it from Medusa admin panel: Settings → Publishable API Keys')
    }

    // Use REST API directly to get products with prices (including region context)
    // This ensures we get calculated_price which includes proper pricing
    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    const apiKey = process.env.MEDUSA_PUBLISHABLE_API_KEY
    
    if (!apiKey || !backendUrl) {
      throw new Error('MEDUSA_BACKEND_URL and MEDUSA_PUBLISHABLE_API_KEY are required')
    }
    
    // First, get the default region to fetch prices with proper currency
    let regionId: string | null = null
    let currencyCode = 'usd'
    
    try {
      const regionsResponse = await fetch(`${backendUrl}/store/regions`, {
        headers: {
          'x-publishable-api-key': apiKey,
        },
      })
      
      if (regionsResponse.ok) {
        const regionsData = await regionsResponse.json()
        if (regionsData.regions && regionsData.regions.length > 0) {
          regionId = regionsData.regions[0].id
          currencyCode = regionsData.regions[0].currency_code || 'usd'
          console.log(`[Debug] Using region: ${regionId}, currency: ${currencyCode}`)
        }
      }
    } catch (err) {
      console.warn('Failed to fetch regions:', err)
    }
    
    // Fetch products with prices using REST API (includes calculated_price when region_id is provided)
    const productsUrl = regionId 
      ? `${backendUrl}/store/products?limit=100&region_id=${regionId}`
      : `${backendUrl}/store/products?limit=100`
    
    console.log(`[Debug] Fetching products from: ${productsUrl}`)
    
    const response = await fetch(productsUrl, {
      headers: {
        'x-publishable-api-key': apiKey,
      },
      cache: 'no-store', // Disable caching to ensure fresh data
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const products = data.products || []
    
    if (products.length === 0) {
      console.log('No products found in Medusa backend')
      return []
    }
    
    // Transform to match expected format
    return products.map((product: any) => {
      // Debug: Check if we got calculated_price in variants
      if (process.env.NODE_ENV === 'development' && product.title?.includes('Sweatpants')) {
        console.log(`[Debug] Product: ${product.title}, Description: ${product.description}`)
        console.log(`[Debug] First variant calculated_price:`, product.variants?.[0]?.calculated_price)
        console.log(`[Debug] First variant prices:`, product.variants?.[0]?.prices)
      }
      
      // Transform variants to include prices in expected format
      const transformedVariants = (product.variants || []).map((variant: any) => {
        // Extract prices from variant - prioritize calculated_price (includes region context)
        let prices: Array<{ id?: string; amount: number; currency_code: string }> = []
        
        // Check for calculated_price (object) or calculated_price property
        const hasCalculatedPrice = variant.calculated_price && (
          typeof variant.calculated_price === 'object' || 
          typeof variant.calculated_price === 'number'
        )
        
        if (hasCalculatedPrice) {
          // Use calculated_price - this is the correct price for the region
          // Medusa v2 returns calculated_price as an object when region_id is provided:
          // { calculated_amount: 50, currency_code: 'eur', ... }
          let amount = 0
          let priceCurrency = currencyCode
          
          if (typeof variant.calculated_price === 'number') {
            // Edge case: if it's a number directly
            amount = variant.calculated_price
            priceCurrency = currencyCode
          } else if (variant.calculated_price && typeof variant.calculated_price === 'object') {
            // Standard format: object with calculated_amount
            amount = variant.calculated_price.calculated_amount ?? variant.calculated_price.original_amount ?? 0
            priceCurrency = variant.calculated_price.currency_code || currencyCode
          }
          
          // Medusa v2 stores prices as full currency units in calculated_price
          // Example: €50.00 is stored as calculated_amount: 50 (not 5000 cents)
          // Convert to cents by multiplying by 100 for display
          if (amount > 0) {
            // Always convert from full currency units to cents
            // 50 (€50.00) -> 5000 cents, 10 (€10.00) -> 1000 cents
            amount = amount * 100
          }
          
          prices = [{
            id: variant.calculated_price?.calculated_price?.id || variant.id,
            amount: amount,
            currency_code: priceCurrency,
          }]
          
          // Debug logging (remove in production)
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Price] Product: ${product.title}, Variant: ${variant.title}, calculated_amount: ${variant.calculated_price?.calculated_amount}, final_amount: ${amount}`)
          }
        } else if (variant.prices && Array.isArray(variant.prices) && variant.prices.length > 0) {
          // Fallback to direct prices if calculated_price not available
          prices = variant.prices.map((price: any) => ({
            id: price.id,
            amount: price.amount || 0,
            currency_code: price.currency_code || currencyCode,
          }))
        } else {
          // Default price if none found
          prices = [{
            amount: 0,
            currency_code: currencyCode,
          }]
        }
        
        return {
          id: variant.id,
          title: variant.title || product.title,
          sku: variant.sku || '',
          prices: prices,
          inventory_quantity: variant.inventory_quantity || 0,
        }
      })
      
      // Transform tags - handle both array of objects and array of strings
      let tags: Array<{ value: string }> = []
      if (product.tags && Array.isArray(product.tags)) {
        tags = product.tags.map((tag: any) => ({
          value: typeof tag === 'string' ? tag : (tag.value || tag.name || ''),
        }))
      }
      
      // If no tags, assign default tag based on price currency
      if (tags.length === 0 && transformedVariants.length > 0) {
        const firstVariant = transformedVariants[0]
        const firstPrice = firstVariant.prices[0]
        if (firstPrice && firstPrice.currency_code === 'dust') {
          tags = [{ value: 'dust-only' }]
        } else {
          tags = [{ value: 'fiat' }]
        }
      }
      
      return {
        id: product.id,
        title: product.title,
        description: product.description || '',
        handle: product.handle,
        status: product.status,
        images: (product.images || []).map((img: any) => ({
          url: img.url || img,
        })),
        options: product.options || [],
        tags: tags,
        variants: transformedVariants,
      }
    })
  } catch (error: any) {
    console.error('Failed to fetch products from Medusa backend:', error)
    
    // Provide helpful error message
    if (error.message?.includes('Publishable API key')) {
      throw new Error('Publishable API key required. Get it from Medusa admin: Settings → Publishable API Keys')
    }
    
    throw error
  }
}

// Helper function to get a single product by handle
export async function getProductByHandle(handle: string) {
  try {
    // Check if publishable API key is configured
    if (!process.env.MEDUSA_PUBLISHABLE_API_KEY) {
      throw new Error('MEDUSA_PUBLISHABLE_API_KEY is required. Get it from Medusa admin panel: Settings → Publishable API Keys')
    }

    const { product } = await medusaClient.store.product.retrieve(handle)
    
    if (!product) {
      return null
    }
    
    return {
      id: product.id,
      title: product.title,
      description: product.description || '',
      handle: product.handle,
      status: product.status,
      images: product.images || [],
      options: product.options || [],
      tags: product.tags || [],
      variants: product.variants || [],
    }
  } catch (error: any) {
    console.error(`Failed to fetch product ${handle} from Medusa backend:`, error)
    
    // Provide helpful error message
    if (error.message?.includes('Publishable API key')) {
      throw new Error('Publishable API key required. Get it from Medusa admin: Settings → Publishable API Keys')
    }
    
    return null
  }
}

