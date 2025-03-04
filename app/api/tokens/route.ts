import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

export async function GET() {
  try {
    // Obtener todos los tokens de la base de datos
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
    
    if (error) {
      console.error('Error al obtener tokens:', error)
      return NextResponse.json(
        { error: 'Error al obtener tokens de la base de datos' },
        { status: 500 }
      )
    }
    
    // Devolver los tokens
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
} 