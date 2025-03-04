/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desactivar el powered by header
  poweredByHeader: false,
  
  // Activar modo estricto de React
  reactStrictMode: true,
  
  // Desactivar ESLint durante la construcción
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Desactivar la comprobación de tipos TypeScript durante la construcción
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Corrección de la advertencia: reemplazar domains con remotePatterns
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cloudflare-ipfs.com' },
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: 'nftstorage.link' },
      { protocol: 'https', hostname: 'dweb.link' },
      { protocol: 'https', hostname: 'gateway.ipfs.io' },
      { protocol: 'https', hostname: '*.ipfs.dweb.link' },
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