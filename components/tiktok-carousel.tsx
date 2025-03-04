"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { DollarSign, ChevronLeft, ChevronRight } from "lucide-react"
import TikTokEmbed from "./tiktok-embed"
import { TokenData } from "@/types"

// Array de respaldo en caso de error o mientras se cargan los datos
const mockTikToks = [
  {
    id: 1,
    username: "@viral_creator",
    description: "This dance went viral overnight! #trending #dance",
    likes: "1.2M",
    comments: "24.5K",
    tokenPrice: "0.045",
    tokenChange: "+12.5%",
    videoUrl: "/placeholder.svg?height=600&width=340",
  },
  {
    id: 2,
    username: "@crypto_influencer",
    description: "Explaining ViraliTok in 15 seconds! #crypto",
    likes: "458K",
    comments: "12.3K",
    tokenPrice: "0.078",
    tokenChange: "+5.2%",
    videoUrl: "/placeholder.svg?height=600&width=340",
  },
  {
    id: 3,
    username: "@meme_master",
    description: "This meme is now worth $10K! #nft",
    likes: "2.4M",
    comments: "56K",
    tokenPrice: "0.125",
    tokenChange: "+28.7%",
    videoUrl: "/placeholder.svg?height=600&width=340",
  },
]

// Función para extraer el nombre de usuario desde la URL de TikTok
const extractUsername = (url: string): string => {
  try {
    const matches = url.match(/@([a-zA-Z0-9_.-]+)/);
    return matches ? `@${matches[1]}` : "@user";
  } catch (err) {
    return "@user";
  }
};

// Función para truncar la dirección del creador
const truncateAddress = (address: string): string => {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `...${address.slice(-4)}`;
};

export default function TikTokCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [opacity, setOpacity] = useState(1) // Control de opacidad
  const [featuredTokens, setFeaturedTokens] = useState<TokenData[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  
  // Cargar tokens aleatorios al montar el componente
  useEffect(() => {
    const fetchRandomTokens = async () => {
      try {
        const response = await fetch('/api/random-tokens');
        if (response.ok) {
          const data = await response.json();
          if (data.tokens && data.tokens.length > 0) {
            setFeaturedTokens(data.tokens);
          } else if (data.useMockData) {
            // Si la API indica que deberíamos usar datos simulados
            console.info('Usando datos simulados debido a problemas de conexión con la base de datos');
            // Crear tokens simulados basados en mockTikToks
            const mockTokens = mockTikToks.map((mock, index) => ({
              address: `mock_address_${index}`,
              name: mock.description,
              symbol: mock.tokenPrice,
              tiktokUrl: mock.videoUrl,
              tiktokId: `tiktok_${index}`,
              creator: mock.username,
              timestamp: Date.now(), // Usando timestamp en milisegundos (número)
              signature: '',
              imageUrl: ''
            }));
            setFeaturedTokens(mockTokens);
          }
        } else {
          console.error('Error al obtener tokens aleatorios:', response.status);
          // Usar datos de respaldo si la API falla
          const mockTokens = mockTikToks.map((mock, index) => ({
            address: `mock_address_${index}`,
            name: mock.description,
            symbol: mock.tokenPrice,
            tiktokUrl: mock.videoUrl,
            tiktokId: `tiktok_${index}`,
            creator: mock.username,
            timestamp: Date.now(), // Usando timestamp en milisegundos (número)
            signature: '',
            imageUrl: ''
          }));
          setFeaturedTokens(mockTokens);
        }
      } catch (error) {
        console.error('Error al conectar con API:', error);
        // Usar datos de respaldo si la API falla
        const mockTokens = mockTikToks.map((mock, index) => ({
          address: `mock_address_${index}`,
          name: mock.description,
          symbol: mock.tokenPrice,
          tiktokUrl: mock.videoUrl,
          tiktokId: `tiktok_${index}`,
          creator: mock.username,
          timestamp: Date.now(), // Usando timestamp en milisegundos (número)
          signature: '',
          imageUrl: ''
        }));
        setFeaturedTokens(mockTokens);
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchRandomTokens();
  }, []);
  
  // Función para cambiar slide con fade out manual
  const changeSlide = useCallback((index: number) => {
    // Iniciar la carga y resetear opacidad
    setOpacity(1);
    setIsLoading(true);
    setCurrentIndex(index);
    
    // Después de 1.6 segundos, iniciar el fade out
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
    }, 1000);
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

  // Autoplay si se desea
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlaying && featuredTokens.length > 0) {
        nextSlide();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, nextSlide, featuredTokens]);

  // Fall back a mock data si no hay tokens reales
  const currentTikTok = mockTikToks[currentIndex];
  const currentToken = featuredTokens.length > 0 ? featuredTokens[currentIndex] : null;

  if (initialLoading) {
    return (
      <div className="relative w-full max-w-sm mx-auto border border-[#333] bg-black rounded-sm overflow-hidden">
        <div className="relative aspect-[9/16] bg-[#111] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#8A2BE2] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="p-3 text-center bg-[#111] text-sm font-mono">
          <span className="text-[#8A2BE2]">LOADING</span> FEATURED TOKENS
        </div>
      </div>
    );
  }

  // Si no hay tokens disponibles
  if (featuredTokens.length === 0) {
    return (
      <div className="relative w-full max-w-sm mx-auto border border-[#333] bg-black rounded-sm overflow-hidden">
        <div className="relative aspect-[9/16] bg-[#111] flex items-center justify-center flex-col p-4 text-center">
          <p className="text-lg mb-2 text-gray-300">No tokens available</p>
          <p className="text-sm text-gray-500">Create a token to be featured here</p>
        </div>
        <div className="p-3 text-center bg-[#111] text-sm font-mono">
          <span className="text-[#8A2BE2]">FEATURED</span> VIRALITOK
        </div>
      </div>
    );
  }

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

      {/* TikTok Display */}
      <div className="relative border border-[#333] bg-black rounded-sm overflow-hidden">
        <div className="relative aspect-[9/16] bg-[#111]">
          {/* Video de TikTok - Siempre se muestra, incluso durante la carga */}
          <div className="w-full h-full">
            {currentToken && (
              <TikTokEmbed 
                key={`tiktok-${currentIndex}-${Date.now()}`}
                url={currentToken.tiktokUrl} 
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

          {/* Información superior */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20">
            <h3 className="font-medium text-sm">
              {currentToken 
                ? truncateAddress(currentToken.creator) 
                : currentTikTok.username}
            </h3>
            <p className="text-xs text-gray-300">
              {currentToken 
                ? currentToken.name
                : currentTikTok.description}
            </p>
          </div>

          {/* Estadísticas inferiores */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
            <div className="flex items-center gap-4">
              <div className="ml-auto flex items-center gap-1 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <DollarSign size={16} className="text-[#8A2BE2]" />
                <span>{currentToken ? currentToken.symbol : currentTikTok.tokenPrice}</span>
                {/* Si se quiere mostrar un cambio de precio, se puede agregar aquí */}
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="h-1 bg-[#111] flex">
          {featuredTokens.map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-all duration-200 ${
                i === currentIndex ? "bg-gradient-to-r from-[#8A2BE2] to-[#4CAF50]" : ""
              }`}
            />
          ))}
        </div>

        <div className="p-3 text-center bg-[#111] text-sm font-mono">
          <span className="text-[#8A2BE2]">FEATURED</span> VIRALITOK
        </div>
      </div>
    </div>
  )
}

