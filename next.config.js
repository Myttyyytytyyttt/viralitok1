/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones generales
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Corrección de la advertencia: reemplazar domains con remotePatterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io'
      },
      {
        protocol: 'https',
        hostname: 'infura-ipfs.io'
      },
      {
        protocol: 'https',
        hostname: 'gateway.ipfs.io'
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com'
      }
    ],
  },
  
  // Configuración para WebAssembly en Vercel
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Versión simplificada para evitar errores de módulos no encontrados
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

module.exports = nextConfig; 