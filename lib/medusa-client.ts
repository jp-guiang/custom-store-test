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
        }
      }
    } catch (err) {
      console.warn('Failed to fetch regions:', err)
    }
    
    // Try custom endpoint first (includes metadata), fallback to standard endpoint
    // The standard /store/products endpoint doesn't return metadata for security reasons
    let productsUrl = `${backendUrl}/store/products-with-metadata?limit=100`
    if (regionId) {
      productsUrl += `&region_id=${regionId}`
    }
    
    let response = await fetch(productsUrl, {
      headers: {
        'x-publishable-api-key': apiKey,
      },
      cache: 'no-store', // Disable caching to ensure fresh data
    })
    
    // If custom endpoint doesn't exist or fails, fallback to standard endpoint
    if (!response.ok) {
      console.warn(`Custom products endpoint failed (${response.status}), falling back to standard endpoint`)
      productsUrl = regionId 
        ? `${backendUrl}/store/products?limit=100&region_id=${regionId}`
        : `${backendUrl}/store/products?limit=100`
      
      response = await fetch(productsUrl, {
        headers: {
          'x-publishable-api-key': apiKey,
        },
        cache: 'no-store',
      })
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const products = data.products || []
    
    if (products.length === 0) {
      return []
    }
    
    // Fetch dust product settings from backend (optional - endpoint may not exist yet)
    let dustSettingsMap: Record<string, { dust_only: boolean; dust_price?: number }> = {}
    try {
      const productIds = products.map((p: any) => p.id)
      if (productIds.length > 0) {
        // Query parameter format: product_ids=id1,id2,id3 or product_ids[]=id1&product_ids[]=id2
        // Try comma-separated first, which should work with the backend
        const productIdsParam = productIds.join(',')
        const dustSettingsResponse = await fetch(`${backendUrl}/store/dust/products?product_ids=${productIdsParam}`, {
          headers: {
            'x-publishable-api-key': apiKey,
          },
          cache: 'no-store',
        })
        
        if (dustSettingsResponse.ok) {
          const dustSettingsData = await dustSettingsResponse.json()
          dustSettingsMap = dustSettingsData.settings || {}
          if (Object.keys(dustSettingsMap).length > 0) {
            console.log('[Debug] Fetched dust settings from dust_product table:', dustSettingsMap)
          } else {
            console.log('[Debug] Dust settings endpoint returned empty settings')
          }
        } else {
          const errorText = await dustSettingsResponse.text().catch(() => '')
          console.warn(`Dust products endpoint returned ${dustSettingsResponse.status}:`, errorText.substring(0, 200))
        }
      }
    } catch (err) {
      // Silently fail - dust settings are optional, we'll use metadata/tags as fallback
      console.warn('Failed to fetch dust product settings (using fallback):', err instanceof Error ? err.message : err)
    }
    
    // Transform to match expected format
    return products.map((product: any) => {
      // Debug: Log metadata for dust products
      if (product.title?.toLowerCase().includes('dust')) {
        const dustSettings = dustSettingsMap[product.id]
        console.log('[Debug] Dust product:', {
          title: product.title,
          productId: product.id,
          dustSettingsFromTable: dustSettings,
          metadata: product.metadata,
          metadata_keys: product.metadata ? Object.keys(product.metadata) : [],
        })
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
      
      // Check dust_product table settings first (primary source)
      const dustSettings = dustSettingsMap[product.id]
      const dustOnly = dustSettings?.dust_only === true
      // dust_price from dust_product table is stored as full units (e.g., 1000 = 1000 dust)
      const dustPrice = dustSettings?.dust_price !== undefined && dustSettings.dust_price !== null
        ? Number(dustSettings.dust_price) 
        : undefined
      
      // Fallback to metadata if dust_product table doesn't have settings
      const metadata = product.metadata || {}
      const metadataDustOnly = !dustSettings && (
        metadata.dust_only === true || 
        metadata.dust_only === 'true' || 
        metadata.dust_only === '1' ||
        metadata.dust_only === 1
      )
      const metadataDustPrice = !dustPrice && metadata.dust_price !== undefined && metadata.dust_price !== null
        ? Number(metadata.dust_price) 
        : undefined
      
      // Temporary fallback: Check if product title contains "dust" (for testing)
      // This helps identify dust products until the dust_product table is properly populated
      const titleContainsDust = product.title?.toLowerCase().includes('dust')
      
      // Use dust_product table settings if available, otherwise use metadata, then title check
      const finalDustOnly = dustOnly || metadataDustOnly || (titleContainsDust && !dustSettings && !metadataDustOnly)
      // Prioritize dust_price from dust_product table, then metadata, then undefined
      const finalDustPrice = dustPrice !== undefined ? dustPrice : (metadataDustPrice !== undefined ? metadataDustPrice : undefined)
      
      // If product is dust-only, ensure it has dust-only tag and remove fiat tag
      if (finalDustOnly) {
        // Remove fiat tag if present
        tags = tags.filter(t => t.value !== 'fiat')
        // Add dust-only tag if not present
        if (!tags.some(t => t.value === 'dust-only')) {
          tags.push({ value: 'dust-only' })
        }
      } else {
        // If not dust-only, ensure it doesn't have dust-only tag
        tags = tags.filter(t => t.value !== 'dust-only')
        // Add fiat tag if no tags present
        if (tags.length === 0 && transformedVariants.length > 0) {
          tags.push({ value: 'fiat' })
        }
      }
      
      // If still no tags, assign default tag based on dust settings
      if (tags.length === 0 && transformedVariants.length > 0) {
        if (finalDustOnly) {
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
        metadata: {
          ...metadata,
          dust_only: finalDustOnly,
          dust_price: finalDustPrice !== undefined ? finalDustPrice : undefined,
        },
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

