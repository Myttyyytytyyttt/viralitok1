"use client"

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [opacity, setOpacity] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Fade in
    const fadeInTimeout = setTimeout(() => {
      setOpacity(1);
    }, 100);

    // Fade out after 2 seconds
    const fadeOutTimeout = setTimeout(() => {
      setOpacity(0);
    }, 2000);

    // Remove from DOM after fade out animation completes
    const completionTimeout = setTimeout(() => {
      setShowSplash(false);
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(fadeInTimeout);
      clearTimeout(fadeOutTimeout);
      clearTimeout(completionTimeout);
    };
  }, [onComplete]);

  if (!showSplash) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ 
        backgroundColor: '#090715',
        opacity: opacity,
        transition: 'opacity 2s ease-in-out'
      }}
    >
      <div className="relative w-40 h-40 sm:w-64 sm:h-64 md:w-80 md:h-80">
        <Image
          src="/logo.jpg"
          alt="ViralFun Logo"
          fill
          style={{ objectFit: "contain" }}
          priority
        />
      </div>
    </div>
  );
};

export default SplashScreen; 