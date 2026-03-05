import React from 'react';

interface AvatarDisplayProps {
  src: string;
  alt?: string;
  className?: string;
}

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ src, alt = '', className = '' }) => {
  const isVideo = src?.startsWith('data:video') || 
                  src?.endsWith('.mp4') || 
                  src?.endsWith('.webm') || 
                  src?.endsWith('.ogg');

  if (isVideo) {
    return (
      <video 
        src={src} 
        className={className} 
        autoPlay 
        loop 
        muted 
        playsInline 
      />
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
    />
  );
};

export default AvatarDisplay;
