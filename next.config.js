/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  // Tell Next.js not to bundle these packages (they use dynamic requires)
  serverComponentsExternalPackages: [
    '@medusajs/product',
    '@medusajs/inventory',
    '@medusajs/pricing',
    '@medusajs/currency',
    '@medusajs/modules-sdk',
    '@medusajs/utils',
    'awilix',
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore warnings about dynamic requires (Medusa modules use them)
      config.ignoreWarnings = [
        { module: /node_modules\/@medusajs/ },
        /Critical dependency: the request of a dependency is an expression/,
        /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      ]
      
      // Externalize Medusa modules so they're not bundled
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push(({ request }, callback) => {
          if (request?.startsWith('@medusajs/')) {
            return callback(null, `commonjs ${request}`)
          }
          callback()
        })
      }
    }
    
    return config
  },
}

module.exports = nextConfig

