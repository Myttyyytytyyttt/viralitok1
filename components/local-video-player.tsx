"use client"

import { useRef, useEffect, useState } from 'react';

interface LocalVideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export default function LocalVideoPlayer({ 
  src, 
  autoPlay = true, 
  loop = true, 
  muted = true 
}: LocalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      console.error('Error al cargar el video:', e);
      setIsLoading(false);
      setHasError(true);
    };

    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('error', handleError);

    // Intenta cargar el video
    if (videoElement.readyState >= 3) {
      // El video ya está suficientemente cargado
      setIsLoading(false);
    }

    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
    };
  }, [src]);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#111] p-4 text-center">
        <div>
          <p className="text-red-400 mb-2">Error al cargar el video</p>
          <p className="text-sm text-gray-400">Intenta recargar la página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-8 h-8 border-2 border-[#8A2BE2] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        controls={false}
      >
        <source src={src} type="video/mp4" />
        Tu navegador no soporta videos HTML5.
      </video>
    </div>
  );
} 