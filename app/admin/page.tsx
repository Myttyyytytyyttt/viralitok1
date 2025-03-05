"use client"

import { useState } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [isFixing, setIsFixing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  async function fixImageUrls() {
    setIsFixing(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await fetch('/api/fix-image-urls')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix image URLs')
      }
      
      setResult(data)
    } catch (error) {
      console.error('Error fixing image URLs:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsFixing(false)
    }
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="mb-10 p-6 border border-[#333] rounded-md bg-black">
        <h2 className="text-xl font-semibold mb-4">Fix Token Image URLs</h2>
        <p className="mb-4 text-gray-400">
          This tool will scan all tokens in the database and fix any image URLs that are
          not properly formatted as direct IPFS URLs.
        </p>
        
        <button
          onClick={fixImageUrls}
          disabled={isFixing}
          className="px-4 py-2 bg-[#8A2BE2] text-white rounded-md disabled:opacity-50"
        >
          {isFixing ? 'Fixing...' : 'Fix Image URLs'}
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
                <div className="max-h-60 overflow-y-auto border border-[#333] rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-[#111]">
                      <tr>
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Original URL</th>
                        <th className="p-2 text-left">New URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.updates.map((update: any, index: number) => (
                        <tr key={index} className="border-t border-[#333]">
                          <td className="p-2">{update.id}</td>
                          <td className="p-2 truncate max-w-[200px]">{update.original}</td>
                          <td className="p-2 truncate max-w-[200px]">{update.normalized}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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