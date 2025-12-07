import React from 'react';

export const ExampleGallery: React.FC = () => {
    return (
        <section className="max-w-6xl mx-auto mt-24 px-6 pb-12">
            <h2 className="text-2xl font-bold text-zinc-200 mb-8 text-center">Recent AI Generated Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Example 1 */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-colors group">
                    <div className="aspect-square bg-zinc-950 flex items-center justify-center p-8 relative">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                        <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-400 drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path d="M30 50 L50 70 L70 30" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div className="p-6">
                        <h3 className="font-semibold text-zinc-200 mb-2">Minimal Checkmark Icon</h3>
                        <p className="text-zinc-400 text-sm mb-4">A clean, scalable checkmark icon perfect for validation states and UI confirmations.</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300 font-mono">icon</span>
                            <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300 font-mono">ui</span>
                            <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300 font-mono">minimal</span>
                        </div>
                    </div>
                </div>

                {/* Example 2 */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-pink-500/50 transition-colors group">
                    <div className="aspect-square bg-zinc-950 flex items-center justify-center p-8 relative">
                         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                        <svg viewBox="0 0 100 100" className="w-full h-full text-pink-400 drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg">
                            <rect x="20" y="20" width="60" height="60" rx="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <circle cx="70" cy="30" r="3" fill="currentColor"/>
                        </svg>
                    </div>
                    <div className="p-6">
                        <h3 className="font-semibold text-zinc-200 mb-2">Camera Logo Concept</h3>
                        <p className="text-zinc-400 text-sm mb-4">Modern geometric camera logo inspired by popular social media app icons.</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300 font-mono">logo</span>
                            <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300 font-mono">camera</span>
                            <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300 font-mono">geometric</span>
                        </div>
                    </div>
                </div>

                {/* Example 3 */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors group">
                    <div className="aspect-square bg-zinc-950 flex items-center justify-center p-8 relative">
                         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                        <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-400 drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 10 L90 90 L10 90 Z" stroke="currentColor" strokeWidth="4" fill="none" strokeLinejoin="round"/>
                            <path d="M50 30 L50 70" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
                            <path d="M50 70 L70 70" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <div className="p-6">
                        <h3 className="font-semibold text-zinc-200 mb-2">Mountain Peak Symbol</h3>
                        <p className="text-zinc-400 text-sm mb-4">Abstract representation of a mountain peak, suitable for outdoor brands.</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300 font-mono">nature</span>
                            <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300 font-mono">abstract</span>
                            <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300 font-mono">symbol</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};
