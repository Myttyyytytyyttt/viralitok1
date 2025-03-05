"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Token {
  id: number;
  address: string;
  name: string;
  symbol: string;
  image_url: string;
  tiktok_url: string;
  metadata_uri?: string;
}

export default function AdminPage() {
  const [isFixing, setIsFixing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tokens, setTokens] = useState<Token[]>([])
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Cargar tokens al inicio
  useEffect(() => {
    async function loadTokens() {
      try {
        const response = await fetch('/api/save-token');
        if (!response.ok) {
          throw new Error('Failed to load tokens');
        }
        
        const data = await response.json();
        if (data.tokens && Array.isArray(data.tokens)) {
          setTokens(data.tokens);
        }
      } catch (err) {
        console.error('Error loading tokens:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTokens();
  }, []);
  
  // Verificar URLs de imágenes en todos los tokens
  async function checkAllImageUrls() {
    setIsFixing(true)
    setError(null)
    setResult(null)
    
    const updates = [];
    
    for (const token of tokens) {
      try {
        const response = await fetch(`/api/check-image-url/${token.id}`);
        const data = await response.json();
        
        if (data.updated) {
          updates.push({
            id: token.id,
            name: token.name,
            symbol: token.symbol,
            originalUrl: token.image_url,
            newUrl: data.image_url
          });
          
          // Actualizar el token en el estado local
          const updatedToken = {...token, image_url: data.image_url};
          setTokens(prev => prev.map(t => t.id === token.id ? updatedToken : t));
        }
      } catch (err) {
        console.error(`Error checking image URL for token ${token.id}:`, err);
      }
    }
    
    setResult({
      message: `${updates.length} tokens updated`,
      updates
    });
    
    setIsFixing(false);
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="mb-10 p-6 border border-[#333] rounded-md bg-black">
        <h2 className="text-xl font-semibold mb-4">Fix Token Image URLs</h2>
        <p className="mb-4 text-gray-400">
          This tool will check all tokens' image URLs and repair any that are broken by retrieving
          the image URL from the metadata.
        </p>
        
        <button
          onClick={checkAllImageUrls}
          disabled={isFixing || isLoading}
          className="px-4 py-2 bg-[#8A2BE2] text-white rounded-md disabled:opacity-50"
        >
          {isFixing ? 'Fixing...' : isLoading ? 'Loading Tokens...' : 'Check & Fix Image URLs'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-md text-red-300">
            {error}
          </div>
        )}
        
        {result && (
          <div className="mt-4">
            <div className="p-3 bg-green-900/30 border border-green-500 rounded-md text-green-300 mb-4">
              {result.message}
            </div>
            
            {result.updates && result.updates.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Updated URLs:</h3>
                <div className="max-h-[500px] overflow-y-auto border border-[#333] rounded-md">
                  {result.updates.map((update: any) => (
                    <div key={update.id} className="p-4 border-b border-[#333] flex flex-col">
                      <div className="flex justify-between mb-2">
                        <div>
                          <span className="font-semibold">{update.name}</span>
                          <span className="text-gray-400 ml-2">{update.symbol}</span>
                        </div>
                        <span className="text-xs text-gray-500">ID: {update.id}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <h4 className="text-sm font-semibold mb-1 text-red-400">Original:</h4>
                          <div className="aspect-square w-24 h-24 bg-[#111] rounded-md mx-auto overflow-hidden relative">
                            {update.originalUrl ? (
                              <Image
                                src={update.originalUrl}
                                alt="Original"
                                fill
                                unoptimized
                                className="object-cover"
                                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-1 max-w-[200px] mx-auto">
                            {update.originalUrl || "No URL"}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold mb-1 text-green-400">New:</h4>
                          <div className="aspect-square w-24 h-24 bg-[#111] rounded-md mx-auto overflow-hidden relative">
                            {update.newUrl ? (
                              <Image
                                src={update.newUrl}
                                alt="New"
                                fill
                                unoptimized
                                className="object-cover"
                                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-1 max-w-[200px] mx-auto">
                            {update.newUrl || "No URL"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>No URLs needed fixing.</p>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <Link href="/" className="text-[#8A2BE2] hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
} 