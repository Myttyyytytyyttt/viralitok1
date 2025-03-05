import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// Función para normalizar URLs de IPFS
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
  const ipfsMatch = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
  if (ipfsMatch && ipfsMatch[1]) {
    return `https://ipfs.io/ipfs/${ipfsMatch[1]}`;
  }
  
  // Si es una URL de viralitok o similar, puede contener un CID en el path
  const vercelMatch = url.match(/viralitok[^\/]+\/[^\/]+\/[^\/]+\/(Qm[a-zA-Z0-9]+)/);
  if (vercelMatch && vercelMatch[1]) {
    return `https://ipfs.io/ipfs/${vercelMatch[1]}`;
  }
  
  // Si no pudimos extraer nada, pero la URL contiene un CID de IPFS, usarlo
  const cidMatch = url.match(/(Qm[a-zA-Z0-9]{44,})/);
  if (cidMatch && cidMatch[1]) {
    return `https://ipfs.io/ipfs/${cidMatch[1]}`;
  }
  
  // Devolver la URL original si no pudimos normalizarla
  return url;
}

// Endpoint para corregir URLs de imágenes en la base de datos
export async function GET() {
  try {
    // 1. Obtener todas las filas de la tabla tokens
    const { data: tokens, error: fetchError } = await supabase
      .from('tokens')
      .select('*');
    
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ message: 'No tokens found' }, { status: 200 });
    }
    
    // 2. Para cada token, verificar y corregir la URL de imagen
    const updates = [];
    for (const token of tokens) {
      // Normalizar la URL de imagen
      const normalizedUrl = normalizeImageUrl(token.image_url);
      
      // Si la URL cambió, añadir a la lista de actualizaciones
      if (normalizedUrl !== token.image_url) {
        updates.push({
          id: token.id,
          original: token.image_url,
          normalized: normalizedUrl
        });
        
        // Actualizar en la base de datos
        const { error: updateError } = await supabase
          .from('tokens')
          .update({ image_url: normalizedUrl })
          .eq('id', token.id);
        
        if (updateError) {
          console.error(`Error updating token ${token.id}:`, updateError);
        }
      }
    }
    
    return NextResponse.json({
      message: `${updates.length} tokens updated`,
      updates
    });
    
  } catch (error) {
    console.error('Error fixing image URLs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 