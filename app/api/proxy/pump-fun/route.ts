import { NextRequest, NextResponse } from 'next/server';

// Este endpoint actúa como proxy para pump.fun para evitar problemas de CORS
export async function POST(request: NextRequest) {
  console.log("Proxy para pump.fun solicitado");
  
  try {
    // Obtener el body de la solicitud
    const formData = await request.formData();
    
    // Reenviar la solicitud a pump.fun
    console.log("Enviando datos a pump.fun desde el servidor");
    const response = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      body: formData,
    });
    
    console.log("Respuesta de pump.fun recibida:", response.status);
    
    // Si hay un error, devolver la respuesta tal cual
    if (!response.ok) {
      console.error("Error en respuesta de pump.fun:", response.status);
      return new NextResponse(await response.text(), {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'text/plain',
        },
      });
    }
    
    // Obtener la respuesta y devolverla al cliente
    const responseData = await response.text();
    console.log("Datos recibidos de pump.fun:", responseData.substring(0, 100) + "...");
    
    return new NextResponse(responseData, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error("Error en proxy de pump.fun:", error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 