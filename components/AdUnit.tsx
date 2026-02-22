'use client';

import React, { useEffect, useRef } from 'react';
import { useConsent } from '@/components/ConsentProvider';

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
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
  style = { display: 'block', width: '100%' },
  format = 'auto',
  responsive = true,
  className = '',
  layout
}) => {
  const { hydrated, hasSavedConsent, preferences, consentVersion } = useConsent();
  const lastRenderedKeyRef = useRef<string | null>(null);
  const adRenderKey = `${slot}:${consentVersion}`;

  useEffect(() => {
    if (!hydrated || !hasSavedConsent) {
      return;
    }

    if (lastRenderedKeyRef.current === adRenderKey) {
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.requestNonPersonalizedAds = preferences.ads ? 0 : 1;
        window.adsbygoogle.push({});
        lastRenderedKeyRef.current = adRenderKey;
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [adRenderKey, hasSavedConsent, hydrated, preferences.ads]);

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
    <div className={`ad-container ${className}`} style={{ width: '100%' }}>
      {hydrated && hasSavedConsent ? (
        <ins
          key={adRenderKey}
          className="adsbygoogle"
          style={{ ...style, display: 'block', width: '100%' }}
          data-ad-client="ca-pub-9433983047069695"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
          {...(layout ? { 'data-ad-layout': layout } : {})}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{ ...style, display: 'block', width: '100%', minHeight: (style?.height as string) || '100px' }}
        />
      )}
    </div>
  );
};
