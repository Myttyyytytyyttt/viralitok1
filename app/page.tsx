"use client"

import { GlitchLogo } from "@/components/glitch-logo"
import TikTokCarousel from "@/components/tiktok-carousel"
import { AlertTriangle, Send, Plus, Menu, X } from "lucide-react"
import TikTokMiniExplorer from "@/components/tiktok-mini-explorer"
import { useState } from "react"
import LaunchButton from "@/components/launch-button"
import { TokenizeModal } from "@/components/tokenize-modal"
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'react-hot-toast'
import { CustomWalletButton } from '@/components/ui/custom-wallet-button'
import TikTokExplorer from "@/components/tiktok-explorer"
import TokenDetailModal from "@/components/token-detail-modal"
import { TokenData } from "@/types"

export default function Home() {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExplorerModalOpen, setIsExplorerModalOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null)
  const [isTokenDetailOpen, setIsTokenDetailOpen] = useState(false)
  const { connected } = useWallet()

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
              <button className="px-6 py-2 text-sm border border-[#333] rounded-sm hover:bg-[#111] transition flex items-center gap-2">
                <Send size={16} />
                JOIN TELEGRAM
              </button>
              
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
                    <div>• Smart Contracts</div>
                    <div>• Tokenomics</div>
                    <div>• Web3 Integration</div>
                    <div>• Community</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                  <div>Powered by</div>
                  <div className="px-2 py-1 border border-[#333] rounded-sm">CERTIK</div>
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
                JOIN TELEGRAM
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#333] py-2 px-4 font-mono bg-black">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs text-gray-500">
          <div>/// VIRALITOK PRICE PREDICTION: $COMING SOON...</div>
          <div className="hidden md:block">© "viral content = digital wealth"</div>
          <div className="hidden md:block">TOKENIZATION PROTOCOL DISABLED ///</div>
        </div>
      </footer>

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

