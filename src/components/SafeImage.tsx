import { useState } from 'react';
import { Coffee } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#2B1D15] via-[#1C1410] to-[#120D0A] text-[#C6934B] p-6 text-center ${className}`}
      >
        <Coffee className="w-8 h-8 mb-2 opacity-80" strokeWidth={1.5} />
        <span className="font-display text-sm tracking-wide text-[#FAF7F2]/80 line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
