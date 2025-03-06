// Servicio para obtener datos de tokens desde Moralis API
const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImYwMTg3NzdkLTk5ZTctNDYwZS1iMjU3LTk3ODA3ODY2YWZhMyIsIm9yZ0lkIjoiNDM0ODUwIiwidXNlcklkIjoiNDQ3MzM0IiwidHlwZUlkIjoiY2ZjYThiYzUtZmY4MS00MmZkLTg2ZjUtYzc0NGY1YTBmNTY1IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDExNDE3MDEsImV4cCI6NDg5NjkwMTcwMX0.95Nji0-CPp4yJFMXv16p1r0qKF8NIlMlrSAAy75rFuE";

export interface TokenMetadata {
  mint: string;
  standard: string;
  name: string;
  symbol: string;
  logo: string;
  decimals: string;
  metaplex: {
    metadataUri: string;
    masterEdition: boolean;
    isMutable: boolean;
    sellerFeeBasisPoints: number;
    updateAuthority: string;
    primarySaleHappened: number;
  };
  fullyDilutedValue: string;
  totalSupply: string;
  totalSupplyFormatted: string;
  links: null | any;
  description: null | string;
  percentChange?: string;
}

// Direcciones de ejemplo de tokens populares en Pump.fun
export const FEATURED_TOKEN_ADDRESSES = {
  TrumpDancing: "5JhhVPKkeMD8t5PJbsgBywCaHvin6T12B4PozepLitoK",
  gatomalo: "7AKiHeT66wPVpiGpLu3fJGWMSo5XohD4xgqWVN3HWTok",
  Catok: "GxMtQbLMHpi1WRfDhif8dSurFSxnen8dTj8nSPfk8Tok" // Ejemplo de otro token popular
};

// Caché para almacenar los datos recientes y calcular cambios porcentuales
const tokenCache: Record<string, { 
  data: TokenMetadata; 
  timestamp: number;
  previousValue?: string;
  percentChange?: string;
}> = {};

// URLs de logos locales para tokens (como respaldo)
const TOKEN_LOGOS = {
  "5JhhVPKkeMD8t5PJbsgBywCaHvin6T12B4PozepLitoK": "/token-logos/viral-logo.png", // VIRAL
  "7AKiHeT66wPVpiGpLu3fJGWMSo5XohD4xgqWVN3HWTok": "/token-logos/pump-logo.png", // PUMP
  "GxMtQbLMHpi1WRfDhif8dSurFSxnen8dTj8nSPfk8Tok": "/token-logos/fart-logo.png", // FART
  "default": "/token-logos/default-token.png" // Logo por defecto
};

/**
 * Versión hardcodeada de getTokenMetadata para evitar llamadas a la API
 * @param tokenAddress Dirección del token en la cadena Solana
 * @returns Metadatos del token simulados
 */
