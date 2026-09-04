'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ImageWithFallback({ src, alt, className, fallbackText, ...rest }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`img-fallback ${className || ''}`} aria-hidden="true">
        {fallbackText || ''}
      </div>
    );
  }

  return <Image className={className} src={src} alt={alt} onError={() => setError(true)} {...rest} />;
}