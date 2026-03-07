'use client';

import React, { useEffect, useRef } from 'react';

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
        if (!bannerRef.current) return;

        // Clean up previous children to avoid duplicate ads on re-renders
        bannerRef.current.innerHTML = '';

        const scriptOptions = document.createElement('script');
        scriptOptions.type = 'text/javascript';
        scriptOptions.text = `
            atOptions = {
                'key' : '${placementKey}',
                'format' : 'iframe',
                'height' : ${height},
                'width' : ${width},
                'params' : {}
            };
        `;

        const scriptInvoke = document.createElement('script');
        scriptInvoke.type = 'text/javascript';
        scriptInvoke.src = `https://www.highperformanceformat.com/${placementKey}/invoke.js`;
        scriptInvoke.async = true;

        bannerRef.current.appendChild(scriptOptions);
        bannerRef.current.appendChild(scriptInvoke);

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
