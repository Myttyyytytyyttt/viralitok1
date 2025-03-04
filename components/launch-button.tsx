"use client"

import { useState } from "react"
import { TokenizeModal } from "./tokenize-modal"
import { Plus } from "lucide-react"

export default function LaunchButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full py-3 bg-gradient-to-r from-[#8A2BE2] to-[#4CAF50] hover:opacity-90 transition rounded-sm relative group overflow-hidden flex items-center justify-center gap-2 font-mono"
      >
        <Plus size={18} />
        START TOKENIZING
      </button>

      <TokenizeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

