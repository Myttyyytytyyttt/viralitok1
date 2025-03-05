"use client"

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { Toaster } from 'react-hot-toast'
import { useState, useMemo } from 'react'
import SplashScreen from '../components/SplashScreen'

// Importar estilos para los componentes de wallet
import '@solana/wallet-adapter-react-ui/styles.css'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showSplash, setShowSplash] = useState(true);
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
  )

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <div className="relative min-h-screen bg-black text-white">
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <div style={{ opacity: showSplash ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}>
              {children}
            </div>
            <Toaster />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  )
} 