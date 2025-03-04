"use client"

import { GlitchLogo } from "@/components/glitch-logo"
import TikTokCarousel from "@/components/tiktok-carousel"
import { AlertTriangle, Send, Plus, Menu, X, Twitter } from "lucide-react"
import TikTokMiniExplorer from "@/components/tiktok-mini-explorer"
import { useState, useEffect, useRef } from "react"
import LaunchButton from "@/components/launch-button"
import { TokenizeModal } from "@/components/tokenize-modal"
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'react-hot-toast'
import { CustomWalletButton } from '@/components/ui/custom-wallet-button'
import TikTokExplorer from "@/components/tiktok-explorer"
import TokenDetailModal from "@/components/token-detail-modal"
import { TokenData } from "@/types"

// Función que convierte letras a números aleatoriamente
const hackerEffect = (text: string, activePositions: {textIndex: number, charIndex: number}[]): string => {
  const chars = "0123456789";
  
  // Solo aplicamos el efecto en las posiciones activas específicas
  return text.split('').map((char, charIndex) => {
    // Verificar si esta posición específica está activa
    const isActive = activePositions.some(pos => 
      pos.textIndex === -1 && pos.charIndex === charIndex); // -1 es un marcador especial para la iteración actual
    
    if (isActive && ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === ' ')) {
      return chars[Math.floor(Math.random() * chars.length)];
    }
    return char;
  }).join('');
};

