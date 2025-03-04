"use client"

import { useEffect, useRef } from 'react';

interface TikTokEmbedProps {
  url: string;
}

export default function TikTokEmbed({ url }: TikTokEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Cargar el script de TikTok que convierte los blockquotes en iframes
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
    
    // Aplicar estilos adicionales para asegurar que el iframe se ajuste correctamente
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
        }
      }
    };
    
    // Intentar aplicar estilos múltiples veces para asegurar que se apliquen después de que TikTok termine de cargar
    const styleInterval = setInterval(applyStyles, 500);
    setTimeout(() => clearInterval(styleInterval), 5000); // Limpiar después de 5 segundos
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      clearInterval(styleInterval);
    };
  }, [url]);

  // Extraer el ID del video de la URL
  const getVideoId = (url: string) => {
    const match = url.match(/video\/(\d+)/);
    return match ? match[1] : '';
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
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