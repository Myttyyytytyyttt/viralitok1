"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { DollarSign, ChevronLeft, ChevronRight } from "lucide-react"
import { TokenData } from "@/types"
import LocalVideoPlayer from "./local-video-player"

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
    creator: "0x1234...5678"
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
    creator: "0x8765...4321"
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
    creator: "0xabcd...efgh"
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
    comments: video.comments
  }));
  
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
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{currentToken?.name || 'Video description'}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono bg-[#8A2BE2] px-2 py-1 rounded-sm">
                  {currentToken?.symbol || '0.00'} SOL
                </span>
                <span className="text-xs text-green-500 mt-1">{localVideos[currentIndex]?.tokenChange || '+0.0%'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="flex justify-between items-center p-3 border-t border-[#333] bg-[#111]">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-[#8A2BE2]" />
            <span className="text-xs font-mono">TOKENIZED TIKTOK</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400">Likes</span>
              <span className="text-xs">{localVideos[currentIndex]?.likes || '0'}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400">Comments</span>
              <span className="text-xs">{localVideos[currentIndex]?.comments || '0'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

