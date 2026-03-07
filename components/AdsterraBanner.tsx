'use client';

import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        atOptions?: Record<string, unknown>;
        __adsterraLoadQueue?: Promise<void>;
    }
}

interface AdsterraBannerProps {
    placementKey?: string;
    width?: number;
    height?: number;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({
    placementKey = '24058389dd413846aff4593c52695b0a',
    width = 300,
    height = 250,
}) => {
    const bannerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = bannerRef.current;
        if (!container) return;
        let cancelled = false;

        // Clean up previous children to avoid duplicate ads on re-renders
        container.innerHTML = '';

        const injectBanner = () =>
            new Promise<void>((resolve) => {
                if (cancelled) {
                    resolve();
                    return;
                }

                window.atOptions = {
                    key: placementKey,
                    format: 'iframe',
                    height,
                    width,
                    params: {},
                };

                const scriptInvoke = document.createElement('script');
                scriptInvoke.type = 'text/javascript';
                scriptInvoke.src = `https://www.highperformanceformat.com/${placementKey}/invoke.js`;
                scriptInvoke.async = false;
                scriptInvoke.onload = () => resolve();
                scriptInvoke.onerror = () => resolve();
                container.appendChild(scriptInvoke);
            });

        // Adsterra's invoke script reads global atOptions. Queue loads so
        // multiple placements on one page don't clobber each other's config.
        window.__adsterraLoadQueue = (window.__adsterraLoadQueue || Promise.resolve())
            .catch(() => undefined)
            .then(() => injectBanner());

        return () => {
            cancelled = true;
            container.innerHTML = '';
        };

    }, [placementKey, width, height]);

    return (
        <div className="flex justify-center w-full my-4">
            <div 
                ref={bannerRef} 
                style={{ width: `${width}px`, height: `${height}px`, background: 'transparent' }} 
            />
        </div>
    );
};
