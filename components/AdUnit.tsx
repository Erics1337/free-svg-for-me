'use client';

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdUnitProps {
  slot: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  className?: string; // Allow custom classes for wrapper
  layout?: string; // For in-article ads sometimes needed
}

export const AdUnit: React.FC<AdUnitProps> = ({
  slot,
  style = { display: 'block' },
  format = 'auto',
  responsive = true,
  className = '',
  layout
}) => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  // Development placeholder
  if (process.env.NODE_ENV === 'development') {
    return (
      <div 
        className={`bg-zinc-800/50 border border-zinc-700/50 rounded-lg flex items-center justify-center text-zinc-500 text-sm ${className}`}
        style={{ ...style, minHeight: '100px', width: '100%' }}
      >
        <div className="text-center p-4">
          <p className="font-mono text-xs mb-1">AD UNIT PLACEHOLDER</p>
          <p className="text-xs opacity-70">Slot: {slot}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-9433983047069695"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(layout ? { 'data-ad-layout': layout } : {})}
      />
    </div>
  );
};
