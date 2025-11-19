"use client";

import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  client: string; // Your AdSense Publisher ID (e.g., ca-pub-XXXXXXXXXXXXXXXX)
  slot: string;   // The specific Ad Slot ID from the AdSense dashboard
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const AdUnit: React.FC<AdUnitProps> = ({
  client,
  slot,
  format = 'auto',
  responsive = true,
  className = ''
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // Prevent double-loading in React Strict Mode or on re-renders
    if (adRef.current && !isLoaded.current) {
      try {
        // Check if the ad is already populated (prevent duplicates)
        if (adRef.current.innerHTML === '') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isLoaded.current = true;
        }
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, []);

  // Don't render anything if no client ID is provided (development mode)
  if (!client || client === 'YOUR_ADSENSE_CLIENT_ID') {
    return (
      <div className={`bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center text-zinc-500 text-sm ${className}`}>
        <p>AdSense Placeholder</p>
        <p className="text-xs opacity-70">Configure client ID to view ads</p>
      </div>
    );
  }

  return (
    <div className={`ad-container overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};
