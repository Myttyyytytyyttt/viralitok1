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
          image_url: tokenData.imageUrl
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