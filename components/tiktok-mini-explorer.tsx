"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { DollarSign, Loader, Star } from "lucide-react"
import { TokenData } from "@/types"

// Datos de ejemplo como fallback
const mockTikToks = [
  {
    id: 1,
    title: "Dance Challenge",
    username: "@viral_creator",
    price: "0.045",
    change: "+12.5%",
    thumbnail: "/placeholder.svg?height=80&width=80",
  },
  {
    id: 2,
    title: "Crypto Explained",
    username: "@crypto_guru",
    price: "0.078",
    change: "+5.2%",
    thumbnail: "/placeholder.svg?height=80&width=80",
  },
  {
    id: 3,
    title: "Viral Meme",
    username: "@meme_master",
    price: "0.125",
    change: "+28.7%",
    thumbnail: "/placeholder.svg?height=80&width=80",
  },
]

interface TikTokMiniExplorerProps {
  onSelectToken?: (token: TokenData) => void;
}

export default function TikTokMiniExplorer({ onSelectToken }: TikTokMiniExplorerProps) {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousTokensRef = useRef<string[]>([]);
  const [newTokenAddresses, setNewTokenAddresses] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para verificar y obtener tokens de la API
  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/save-token');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      
      const data = await response.json();
      
      if (data.tokens && Array.isArray(data.tokens)) {
        // Obtener las direcciones de tokens que ya teníamos
        const prevAddresses = previousTokensRef.current;
        
        // Ordenar por timestamp (más recientes primero)
        const sortedTokens = [...data.tokens].sort((a, b) => b.timestamp - a.timestamp);
        const currentAddresses = sortedTokens.map(token => token.address);
        
        // Detectar nuevos tokens (que están en currentAddresses pero no en prevAddresses)
        const newTokens = currentAddresses.filter(addr => !prevAddresses.includes(addr));
        
        // Si hay tokens nuevos, actualizar estado para marcarlos para animación
        if (newTokens.length > 0 && prevAddresses.length > 0) {
          console.log("New token!", newTokens);
          setNewTokenAddresses(newTokens);
          
          // Eliminar la animación después de 5 segundos
          setTimeout(() => {
            setNewTokenAddresses([]);
          }, 5000);
        }
        
        // Actualizar nuestra referencia de tokens previos
        previousTokensRef.current = currentAddresses;
        
        // Actualizar el estado con los tokens
        setTokens(sortedTokens);
      } else {
        setTokens([]);
      }
      
      if (loading) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError('Failed to load tokens');
      setLoading(false);
    }
  };

  // Configurar verificación periódica de nuevos tokens
  useEffect(() => {
    // Primera carga de tokens
    fetchTokens();
    
    // Configurar intervalo para verificar nuevos tokens cada 5 segundos
    intervalRef.current = setInterval(() => {
      fetchTokens();
    }, 5000);
    
    // Limpiar intervalo cuando se desmonte el componente
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Función para extraer el nombre de usuario del TikTok URL
  const extractUsername = (url: string): string => {
    try {
      const matches = url.match(/@([a-zA-Z0-9_.-]+)/);
      return matches ? `@${matches[1]}` : "@user";
    } catch (err) {
      return "@user";
    }
  };

  // Calcular tiempo relativo
  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  // Manejador para cuando se hace clic en un token
  const handleTokenClick = (token: TokenData) => {
    if (onSelectToken) {
      onSelectToken(token);
    }
  };

  // Si estamos cargando, mostrar un indicador
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="animate-spin text-[#8A2BE2]" size={24} />
      </div>
    );
  }

  // Si hay un error, mostrar mensaje
  if (error) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        {error}
      </div>
    );
  }

  // Si no hay tokens, mostrar los datos de ejemplo
  const displayTokens = tokens.length > 0 ? tokens : [];

  // Si no hay tokens reales ni de ejemplo, mostrar mensaje
  if (displayTokens.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        No tokens available. Create the first one!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayTokens.map((token, index) => {
        // Verificar si este token es nuevo
        const isNewToken = newTokenAddresses.includes(token.address);
        
        return (
          <div
            key={token.address || index}
            className={`border ${isNewToken ? 'border-[#8A2BE2]' : 'border-[#333]'} 
                      bg-black rounded-sm overflow-hidden hover:border-[#8A2BE2] transition cursor-pointer p-2 flex gap-3
                      ${isNewToken ? 'relative' : ''}`}
            style={{
              animation: isNewToken ? 'pulse 2s ease-in-out infinite' : 'none',
              boxShadow: isNewToken ? '0 0 10px rgba(138, 43, 226, 0.7)' : 'none',
            }}
            onClick={() => handleTokenClick(token)}
          >
            {/* Etiqueta de "Nuevo" para tokens nuevos */}
            {isNewToken && (
              <div className="absolute -top-1 -right-1 bg-[#8A2BE2] text-white text-[10px] px-1.5 py-0.5 rounded-sm flex items-center gap-1 z-10 animate-bounce">
                <Star size={10} className="fill-white" />
                <span>New!</span>
              </div>
            )}
            
            <div className="w-16 h-16 bg-[#111] rounded-sm relative flex-shrink-0">
              {/* Mostrar la imagen del token utilizando unoptimized para todas las imágenes externas */}
              <Image 
                src={token.imageUrl || "/placeholder.svg"} 
                alt={token.name} 
                fill 
                unoptimized={token.imageUrl?.startsWith('https://') || false}
                className="object-cover" 
                style={{
                  transform: isNewToken ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.5s ease-in-out',
                  animation: isNewToken ? 'scale 2s infinite' : 'none',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border border-[#333] flex items-center justify-center text-xs">
                  ▶
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between min-w-0">
              <div>
                <h3 className="font-medium text-sm truncate">{token.name}</h3>
                <p className="text-xs text-gray-400 truncate">
                  {extractUsername(token.tiktokUrl)}
                </p>
                <p className="text-xs text-gray-500">
                  {getRelativeTime(token.timestamp)}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-[#111] px-2 py-0.5 rounded-full text-xs w-fit">
                <DollarSign size={12} className="text-[#8A2BE2]" />
                <span>{token.symbol}</span>
                <span className="text-[9px] text-green-500">{"tok"}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Estilos CSS para animaciones */}
      <style jsx global>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 5px rgba(138, 43, 226, 0.5); }
          50% { box-shadow: 0 0 15px rgba(138, 43, 226, 0.8); }
          100% { box-shadow: 0 0 5px rgba(138, 43, 226, 0.5); }
        }
        
        @keyframes scale {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Mostrar datos de ejemplo después de los tokens reales si hay pocos tokens */}
      {tokens.length > 0 && tokens.length < 3 && mockTikToks.slice(0, 3 - tokens.length).map((tiktok) => (
        <div
          key={`mock-${tiktok.id}`}
          className="border border-[#333] bg-black rounded-sm overflow-hidden hover:border-[#8A2BE2] transition cursor-pointer p-2 flex gap-3"
        >
          <div className="w-16 h-16 bg-[#111] rounded-sm relative flex-shrink-0">
            <Image src={tiktok.thumbnail || "/placeholder.svg"} alt={tiktok.title} fill className="object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border border-[#333] flex items-center justify-center text-xs">
                ▶
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between min-w-0">
            <div>
              <h3 className="font-medium text-sm truncate">{tiktok.title}</h3>
              <p className="text-xs text-gray-400 truncate">{tiktok.username}</p>
            </div>
            <div className="flex items-center gap-1 bg-[#111] px-2 py-0.5 rounded-full text-xs w-fit">
              <DollarSign size={12} className="text-[#8A2BE2]" />
              <span>{tiktok.price}</span>
              <span className="text-green-500">{tiktok.change}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

