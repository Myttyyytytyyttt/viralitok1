"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, MessageCircle, DollarSign, Share2 } from "lucide-react"

// Mock data for TikTok videos
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
    profilePic: "/placeholder.svg?height=50&width=50",
  },
  {
    id: 2,
    username: "@crypto_influencer",
    description: "Explaining how VIRALITOKs work in 15 seconds! #crypto #VIRALITOK",
    likes: "458K",
    comments: "12.3K",
    tokenPrice: "0.078",
    tokenChange: "+5.2%",
    videoUrl: "/placeholder.svg?height=600&width=340",
    profilePic: "/placeholder.svg?height=50&width=50",
  },
  {
    id: 3,
    username: "@meme_master",
    description: "This meme is now worth $10K as a VIRALITOK! #memes #nft",
    likes: "2.4M",
    comments: "56K",
    tokenPrice: "0.125",
    tokenChange: "+28.7%",
    videoUrl: "/placeholder.svg?height=600&width=340",
    profilePic: "/placeholder.svg?height=50&width=50",
  },
]

export default function TikTokFeed() {
  const [activeVideo, setActiveVideo] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-8">
      {mockTikToks.map((tiktok) => (
        <div key={tiktok.id} className="border border-[#333] bg-black rounded-md overflow-hidden">
          <div className="flex p-3 items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden relative">
              <Image
                src={tiktok.profilePic || "/placeholder.svg"}
                alt={tiktok.username}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="font-semibold">{tiktok.username}</div>
              <div className="text-sm text-gray-400">{tiktok.description}</div>
            </div>
          </div>

          <div className="relative aspect-[9/16] max-h-[600px] bg-gray-900 flex items-center justify-center">
            <Image src={tiktok.videoUrl || "/placeholder.svg"} alt="TikTok video" fill className="object-cover" />
            <button
              className="absolute inset-0 flex items-center justify-center"
              onClick={() => setActiveVideo(activeVideo === tiktok.id ? null : tiktok.id)}
            >
              {activeVideo !== tiktok.id && (
                <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="white"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-play"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          <div className="p-3">
            <div className="flex justify-between items-center mb-3">
              <div className="flex gap-4">
                <button className="flex items-center gap-1">
                  <Heart size={20} />
                  <span className="text-sm">{tiktok.likes}</span>
                </button>
                <button className="flex items-center gap-1">
                  <MessageCircle size={20} />
                  <span className="text-sm">{tiktok.comments}</span>
                </button>
                <button>
                  <Share2 size={20} />
                </button>
              </div>

              <div className="flex items-center gap-1 bg-[#222] px-3 py-1 rounded-full">
                <DollarSign size={16} className="text-[#8A2BE2]" />
                <span>{tiktok.tokenPrice}</span>
                <span className="text-green-500 text-xs">{tiktok.tokenChange}</span>
              </div>
            </div>

            <button className="w-full py-2 border border-[#333] bg-[#111] hover:bg-[#222] transition text-sm">
              BUY TOKEN
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

