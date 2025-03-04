"use client"

import { useEffect, useRef, useState } from 'react';

// Extendemos la interfaz Window para incluir la propiedad tiktok
declare global {
  interface Window {
    tiktok?: {
      embed: {
        reload: () => void;
      };
    };
  }
}

interface TikTokEmbedProps {
  url: string;
}

export default function TikTokEmbed({ url }: TikTokEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scriptLoadedRef = useRef(false);
  
  useEffect(() => {
    // Reset estados
    setHasError(false);
    setIsLoading(true);
    
    // Verificar si el URL es válido
    if (!url || !url.includes('tiktok.com')) {
      console.error('URL inválido de TikTok:', url);
      setHasError(true);
      setIsLoading(false);
      return;
    }
    
    // Función para cargar el script de TikTok
    const loadTikTokScript = () => {
      // Verificar si ya existe el script en el documento
      if (document.querySelector('script[src="https://www.tiktok.com/embed.js"]')) {
        scriptLoadedRef.current = true;
        return Promise.resolve();
      }
      
      return new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        script.onload = () => {
          scriptLoadedRef.current = true;
          resolve();
        };
        script.onerror = () => {
          console.error('Error al cargar el script de TikTok Embed');
          setHasError(true);
          setIsLoading(false);
          resolve();
        };
        document.body.appendChild(script);
      });
    };
    
    // Aplicar estilos al iframe
    const applyStyles = () => {
      if (containerRef.current) {
        const iframe = containerRef.current.querySelector('iframe');
        if (iframe) {
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          iframe.style.position = 'absolute';
          iframe.style.top = '0';
          iframe.style.left = '0';
          
          // Marcar como cargado cuando el iframe esté listo
          setIsLoading(false);
          
          // Monitorear cambios en el iframe para detectar errores de carga
          const checkContent = () => {
            try {
              // Si el iframe tiene contenido, no hay error
              if (iframe.contentWindow && iframe.contentWindow.document.body.innerHTML) {
                return;
              }
            } catch (e) {
              // Error de seguridad cross-origin es normal, no hacer nada
            }
          };
          
          checkContent();
          return true;
        }
      }
      return false;
    };
    
    // Intentar cargar el script y aplicar estilos
    loadTikTokScript().then(() => {
      // Si el script ya estaba cargado, debemos manualmente disparar window.tiktok.embed.reload()
      if (window.tiktok && window.tiktok.embed) {
        try {
          window.tiktok.embed.reload();
        } catch (e) {
          console.warn('Error al recargar embed de TikTok:', e);
        }
      }
      
      // Intenta aplicar estilos múltiples veces
      let attempts = 0;
      const maxAttempts = 20; // 10 segundos máximo (20 * 500ms)
      
      const styleInterval = setInterval(() => {
        const success = applyStyles();
        attempts++;
        
        // Detener intentos después de aplicar estilos con éxito o alcanzar máximo de intentos
        if (success || attempts >= maxAttempts) {
          clearInterval(styleInterval);
          // Si después de todos los intentos no se pudo cargar, mostrar error
          if (!success && attempts >= maxAttempts) {
            console.warn(`No se pudo cargar el TikTok después de ${attempts} intentos`);
            setHasError(true);
            setIsLoading(false);
          }
        }
      }, 500);
      
      return () => clearInterval(styleInterval);
    });
    
    // Limpieza
    return () => {
      // No eliminamos el script para evitar recargas innecesarias
    };
  }, [url]);

  // Extraer el ID del video de la URL
  const getVideoId = (url: string) => {
    try {
      const match = url.match(/video\/(\d+)/);
      return match ? match[1] : '';
    } catch (e) {
      console.error('Error al extraer ID de TikTok:', e);
      return '';
    }
  };

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#111] p-4 text-center">
        <div>
          <p className="text-red-400 mb-2">Error al cargar el TikTok</p>
          <p className="text-sm text-gray-400">Intenta recargar la página</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-8 h-8 border-2 border-[#8A2BE2] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="relative w-full h-full">
        <blockquote 
          className="tiktok-embed" 
          cite={url} 
          data-video-id={getVideoId(url)}
          style={{ 
            maxWidth: '100%', 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%'
          }}>
          <section></section>
        </blockquote>
      </div>
    </div>
  );
} 