export async function getTokenMetadata(tokenAddress: string): Promise<TokenMetadata | null> {
  console.log("Usando datos hardcodeados para", tokenAddress);
  
  // Datos hardcodeados para los tokens principales
  const hardcodedData: Record<string, TokenMetadata> = {
    // trumpdacing
    "5JhhVPKkeMD8t5PJbsgBywCaHvin6T12B4PozepLitoK": {
      mint: "5JhhVPKkeMD8t5PJbsgBywCaHvin6T12B4PozepLitoK",
      standard: "spl-token",
      name: "TrumpDancing",
      symbol: "TDAncing",
      logo: TOKEN_LOGOS["5JhhVPKkeMD8t5PJbsgBywCaHvin6T12B4PozepLitoK"],
      decimals: "9",
      metaplex: {
        metadataUri: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q2ETH5ZXegYs",
        masterEdition: false,
        isMutable: true,
        sellerFeeBasisPoints: 500,
        updateAuthority: "5JhhVPKkeMD8t5PJbsgBywCaHvin6T12B4PozepLitoK",
        primarySaleHappened: 0
      },
      fullyDilutedValue: "14528900",
      totalSupply: "10000000000000000",
      totalSupplyFormatted: "10000000",
      links: null,
      description: "Tokenized TikTok Videos on Solana",
      percentChange: "+15.42%"
    },
    
    // gatomalo
    "7AKiHeT66wPVpiGpLu3fJGWMSo5XohD4xgqWVN3HWTok": {
      mint: "7AKiHeT66wPVpiGpLu3fJGWMSo5XohD4xgqWVN3HWTok",
      standard: "spl-token",
      name: "gatomalo",
      symbol: "MALO",
      logo: TOKEN_LOGOS["7AKiHeT66wPVpiGpLu3fJGWMSo5XohD4xgqWVN3HWTok"],
      decimals: "9",
      metaplex: {
        metadataUri: "https://arweave.net/rK9UHZkCTg3Yq-5nVKuQf8FS2xAARWnM-yhA5eLhSs8",
        masterEdition: false,
        isMutable: true,
        sellerFeeBasisPoints: 0,
        updateAuthority: "7AKiHeT66wPVpiGpLu3fJGWMSo5XohD4xgqWVN3HWTok",
        primarySaleHappened: 0
      },
      fullyDilutedValue: "25467800",
      totalSupply: "1000000000000000",
      totalSupplyFormatted: "1000000",
      links: null,
      description: "The most popular meme token on Solana",
      percentChange: "+8.25%"
    },
    
    // catok
    "GxMtQbLMHpi1WRfDhif8dSurFSxnen8dTj8nSPfk8Tok": {
      mint: "GxMtQbLMHpi1WRfDhif8dSurFSxnen8dTj8nSPfk8Tok",
      standard: "spl-token",
      name: "catok",
      symbol: "catok",
      logo: TOKEN_LOGOS["GxMtQbLMHpi1WRfDhif8dSurFSxnen8dTj8nSPfk8Tok"],
      decimals: "9",
      metaplex: {
        metadataUri: "https://arweave.net/sYfZ8ccFMQqTA9HjH3ZbG4LnegWyFKKMqzFnQnJxZj4",
        masterEdition: false,
        isMutable: true,
        sellerFeeBasisPoints: 0,
        updateAuthority: "GxMtQbLMHpi1WRfDhif8dSurFSxnen8dTj8nSPfk8Tok",
        primarySaleHappened: 0
      },
      fullyDilutedValue: "6752100",
      totalSupply: "1000000000000000",
      totalSupplyFormatted: "1000000",
      links: null,
      description: "Just a stinky meme token on Solana",
      percentChange: "+4.62%"
    }
  };
  
  // Generamos datos aleatorios para tokens desconocidos
  if (hardcodedData[tokenAddress]) {
    // Simulamos cambios aleatorios en el precio cada vez
    const priceChange = Math.random() < 0.7 
      ? (Math.random() * 5) + 2 // 70% de las veces sube entre 2% y 7%
      : -(Math.random() * 3); // 30% de las veces baja hasta 3%
    
    const formattedChange = priceChange >= 0 
      ? `+${priceChange.toFixed(2)}%` 
      : `${priceChange.toFixed(2)}%`;
    
    return {
      ...hardcodedData[tokenAddress],
      percentChange: formattedChange
    };
  } else {
    // Para tokens desconocidos, generamos datos genéricos
    const tokenSymbol = tokenAddress.substring(0, 4).toUpperCase();
    const randomPrice = (Math.random() * 10000) + 1000;
    const randomChange = Math.random() < 0.6 
      ? (Math.random() * 12) 
      : -(Math.random() * 8);
    
    const formattedChange = randomChange >= 0 
      ? `+${randomChange.toFixed(2)}%` 
      : `${randomChange.toFixed(2)}%`;
    
    return {
      mint: tokenAddress,
      standard: "spl-token",
      name: `Token ${tokenSymbol}`,
      symbol: tokenSymbol,
      logo: TOKEN_LOGOS.default,
      decimals: "9",
      metaplex: {
        metadataUri: "",
        masterEdition: false,
        isMutable: true,
        sellerFeeBasisPoints: 0,
        updateAuthority: tokenAddress,
        primarySaleHappened: 0
      },
      fullyDilutedValue: randomPrice.toString(),
      totalSupply: "1000000000000000",
      totalSupplyFormatted: "1000000",
      links: null,
      description: "Generated token data",
      percentChange: formattedChange
    };
  }
}

/**
 * Obtiene los metadatos de múltiples tokens
 * @param tokenAddresses Array de direcciones de tokens
 * @returns Objeto con los metadatos indexados por dirección de token
 */
export async function getMultipleTokensMetadata(
  tokenAddresses: string[]
): Promise<Record<string, TokenMetadata | null>> {
  const results: Record<string, TokenMetadata | null> = {};
  
  // Realizar peticiones en paralelo
  const promises = tokenAddresses.map(address => 
    getTokenMetadata(address).then(data => {
      results[address] = data;
    })
  );
  
  await Promise.all(promises);
  return results;
}

/**
 * Formatea el valor de capitalización de mercado para visualización
 * @param value Valor de capitalización en string o número
 * @returns Valor formateado (ej: $1.2M)
 */
export function formatMarketCap(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return "$0";
  
  if (numValue >= 1_000_000_000) {
    return `$${(numValue / 1_000_000_000).toFixed(1)}B`;
  } else if (numValue >= 1_000_000) {
    return `$${(numValue / 1_000_000).toFixed(1)}M`;
  } else if (numValue >= 1_000) {
    return `$${(numValue / 1_000).toFixed(1)}K`;
  } else {
    return `$${numValue.toFixed(2)}`;
  }
} 