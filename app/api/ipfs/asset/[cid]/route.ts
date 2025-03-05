import { NextRequest, NextResponse } from 'next/server';

// Acceder al almacenamiento en memoria compartido con la API de IPFS
// Esto funciona porque Node.js mantiene las variables globales entre solicitudes
// en el mismo proceso
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

export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  const cid = params.cid;
  
  console.log(`Solicitando asset con CID: ${cid}`);
  
  // Verificar si el asset existe en memoria
  if (!global.memoryStorage || !global.memoryStorage[cid]) {
    console.error(`Asset con CID ${cid} no encontrado en memoria`);
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
  
  const asset = global.memoryStorage[cid];
  
  // Crear una respuesta con el tipo MIME adecuado
  const response = new NextResponse(asset.content, {
    headers: {
      'Content-Type': asset.type,
      'Cache-Control': 'public, max-age=31536000', // Cachear por 1 año
    },
  });
  
  return response;
} 