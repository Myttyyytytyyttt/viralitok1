"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, MessageCircle, DollarSign } from "lucide-react"

export default function TikTokPreview() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="border border-[#333] bg-black rounded-sm overflow-hidden">
      <div className="relative aspect-[9/16] bg-[#111]">
        <Image src="/placeholder.svg?height=600&width=340" alt="Featured TikTok" fill className="object-cover" />

        {/* Play Button */}
        <button className="absolute inset-0 flex items-center justify-center" onClick={() => setIsPlaying(!isPlaying)}>
          <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border border-white/20">
            ▶
          </div>
        </button>

        {/* Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart size={20} />
              <span>1.2M</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span>24.5K</span>
            </div>
            <div className="ml-auto flex items-center gap-1 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
              <DollarSign size={16} className="text-[#8A2BE2]" />
              <span>0.045</span>
              <span className="text-green-500">+12.5%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 text-center bg-[#111] text-sm font-mono">
        <span className="text-[#8A2BE2]">FEATURED</span> VIRALITOK
      </div>
    </div>
  )
}

