"use client"

import { useState, useEffect } from "react"

interface GlitchLogoProps {
  small?: boolean
}

export function GlitchLogo({ small = false }: GlitchLogoProps) {
  const [glitchActive, setGlitchActive] = useState(false)

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 200)
    }, 3000)

    return () => clearInterval(glitchInterval)
  }, [])

  return (
    <h1
      className={`font-mono font-bold tracking-wider ${
        small ? "text-xl" : "text-4xl"
      } ${glitchActive ? "animate-pulse" : ""}`}
      style={{
        textShadow: glitchActive
          ? `${Math.random() * 5 - 2.5}px ${Math.random() * 5 - 2.5}px 0px rgba(0, 255, 255, 0.7),
             ${Math.random() * 5 - 2.5}px ${Math.random() * 5 - 2.5}px 0px rgba(255, 0, 255, 0.7)`
          : "0 0 3px cyan, 0 0 5px magenta",
      }}
    >
      VIRALFUN.TV
    </h1>
  )
}

