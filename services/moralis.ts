// Servicio para obtener datos de tokens desde Moralis API
const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjgwYTQxNjJlLWU5YWYtNGMxMC05NzAwLTIyYTBjZmYwZDk5YyIsIm9yZ0lkIjoiNDM0ODI1IiwidXNlcklkIjoiNDQ3MzA5IiwidHlwZUlkIjoiNjFmNmI2Y2MtMmM3Ny00N2NlLWFjNWItNzcwNjlhMzUzMjhkIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDExMjg2NDgsImV4cCI6NDg5Njg4ODY0OH0.Hc2TupWOA2xgHZYvimfFyYQSFmoPljt05HbkHKdP314";

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
  vtok: "5JhhVPKkeMD8t5PJbsgBywCaHvin6T12B4PozepLitoK",
  pump: "7AKiHeT66wPVpiGpLu3fJGWMSo5XohD4xgqWVN3HWTok",
  fart: "GxMtQbLMHpi1WRfDhif8dSurFSxnen8dTj8nSPfk8Tok" // Ejemplo de otro token popular
};

// Caché para almacenar los datos recientes y calcular cambios porcentuales
const tokenCache: Record<string, { 
  data: TokenMetadata; 
  timestamp: number;
  previousValue?: string;
  percentChange?: string;
}> = {};

/**
 * Obtiene los metadatos de un token desde la API de Moralis
 * @param tokenAddress Dirección del token en la cadena Solana
 * @returns Metadatos del token o null si hay un error
 */
export async function getTokenMetadata(tokenAddress: string): Promise<TokenMetadata | null> {
  try {
    const response = await fetch(
      `https://solana-gateway.moralis.io/token/mainnet/${tokenAddress}/metadata`,
      {
        headers: {
          'accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching token metadata: ${response.status}`);
    }

    const data: TokenMetadata = await response.json();
    
    // Guardar los datos en caché para calcular cambios porcentuales
    const previousData = tokenCache[tokenAddress];
    let percentChange = "0.00%";
    
    if (previousData && previousData.data.fullyDilutedValue) {
      const prevValue = parseFloat(previousData.data.fullyDilutedValue);
      const currentValue = parseFloat(data.fullyDilutedValue);
      
      if (!isNaN(prevValue) && !isNaN(currentValue) && prevValue > 0) {
        const changePercent = ((currentValue - prevValue) / prevValue) * 100;
        percentChange = changePercent >= 0 
          ? `+${changePercent.toFixed(2)}%` 
          : `${changePercent.toFixed(2)}%`;
      }
    }
    
    tokenCache[tokenAddress] = {
      data,
      timestamp: Date.now(),
      previousValue: previousData?.data.fullyDilutedValue,
      percentChange
    };
    
    // Añadir el cambio porcentual a los datos
    return {
      ...data,
      percentChange
    } as TokenMetadata & { percentChange: string };
    
  } catch (error) {
    console.error("Error en Moralis API:", error);
    // En lugar de retornar null, relanzamos la excepción para que sea manejada por el componente
    throw error;
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