import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

export async function GET() {
  try {
    // Recuperar todos los tokens de Supabase
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
    
    if (error) {
      console.error('Error al recuperar tokens de Supabase:', error)
      return NextResponse.json({ error: 'Error al recuperar tokens' }, { status: 500 })
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ tokens: [] })
    }
    
    // Seleccionar 3 tokens aleatorios
    let randomTokens = []
    const totalTokens = data.length
    
    // Si hay menos de 3 tokens, devolvemos todos los que hay
    if (totalTokens <= 3) {
      randomTokens = [...data]
    } else {
      // Seleccionamos 3 índices aleatorios únicos
      const selectedIndices = new Set<number>()
      
      while (selectedIndices.size < 3) {
        const randomIndex = Math.floor(Math.random() * totalTokens)
        selectedIndices.add(randomIndex)
      }
      
      // Obtenemos los tokens correspondientes a esos índices
      randomTokens = Array.from(selectedIndices).map(index => data[index])
    }
    
    // Convertir los nombres de campo de snake_case a camelCase para mantener compatibilidad
    const formattedTokens = randomTokens.map(token => ({
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
    console.error('Error al obtener tokens aleatorios:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 