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
    
    // Obtener la respuesta como texto para asegurarnos de no modificar nada
    const responseText = await response.text();
    console.log("Respuesta de pump.fun (primeros 150 caracteres):", responseText.substring(0, 150));
    
    // Devolver el texto exacto tal como viene de pump.fun sin ninguna modificación
    return new NextResponse(responseText, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
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