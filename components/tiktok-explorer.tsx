"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Search, DollarSign, Loader, Star } from "lucide-react"
import { TokenData } from "@/types"

// Eliminar datos de ejemplo que ya no son necesarios
interface TikTokExplorerProps {
  isVisible?: boolean;
  onSelectToken?: (token: TokenData) => void;
}

export default function TikTokExplorer({ isVisible = true, onSelectToken }: TikTokExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTokenAddresses, setNewTokenAddresses] = useState<string[]>([]);
  const previousTokensRef = useRef<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoadRef = useRef(true);

  // Función para verificar y obtener tokens de la API
  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/save-token');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      
      const data = await response.json();
      
      if (data.tokens && Array.isArray(data.tokens)) {
        // Obtener direcciones de tokens anteriores
        const prevAddresses = previousTokensRef.current;
        
        // Ordenar por timestamp (más recientes primero)
        const sortedTokens = [...data.tokens].sort((a, b) => b.timestamp - a.timestamp);
        const currentAddresses = sortedTokens.map(token => token.address);
        
        // Solo detectar nuevos tokens si no es la primera carga
        if (!isFirstLoadRef.current) {
          // Detectar nuevos tokens
          const newTokens = currentAddresses.filter(addr => !prevAddresses.includes(addr));
          
          // Si hay tokens nuevos, actualizar estado para animación
          if (newTokens.length > 0) {
            console.log("¡Nuevos tokens detectados en explorer completo!", newTokens);
            setNewTokenAddresses(newTokens);
            
            // Quitar la animación después de 5 segundos
            setTimeout(() => {
              setNewTokenAddresses([]);
            }, 5000);
          }
        }
        
        // Actualizar referencia de tokens previos
        previousTokensRef.current = currentAddresses;
        isFirstLoadRef.current = false;
        
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

  // Efecto para manejar la carga inicial y la limpieza
  useEffect(() => {
    // Primera carga de tokens solo cuando sea visible
    if (isVisible) {
      fetchTokens();
      
      // Configurar intervalo para verificar nuevos tokens cada 7 segundos
      intervalRef.current = setInterval(() => {
        fetchTokens();
      }, 7000);
    }
    
    // Limpiar intervalo cuando se desmonte o se oculte
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible]); // Reaccionar a cambios en la visibilidad

  // Si el componente cambia de oculto a visible, actualizar tokens
  useEffect(() => {
    if (isVisible && !intervalRef.current) {
      // Marcar como primera carga para evitar falsos positivos de nuevos tokens
      isFirstLoadRef.current = true;
      
      // Cargar tokens inmediatamente
      fetchTokens();
      
      // Reiniciar el intervalo
      intervalRef.current = setInterval(() => {
        fetchTokens();
      }, 7000);
    } else if (!isVisible && intervalRef.current) {
      // Detener el intervalo si el componente se oculta
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isVisible]);

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

  // Filtrar tokens basados en la búsqueda
  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.tiktokUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manejador para cuando se hace clic en un token
  const handleTokenClick = (token: TokenData) => {
    if (onSelectToken) {
      onSelectToken(token);
    }
  };

  return (
    <div className="w-full mx-auto h-full flex flex-col">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, Ticker or Tiktok URL..."
          className="w-full bg-[#111] border border-[#333] rounded-sm p-2 pl-10 focus:outline-none focus:border-[#8A2BE2]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader className="animate-spin text-[#8A2BE2]" size={32} />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-gray-400">
          {error}
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No se encontraron tokens. ¡Crea el primero!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 150px)" }}>
          {filteredTokens.length > 0 ? (
            filteredTokens.map((token, index) => {
              const isNewToken = newTokenAddresses.includes(token.address);
              
              return (
                <div
                  key={token.address || `token-${index}`}
                  className={`border ${isNewToken ? 'border-[#8A2BE2]' : 'border-[#333]'}
                            bg-black rounded-md overflow-hidden hover:border-[#8A2BE2] transition cursor-pointer relative`}
                  style={{
                    animation: isNewToken ? 'pulse 2s ease-in-out infinite' : 'none',
                    boxShadow: isNewToken ? '0 0 10px rgba(138, 43, 226, 0.7)' : 'none',
                  }}
                  onClick={() => handleTokenClick(token)}
                >
                  {isNewToken && (
                    <div className="absolute -top-1 -right-1 bg-[#8A2BE2] text-white text-[10px] px-1.5 py-0.5 rounded-sm flex items-center gap-1 z-10 animate-bounce">
                      <Star size={10} className="fill-white" />
                      <span>¡Nuevo!</span>
                    </div>
                  )}
                  <div className="flex p-3">
                    <div className="w-16 h-16 bg-gray-900 rounded-sm overflow-hidden relative mr-3">
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
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="font-semibold text-sm">{token.name}</div>
                        <div className="text-xs text-gray-400">{extractUsername(token.tiktokUrl)}</div>
                        <div className="text-xs text-gray-500">{getRelativeTime(token.timestamp)}</div>
                      </div>
                      <div className="flex items-center gap-1 bg-[#222] px-2 py-0.5 rounded-full text-xs w-fit">
                        <DollarSign size={12} className="text-[#8A2BE2]" />
                        <span>{token.symbol}</span>
                        <span className="text-green-500 text-[9px]">{"tok"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-10 text-gray-500">
              We didn't found any VIRAL atm.
            </div>
          )}
        </div>
      )}
      
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
    </div>
  )
}

