"use client"

import { useState, useEffect } from "react"
import { CustomWalletButton } from '@/components/ui/custom-wallet-button'
import { useWallet } from '@solana/wallet-adapter-react'
import { RainbowButton } from "@/components/ui/rainbow-button"
import { OfficialTokenizeModal } from "./official-tokenize-modal"
import { Loader } from "lucide-react"

export default function OfficialTokenPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { connected, publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading to further hide the page
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  const handleTokenizeClick = () => {
    if (!connected) {
      return
    }
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader className="animate-spin text-[#8A2BE2]" size={40} />
      </div>
    )
  }

  return (
    <main className="h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 border border-[#333] rounded-sm space-y-6 bg-black">
        <h1 className="text-xl font-mono text-center">VIRAL TOKEN DEPLOY</h1>
        <p className="text-xs text-gray-400 text-center">
          This interface is for deploying the official token with a contract ending in "viral".
        </p>
        
        {!connected ? (
          <div className="flex justify-center py-4">
            <CustomWalletButton />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-center text-green-500">
              Wallet connected: {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}
            </p>
            <RainbowButton 
              onClick={handleTokenizeClick}
              className="w-full py-3 font-mono"
            >
              DEPLOY VIRAL TOKEN
            </RainbowButton>
          </div>
        )}
      </div>

      <OfficialTokenizeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </main>
  )
} 