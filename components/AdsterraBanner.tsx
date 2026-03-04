'use client';

import React, { useEffect, useRef } from 'react';

export const AdsterraBanner: React.FC = () => {
    const bannerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!bannerRef.current) return;

        // Clean up previous children to avoid duplicate ads on re-renders
        bannerRef.current.innerHTML = '';

        const scriptOptions = document.createElement('script');
        scriptOptions.type = 'text/javascript';
        scriptOptions.text = `
            atOptions = {
                'key' : '24058389dd413846aff4593c52695b0a',
                'format' : 'iframe',
                'height' : 250,
                'width' : 300,
                'params' : {}
            };
        `;

        const scriptInvoke = document.createElement('script');
        scriptInvoke.type = 'text/javascript';
        scriptInvoke.src = 'https://www.highperformanceformat.com/24058389dd413846aff4593c52695b0a/invoke.js';
        scriptInvoke.async = true;

        bannerRef.current.appendChild(scriptOptions);
        bannerRef.current.appendChild(scriptInvoke);

    }, []);

    return (
        <div className="flex justify-center w-full my-4">
            <div 
                ref={bannerRef} 
                style={{ width: '300px', height: '250px', background: 'transparent' }} 
            />
        </div>
    );
};
