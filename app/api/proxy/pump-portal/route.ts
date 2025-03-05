import { NextRequest, NextResponse } from 'next/server';

// Este endpoint actúa como proxy para pumpportal.fun para evitar problemas de CORS
export async function POST(request: NextRequest) {
  console.log("Proxy para pumpportal.fun solicitado");
  
  try {
    // Obtener el body de la solicitud como JSON
    const body = await request.json();
    
    // Reenviar la solicitud a pumpportal.fun
    console.log("Enviando datos a pumpportal.fun desde el servidor", body);
    const response = await fetch("https://pumpportal.fun/api/trade-local", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    console.log("Respuesta de pumpportal.fun recibida:", response.status);
    
    // Para las transacciones, necesitamos devolver el arrayBuffer directamente
    const arrayBuffer = await response.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      status: response.status,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error("Error en proxy de pumpportal.fun:", error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 