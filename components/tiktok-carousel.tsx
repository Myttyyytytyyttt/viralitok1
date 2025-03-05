"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { DollarSign, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { TokenData } from "@/types"
import LocalVideoPlayer from "./local-video-player"
import { getTokenMetadata, formatMarketCap, FEATURED_TOKEN_ADDRESSES, TokenMetadata } from "@/services/moralis"

// Función para obtener tokens de la base de datos
async function fetchTokensFromDatabase() {
  try {
    const response = await fetch('/api/tokens');
    if (!response.ok) {
      throw new Error('Error al obtener tokens de la base de datos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error al cargar tokens:', error);
    return [];
  }
}

// Lista de videos locales
const localVideos = [
  {
    id: 1,
    videoSrc: "/vid1.mp4",
    description: "Popular dance trending on TikTok",
    username: "@dancer_pro",
    tokenPrice: "0.045 SOL",
    tokenChange: "+12.5%",
    likes: "1.2M",
    comments: "24.5K",
    creator: "0x1234...5678",
    tokenAddress: FEATURED_TOKEN_ADDRESSES.vtok // Dirección del token VTOK
  },
  {
    id: 2,
    videoSrc: "/vid2.mp4",
    description: "Funny moments captured on camera",
    username: "@funnymoments",
    tokenPrice: "0.078 SOL",
    tokenChange: "+5.2%",
    likes: "458K",
    comments: "12.3K",
    creator: "0x8765...4321",
    tokenAddress: FEATURED_TOKEN_ADDRESSES.pump // Dirección del token PUMP
  },
  {
    id: 3,
    videoSrc: "/vid3.mp4",
    description: "Cute cat doing amazing tricks",
    username: "@catlover",
    tokenPrice: "0.125 SOL",
    tokenChange: "+28.7%",
    likes: "2.4M",
    comments: "56K",
    creator: "0xabcd...efgh",
    tokenAddress: FEATURED_TOKEN_ADDRESSES.fart // Dirección del otro token
  }
];

// Función para truncar la dirección del creador
const truncateAddress = (address: string): string => {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `...${address.slice(-4)}`;
};

export default function TikTokCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [opacity, setOpacity] = useState(1) // Control de opacidad
  const [initialLoading, setInitialLoading] = useState(false)
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata | null>>({})
  const [isFetching, setIsFetching] = useState(false)
  const [dbTokens, setDbTokens] = useState<any[]>([]) // Tokens de la base de datos
  
  // Cargar tokens de la base de datos al inicio
  useEffect(() => {
    const loadDbTokens = async () => {
      const tokens = await fetchTokensFromDatabase();
      setDbTokens(tokens);
    };
    
    loadDbTokens();
  }, []);
  
  // Simulamos tokens a partir de nuestros videos locales
  const featuredTokens = localVideos.map(video => ({
    address: video.creator,
    name: video.description,
    symbol: video.tokenPrice.split(' ')[0], // Solo toma el valor numérico
    tiktokUrl: video.videoSrc, // Ahora es la ruta al video local
    tiktokId: `video-${video.id}`,
    creator: video.username,
    timestamp: Date.now(),
    signature: '',
    imageUrl: '',
    // Datos adicionales para mostrar en la interfaz
    tokenChange: video.tokenChange,
    likes: video.likes,
    comments: video.comments,
    tokenAddress: video.tokenAddress // Añadimos la dirección del token
  }));
  
  // Función para obtener metadatos de los tokens
  const fetchTokenMetadata = useCallback(async () => {
    if (isFetching) return; // Evitar múltiples llamadas simultáneas
    
    setIsFetching(true);
    
    try {
      const tokenAddresses = localVideos.map(video => video.tokenAddress);
      const results: Record<string, TokenMetadata | null> = {};
      
      // Realizar llamadas en secuencia para evitar límites de API
      for (const address of tokenAddresses) {
        if (!address) continue;
        
        try {
          const data = await getTokenMetadata(address);
          if (data) {
            results[address] = data;
          }
        } catch (error) {
          console.warn(`No se pudieron obtener metadatos para el token ${address}, usando datos locales`);
          
          // Primero buscar en la base de datos
          const dbToken = dbTokens.find(token => token.address === address);
          
          if (dbToken) {
            // Usar datos de la base de datos
            results[address] = {
              mint: address,
              standard: "solana-nft",
              name: dbToken.name || "Token local",
              symbol: dbToken.symbol || "LOCAL",
              logo: "",
              decimals: "9",
              fullyDilutedValue: "1000",
              totalSupply: "1000000000",
              totalSupplyFormatted: "1000",
              metaplex: {
                metadataUri: "",
                masterEdition: false,
                isMutable: true,
                sellerFeeBasisPoints: 0,
                updateAuthority: "",
                primarySaleHappened: 0
              },
              links: null,
              description: dbToken.name || null,
              percentChange: "+0.00%"
            };
          } else {
            // Buscar en datos locales como respaldo
            const localData = localVideos.find(video => video.tokenAddress === address);
            
            // Crear un metadata simulado si no se encontró en Moralis
            if (localData) {
              results[address] = {
                mint: address,
                standard: "solana-nft",
                name: localData.description || "Token local",
                symbol: localData.tokenPrice.split(' ')[0] || "LOCAL",
                logo: "",
                decimals: "9",
                fullyDilutedValue: "1000",
                totalSupply: "1000000000",
                totalSupplyFormatted: "1000",
                metaplex: {
                  metadataUri: "",
                  masterEdition: false,
                  isMutable: true,
                  sellerFeeBasisPoints: 0,
                  updateAuthority: "",
                  primarySaleHappened: 0
                },
                links: null,
                description: localData.description || null,
                percentChange: localData.tokenChange || "+0.00%"
              };
            }
          }
        }
      }
      
      setTokenMetadata(prev => ({...prev, ...results}));
    } catch (error) {
      console.error("Error al obtener datos de tokens:", error);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, dbTokens]);
  
  // Cargar datos de tokens al montar el componente y cada 30 segundos
  useEffect(() => {
    // Realizar la primera carga (una sola vez)
    fetchTokenMetadata();
    
    // Ya no configuramos el intervalo para ahorrar llamadas a la API
    // const interval = setInterval(() => {
    //   fetchTokenMetadata();
    // }, 30000);
    
    // return () => clearInterval(interval);
  }, [fetchTokenMetadata]);
  
  // Función para cambiar slide con fade out manual
  const changeSlide = useCallback((index: number) => {
    // Iniciar la carga y resetear opacidad
    setOpacity(1);
    setIsLoading(true);
    setCurrentIndex(index);
    
    // Dar tiempo para cargar antes de iniciar el fade out (más corto para videos locales)
    setTimeout(() => {
      // Disminuir gradualmente la opacidad
      setOpacity(0.8);
      setTimeout(() => setOpacity(0.6), 100);
      setTimeout(() => setOpacity(0.4), 200);
      setTimeout(() => setOpacity(0.2), 300);
      setTimeout(() => {
        setOpacity(0);
        // Después de completar el fade out, quitar el spinner
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      }, 400);
    }, 800); // Tiempo reducido para videos locales que cargan más rápido
  }, []);
  
  const nextSlide = useCallback(() => {
    if (featuredTokens.length === 0) return;
    const nextIndex = (currentIndex + 1) % featuredTokens.length;
    changeSlide(nextIndex);
  }, [currentIndex, featuredTokens.length, changeSlide]);

  const prevSlide = useCallback(() => {
    if (featuredTokens.length === 0) return;
    const prevIndex = (currentIndex - 1 + featuredTokens.length) % featuredTokens.length;
    changeSlide(prevIndex);
  }, [currentIndex, featuredTokens.length, changeSlide]);

  // Autoplay desactivado para estos videos
  useEffect(() => {
    const interval = setInterval(() => {
      // nextSlide(); // Comentado para desactivar el autoplay
    }, 10000);

    return () => clearInterval(interval);
  }, [nextSlide]);

  const currentToken = featuredTokens[currentIndex];
  const currentTokenMetadata = currentToken?.tokenAddress ? tokenMetadata[currentToken.tokenAddress] : null;
  
  // Determinar el market cap y el cambio porcentual
  const marketCap = currentTokenMetadata?.fullyDilutedValue 
    ? formatMarketCap(currentTokenMetadata.fullyDilutedValue)
    : "$ --";
    
  const percentChange = currentTokenMetadata?.percentChange || "+0.00%";
  const isPositiveChange = percentChange.startsWith("+");

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Botones de navegación */}
      <button
        onClick={prevSlide}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 p-2 bg-black/50 backdrop-blur-sm rounded-full border border-[#333] hover:bg-[#222] transition z-10"
        disabled={isLoading || featuredTokens.length <= 1}
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 p-2 bg-black/50 backdrop-blur-sm rounded-full border border-[#333] hover:bg-[#222] transition z-10"
        disabled={isLoading || featuredTokens.length <= 1}
      >
        <ChevronRight size={24} />
      </button>

      {/* Video Display */}
      <div className="relative border border-[#333] bg-black rounded-sm overflow-hidden">
        <div className="relative aspect-[9/16] bg-[#111]">
          {/* Video Local */}
          <div className="w-full h-full">
            {currentToken && (
              <LocalVideoPlayer
                key={`video-${currentIndex}`}
                src={currentToken.tiktokUrl}
                autoPlay={true}
                loop={true}
                muted={true}
              />
            )}
          </div>
          
          {/* Spinner con opacidad controlada manualmente */}
          {isLoading && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black z-30"
              style={{ opacity: opacity }}
            >
              <div className="w-8 h-8 border-2 border-[#8A2BE2] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-black/0">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm font-medium">{currentToken?.creator || '@username'}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{currentTokenMetadata?.name || currentToken?.name || 'Video description'}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono bg-[#8A2BE2] px-2 py-1 rounded-sm">
                  {currentTokenMetadata?.symbol || currentToken?.symbol || '0.00'} 
                </span>
                <span className={`text-xs mt-1 ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                  {percentChange}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="flex justify-between items-center p-3 border-t border-[#333] bg-[#111]">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-[#8A2BE2]" />
            <span className="text-xs font-mono">MARKET CAP</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold">{marketCap}</span>
              <TrendingUp size={14} className={isPositiveChange ? 'text-green-500' : 'text-red-500'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

