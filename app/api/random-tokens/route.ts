import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

// Función utilitaria para reintento con backoff exponencial
async function retryOperation(operation: Function, maxRetries = 3): Promise<any> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Timeout para la operación
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operación cancelada por timeout')), 8000)
      );
      
      // Ejecutar operación con timeout
      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);
      
      return result; // Si la operación tiene éxito, devolvemos el resultado
    } catch (error) {
      lastError = error;
      console.warn(`Intento ${attempt + 1} fallido:`, error);
      
      // Esperar antes de reintentar (backoff exponencial)
      const backoffTime = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  
  throw lastError;
}

export async function GET() {
  try {
    // Usar retry para la consulta a Supabase
    const { data, error } = await retryOperation(async () => {
      return await supabase
        .from('tokens')
        .select('*')
    });
    
    if (error) {
      console.error('Error al recuperar tokens de Supabase:', error)
      // Devolver respuesta de error que muestra datos simulados en el frontend
      return NextResponse.json({ 
        tokens: [], 
        error: 'Error al recuperar tokens', 
        useMockData: true 
      }, { status: 200 }) // Devolvemos 200 para que el frontend pueda manejar la situación
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
    // Devolver respuesta que permite continuar al frontend
    return NextResponse.json({ 
      tokens: [], 
      error: 'Error al conectar con la base de datos',
      useMockData: true 
    }, { status: 200 }) // Usamos 200 para que el frontend pueda manejar la situación
  }
} 