export default function Home() {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExplorerModalOpen, setIsExplorerModalOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null)
  const [isTokenDetailOpen, setIsTokenDetailOpen] = useState(false)
  const { connected } = useWallet()

  // Referencias y estado para el efecto hacker
  const [hackerTexts, setHackerTexts] = useState<string[]>([]);
  const originalTexts = useRef<string[]>([
    "/// VIRALITOK PRICE PREDICTION: $COMING SOON...",
    "© \"viral content = digital wealth\"",
    "TOKENIZATION PROTOCOL ENABLED ///",
    "SOLANA × VIRALITOK",
    "BUY $VTOK NOW ON PUMP.FUN"
  ]);
  
  // Mantener un registro de qué posiciones están activas para el efecto
  const [activePositions, setActivePositions] = useState<{textIndex: number, charIndex: number}[]>([]);
  
  // Efecto para inicializar los textos
  useEffect(() => {
    setHackerTexts([...originalTexts.current]);
    
    // Función para seleccionar nuevas posiciones aleatorias
    const selectNewPositions = () => {
      const newPositions: {textIndex: number, charIndex: number}[] = [];
      const maxActivePositions = 4; // Máximo 4 letras cambiando en todo el rodapié
      
      // Elegir hasta 4 posiciones aleatorias
      while (newPositions.length < maxActivePositions) {
        // Elegir un texto aleatorio
        const textIndex = Math.floor(Math.random() * originalTexts.current.length);
        const text = originalTexts.current[textIndex];
        
        // Elegir una posición aleatoria dentro de ese texto
        const charIndex = Math.floor(Math.random() * text.length);
        const char = text[charIndex];
        
        // Solo añadir si es una letra o espacio (no símbolos)
        if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === ' ') {
          // Verificar que esta posición no esté ya seleccionada
          const alreadySelected = newPositions.some(
            pos => pos.textIndex === textIndex && pos.charIndex === charIndex
          );
          
          if (!alreadySelected) {
            newPositions.push({ textIndex, charIndex });
          }
        }
      }
      
      setActivePositions(newPositions);
    };
    
    // Función para actualizar el efecto hacker
    const updateHackerEffect = () => {
      setHackerTexts(originalTexts.current.map((text, textIndex) => {
        // Filtrar posiciones activas para este texto específico
        const textActivePositions = activePositions
          .filter(pos => pos.textIndex === textIndex)
          // Convertir el índice de texto a -1 para la función hackerEffect
          .map(pos => ({textIndex: -1, charIndex: pos.charIndex}));
        
        // Solo aplicar el efecto si hay posiciones activas para este texto
        if (textActivePositions.length > 0) {
          return hackerEffect(text, textActivePositions);
        }
        return text;
      }));
    };
    
    // Temporizador para seleccionar nuevas posiciones cada 3 segundos
    const positionInterval = setInterval(selectNewPositions, 3000);
    
    // Temporizador para actualizar el efecto más frecuentemente (aspecto parpadeante)
    const effectInterval = setInterval(updateHackerEffect, 100);
    
    return () => {
      clearInterval(positionInterval);
      clearInterval(effectInterval);
    };
  }, [activePositions]);

  const handleTokenizeClick = () => {
    if (!connected) {
      toast.error('Please connect your wallet to tokenize TikTok videos', {
        duration: 3000,
        position: 'bottom-center',
        style: {
          background: '#111',
          color: '#fff',
          border: '1px solid #333',
        },
        icon: '🔒',
      });
    }
    setIsModalOpen(true);
  }

  // Función para abrir el modal de detalle del token
  const handleOpenTokenDetail = (token: TokenData) => {
    setSelectedToken(token);
    setIsTokenDetailOpen(true);
  };

  return (
    <main className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[#333] bg-black">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <GlitchLogo small />
            <div className="text-xs tracking-widest opacity-50 hidden md:block">/// TOKENIZING VIRAL CONTENT</div>
          </div>

          {/* Right Section */}
          <div className="flex gap-4 items-center">
            <div className="hidden md:flex gap-4">
              <a href="https://twitter.com/Viralitok_sol" target="_blank" rel="noopener noreferrer" className="px-6 py-2 text-sm border border-[#333] rounded-sm hover:bg-[#111] transition flex items-center gap-2">
                <Twitter size={16} />
                FOLLOW TWITTER
              </a>
              
              {/* Usar nuestro componente personalizado */}
              <div className="wallet-adapter-dropdown">
                <CustomWalletButton />
              </div>
            </div>
            <button
              onClick={() => setIsRightPanelOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center border border-[#333] rounded-sm"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Left/Main Panel (Full width on mobile) */}
        <div className="flex-1 flex md:w-[calc(100%-20rem)]">
          {/* Explorer Section (Full width on mobile, left panel on desktop) */}
          <div className="w-full md:w-80 border-r border-[#333] p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-mono">EXPLORE VIRALITOKS</h2>
              <button 
                onClick={() => setIsExplorerModalOpen(true)}
                className="px-3 py-1 text-xs border border-[#333] rounded-sm hover:bg-[#111] transition">
                VIEW ALL
              </button>
            </div>
            <TikTokMiniExplorer onSelectToken={handleOpenTokenDetail} />
          </div>

          {/* Center Panel (Hidden on mobile) */}
          <div className="hidden md:flex flex-1 flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
              <TikTokCarousel />
            </div>
          </div>
        </div>

        {/* Right Panel (Slide in on mobile) */}
        <div
          className={`
          fixed md:relative top-0 right-0 w-80 h-full bg-black border-l border-[#333] 
          transform transition-transform duration-300 ease-in-out z-50
          ${isRightPanelOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
        `}
        >
          {/* Mobile Close Button */}
          <button
            className="md:hidden absolute top-4 left-4 p-2 border border-[#333] rounded-sm hover:bg-[#111] transition"
            onClick={() => setIsRightPanelOpen(false)}
          >
            <X size={20} />
          </button>

          <div className="h-full p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6 pt-12 md:pt-0">
              {/* Project Info */}
              <div className="space-y-4 border-b border-[#333] pb-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-mono text-[#8A2BE2]">ABOUT</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Transform viral TikTok content into tradeable digital assets. Our protocol enables creators to
                    monetize their influence through blockchain technology.
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-mono text-[#4CAF50]">TEAM</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    <div>• Mytyty</div>
                    <div>• StackToFlow</div>
                    <div>• v0.</div>
                    <div>• Community</div>
                  </div>
                </div>

                <div className="flex flex-col items-start text-xs text-gray-500 pt-2 space-y-2">
                  <div>Powered by</div>
                  <div className="flex flex-wrap gap-2">
                    {/* Solana */}
                    <div className="px-2 py-1 border border-[#333] rounded-sm flex items-center gap-1 hover:bg-[#1a1a1a] transition-colors">
                      <svg className="w-3 h-3" viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M64.6833 237.316L98.2634 271.298C99.5696 272.615 101.286 273.44 103.116 273.647C104.946 273.855 106.795 273.433 108.351 272.449L226.011 196.278" stroke="#9945FF" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M226.011 115.029L108.351 38.8581C106.795 37.8745 104.946 37.4528 103.116 37.6599C101.286 37.867 99.5696 38.6927 98.2634 40.0093L64.6833 73.9909" stroke="#19FB9B" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M64.6836 73.9912V237.316" stroke="#19FB9B" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M283.366 38.8581L165.706 115.029L283.366 191.2C284.923 192.184 286.772 192.605 288.602 192.398C290.432 192.191 292.148 191.365 293.454 190.049L327.034 156.067" stroke="#9945FF" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M327.034 156.067V40.0093C327.034 38.1365 326.295 36.34 324.981 35.0159C323.666 33.6918 321.884 32.9478 320.025 32.9478H297.997" stroke="#9945FF" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-purple-400">Solana</span>
                    </div>
                    
                    {/* PumpFun */}
                    <div className="px-2 py-1 border border-[#333] rounded-sm flex items-center gap-1 hover:bg-[#1a1a1a] transition-colors">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L4 6V12C4 17.5 7.8 22 12 22C16.2 22 20 17.5 20 12V6L12 2Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-orange-400">PumpFun</span>
                    </div>
                    
                    {/* MoralisAPI */}
                    <div className="px-2 py-1 border border-[#333] rounded-sm flex items-center gap-1 hover:bg-[#1a1a1a] transition-colors">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" stroke="#3498DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 8V16" stroke="#3498DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 12H16" stroke="#3498DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-blue-400">MoralisAPI</span>
                    </div>
                    
                    {/* Supabase */}
                    <div className="px-2 py-1 border border-[#333] rounded-sm flex items-center gap-1 hover:bg-[#1a1a1a] transition-colors">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 14V10C21 8.93913 20.5786 7.92172 19.8284 7.17157C19.0783 6.42143 18.0609 6 17 6H7C5.93913 6 4.92172 6.42143 4.17157 7.17157C3.42143 7.92172 3 8.93913 3 10V14C3 15.0609 3.42143 16.0783 4.17157 16.8284C4.92172 17.5786 5.93913 18 7 18H17C18.0609 18 19.0783 17.5786 19.8284 16.8284C20.5786 16.0783 21 15.0609 21 14Z" stroke="#3ECF8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 10V14" stroke="#3ECF8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 10V14" stroke="#3ECF8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 10V14" stroke="#3ECF8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-green-400">Supabase</span>
                    </div>
                    
                    {/* Vercel */}
                    <div className="px-2 py-1 border border-[#333] rounded-sm flex items-center gap-1 hover:bg-[#1a1a1a] transition-colors">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L22 20H2L12 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-white">Vercel</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border border-[#331111] bg-[#110808] rounded-sm font-mono">
                <div className="flex items-center gap-2 text-yellow-500 mb-2 text-sm">
                  <AlertTriangle size={16} />
                  WARNING
                </div>
                <p className="text-xs text-gray-400">High risk investment. Only invest what you can afford to lose.</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Mobile-only buttons */}
              <div className="flex md:hidden gap-3 mb-3">
                <button className="flex-1 py-2 border border-[#333] rounded-sm hover:bg-[#111] transition flex items-center justify-center gap-2 text-sm">
                  <Send size={16} />
                  TELEGRAM
                </button>
                <button className="flex-1 py-2 border border-[#333] rounded-sm hover:bg-[#111] transition text-sm">
                  CONNECT
                </button>
              </div>

              <button 
                onClick={handleTokenizeClick}
                className="w-full py-3 bg-gradient-to-r from-[#8A2BE2] to-[#4CAF50] hover:opacity-90 transition rounded-sm relative group overflow-hidden flex items-center justify-center gap-2 font-mono"
              >
                <Plus size={18} />
                START TOKENIZING
              </button>
              <button className="w-full py-2 border border-[#333] hover:bg-[#111] transition flex items-center justify-center gap-2 rounded-sm text-sm">
                <a href="https://pump.fun/token/vtok" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-full">
                  BUY $VTOK
                </a>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#333] py-2 px-0 font-mono bg-black overflow-hidden">
        <div className="ticker-container w-full relative overflow-hidden">
          <div className="ticker-animation flex whitespace-nowrap text-gray-500 text-xs">
            <div className="ticker-content flex items-center space-x-8 animate-marquee hacker-text">
              {hackerTexts.map((text, index) => (
                <span key={index} className="hacker-span">{text}</span>
              ))}
            </div>
            {/* Duplicado para crear una animación continua sin saltos */}
            <div className="ticker-content flex items-center space-x-8 animate-marquee hacker-text">
              {hackerTexts.map((text, index) => (
                <span key={`dup-${index}`} className="hacker-span">{text}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Añadir estilos para la animación del ticker y efecto hacker */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        
        .ticker-container:hover .animate-marquee {
          animation-play-state: paused;
        }
        
        .hacker-span {
          transition: color 0.1s ease;
        }
        
        .hacker-span:hover {
          color: #4CAF50;
          text-shadow: 0 0 5px rgba(76, 175, 80, 0.7);
        }
      `}</style>

      {/* Modal del explorador completo */}
      {isExplorerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-[#333] rounded-md w-full max-w-4xl relative max-h-[90vh] flex flex-col">
            <div className="border-b border-[#333] p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold tracking-wide">EXPLORE ALL VIRALITOKS</h3>
              <button
                onClick={() => setIsExplorerModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#222]"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4">
              <TikTokExplorer isVisible={isExplorerModalOpen} onSelectToken={handleOpenTokenDetail} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de tokenización */}
      <TokenizeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      {/* Modal de detalle del token */}
      <TokenDetailModal 
        isOpen={isTokenDetailOpen} 
        onClose={() => setIsTokenDetailOpen(false)} 
        token={selectedToken} 
      />
    </main>
  )
}

