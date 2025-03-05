import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  tiktokUrl: string;
  tiktokId: string | null;
  creator: string;
  timestamp: number;
  signature: string;
  imageUrl?: string;
}

// Función para asegurar que siempre guardemos URLs de IPFS directas
function normalizeImageUrl(url: string | undefined): string {
  if (!url) return '';
  
  // Si ya es una URL de IPFS directa, la devolvemos
  if (url.startsWith('https://ipfs.io/ipfs/')) {
    return url;
  }
  
  // Si es una URL de nuestro proxy de IPFS, convertirla a URL directa de IPFS
  const proxyMatch = url.match(/\/api\/ipfs\/asset\/(Qm[a-zA-Z0-9]+)/);
  if (proxyMatch && proxyMatch[1]) {
    return `https://ipfs.io/ipfs/${proxyMatch[1]}`;
  }
  
  // Buscar cualquier patrón de CID de IPFS en la URL
  const ipfsMatch = url.match(/ipfs\/([a-zA-Z0-9]+)/);
  if (ipfsMatch && ipfsMatch[1]) {
    return `https://ipfs.io/ipfs/${ipfsMatch[1]}`;
  }
  
  // Si es una URL de viralitok o similar, puede contener un CID en el path
  const vercelMatch = url.match(/viralitok[^\/]+\/[^\/]+\/[^\/]+\/(Qm[a-zA-Z0-9]+)/);
  if (vercelMatch && vercelMatch[1]) {
    return `https://ipfs.io/ipfs/${vercelMatch[1]}`;
  }
  
  // Si es una URL de nuestra API local pero contiene metadata de pump.fun, extraer imagen de ahí
  if (url.includes('pump.fun') || url.includes('metadata') || url.includes('image')) {
    // Intentar extraer la URL de la imagen desde metadata
    try {
      // Si parece ser un JSON, intentar parsearlo
      if (url.includes('{') && url.includes('}')) {
        const metadata = JSON.parse(url);
        if (metadata.image && metadata.image.startsWith('https://ipfs.io/ipfs/')) {
          return metadata.image;
        }
      }
    } catch (e) {
      // No es JSON, ignorar
    }
  }
  
  // Si no pudimos extraer nada, pero la URL contiene un CID de IPFS, usarlo
  const cidMatch = url.match(/(Qm[a-zA-Z0-9]{44,})/);
  if (cidMatch && cidMatch[1]) {
    return `https://ipfs.io/ipfs/${cidMatch[1]}`;
  }
  
  // Devolver la URL original si no pudimos normalizarla
  return url;
}

export async function POST(request: NextRequest) {
  try {
    const tokenData: TokenData = await request.json()
    
    // Validación básica
    if (!tokenData.address || !tokenData.name || !tokenData.symbol) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Guardar el token en Supabase
    const { data, error } = await supabase
      .from('tokens')
      .insert([
        {
          address: tokenData.address,
          name: tokenData.name,
          symbol: tokenData.symbol,
          tiktok_url: tokenData.tiktokUrl,
          tiktok_id: tokenData.tiktokId,
          creator: tokenData.creator,
          timestamp: tokenData.timestamp,
          signature: tokenData.signature,
          // Guardar la URL de la imagen tal cual viene, sin modificarla
          image_url: tokenData.imageUrl || ''
        }
      ])
      .select()
    
    if (error) {
      console.error('Error al guardar token en Supabase:', error)
      return NextResponse.json({ error: 'Error al guardar token' }, { status: 500 })
    }
    
    console.log(`Token guardado: ${tokenData.name} (${tokenData.symbol}) - ${tokenData.address}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Token guardado correctamente',
      token: data?.[0] || null
    })
    
  } catch (error) {
    console.error('Error guardando token:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Recuperar todos los tokens de Supabase
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .order('timestamp', { ascending: false })
    
    if (error) {
      console.error('Error al recuperar tokens de Supabase:', error)
      return NextResponse.json({ error: 'Error al recuperar tokens' }, { status: 500 })
    }
    
    // Convertir los nombres de campo de snake_case a camelCase para mantener compatibilidad
    const formattedTokens = data.map(token => ({
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      tiktokUrl: token.tiktok_url,
      tiktokId: token.tiktok_id,
      creator: token.creator,
      timestamp: token.timestamp,
      signature: token.signature,
      imageUrl: token.image_url
    }))
    
    return NextResponse.json({ tokens: formattedTokens })
  } catch (error) {
    console.error('Error al obtener tokens:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 