import { NextResponse } from 'next/server'
import createTokensTable from '@/lib/createTokensTable'

// Esta ruta solo debe ser accesible por administradores o en desarrollo
export async function GET() {
  try {
    // Inicializar la tabla de tokens
    await createTokensTable()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Base de datos inicializada correctamente' 
    })
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error)
    return NextResponse.json({ 
      error: 'Error al inicializar la base de datos' 
    }, { status: 500 })
  }
} 