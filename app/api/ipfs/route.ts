import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

// Definición del tipo de almacenamiento
declare global {
  var memoryStorage: Record<string, {
    type: string;
    content: Uint8Array;
    uri: string;
  }>;
}

// Inicializar el almacenamiento global si no existe
if (!global.memoryStorage) {
  global.memoryStorage = {};
}

// Función para generar un hash de contenido
function generateContentHash(content: Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Simular un CID de IPFS basado en el hash del contenido
function generateSimulatedCID(hash: string): string {
  return `Qm${hash.substring(0, 44)}`;
}

// Función para obtener la URL base de la aplicación
function getBaseUrl(request: NextRequest): string {
  // Intentar obtener el host de la solicitud
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Procesando solicitud IPFS en API local');
    
    // Procesar el FormData de la solicitud
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const name = formData.get('name') as string;
    const symbol = formData.get('symbol') as string;
    const description = formData.get('description') as string;
    const external_url = formData.get('external_url') as string;
    
    console.log('Datos recibidos:', { name, symbol, description });
    
    // Obtener la URL base
    const baseUrl = getBaseUrl(request);
    
    // Crear objeto de metadata
    const metadata: any = {
      name,
      symbol,
      description,
      external_url
    };
    
    // Procesar la imagen si existe
    let imageCID = null;
    let imageURI = null;
    
    if (imageFile) {
      console.log('Procesando imagen:', imageFile.name);
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const imageHash = generateContentHash(buffer);
      imageCID = generateSimulatedCID(imageHash);
      
      // Guardar la imagen en memoria global
      const fileExtension = imageFile.name.split('.').pop() || 'png';
      const fileName = `${imageCID}.${fileExtension}`;
      
      // Almacenar en memoria global
      global.memoryStorage[imageCID] = {
        type: imageFile.type,
        content: new Uint8Array(buffer),
        uri: `/api/ipfs/asset/${imageCID}`
      };
      
      // URL pública para la imagen a través de nuestro API
      imageURI = `${baseUrl}/api/ipfs/asset/${imageCID}`;
      metadata.image = imageURI;
    }
    
    // Generar metadatos JSON
    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
    const metadataHash = generateContentHash(metadataBuffer);
    const metadataCID = generateSimulatedCID(metadataHash);
    
    // Almacenar metadata en memoria global
    global.memoryStorage[metadataCID] = {
      type: 'application/json',
      content: new Uint8Array(metadataBuffer),
      uri: `/api/ipfs/asset/${metadataCID}`
    };
    
    // URL pública para la metadata
    const metadataURI = `${baseUrl}/api/ipfs/asset/${metadataCID}`;
    
    console.log('Metadata y assets generados con éxito:', {
      metadataCID,
      metadataURI,
      imageCID
    });
    
    // Construir respuesta similar a la que devolvería pump.fun
    return NextResponse.json({
      success: true,
      metadataUri: metadataURI,
      imageCid: imageCID,
      metadataCid: metadataCID
    });
    
  } catch (error) {
    console.error('Error procesando subida IPFS local:', error);
    return NextResponse.json(
      { error: 'Error procesando la subida', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 