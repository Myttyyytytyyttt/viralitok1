"use client"

import { useState, useEffect } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import dynamic from 'next/dynamic'

// Componente que muestra un botón de carga hasta que el cliente está listo
const ClientWalletButton = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render un botón de placeholder con la misma apariencia pero sin iconos
    return (
      <button className="wallet-adapter-button wallet-adapter-button-trigger">
        Connect Wallet
      </button>
    )
  }

  return <WalletMultiButton />
}

// Exportamos el componente con carga dinámica y sin SSR
export const CustomWalletButton = dynamic(
  () => Promise.resolve(ClientWalletButton),
  { ssr: false }
) 