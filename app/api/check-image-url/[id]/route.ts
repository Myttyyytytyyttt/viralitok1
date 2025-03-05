import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// Endpoint para verificar y obtener la URL de imagen de un token usando pump.fun
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tokenId = params.id;
  
  if (!tokenId) {
    return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
  }
  
  try {
    // 1. Obtener los datos del token de la base de datos
    const { data: token, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
    
    // 2. Intentar obtener la URL de imagen actual
    const currentImageUrl = token.image_url;
    
    // 3. Verificar si se puede llegar a ella directamente con fetch
    let validUrl = false;
    if (currentImageUrl && currentImageUrl.startsWith('https://')) {
      try {
        const response = await fetch(currentImageUrl, { method: 'HEAD' });
        validUrl = response.ok;
      } catch (e) {
        console.error(`Failed to verify image URL ${currentImageUrl}:`, e);
        validUrl = false;
      }
    }
    
    // 4. Si la URL actual no es válida o está vacía, intentar obtenerla del metadataUri
    let newImageUrl = currentImageUrl;
    
    if (!validUrl && token.metadata_uri && token.metadata_uri.startsWith('https://')) {
      try {
        // Intentar buscar la imagen en los metadatos
        const response = await fetch(token.metadata_uri);
        
        if (response.ok) {
          const metadata = await response.json();
          
          if (metadata && metadata.image && metadata.image.startsWith('https://')) {
            newImageUrl = metadata.image;
            validUrl = true;
            
            // Actualizar la URL de la imagen en la base de datos
            await supabase
              .from('tokens')
              .update({ image_url: newImageUrl })
              .eq('id', tokenId);
            
            console.log(`Updated image URL for token ${tokenId} to ${newImageUrl}`);
          }
        }
      } catch (e) {
        console.error(`Failed to fetch metadata from ${token.metadata_uri}:`, e);
      }
    }
    
    return NextResponse.json({
      token_id: tokenId,
      image_url: newImageUrl,
      valid: validUrl,
      updated: newImageUrl !== currentImageUrl
    });
    
  } catch (error) {
    console.error('Error checking image URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 