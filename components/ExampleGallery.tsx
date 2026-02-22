import React from 'react';

export const ExampleGallery: React.FC = () => {
    return (
        <section className="max-w-6xl mx-auto mt-20 px-6 pb-8" aria-labelledby="example-gallery-title">
            <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 id="example-gallery-title" className="text-2xl font-bold text-zinc-200">
                    Example Outputs
                </h2>
                <p className="text-sm text-zinc-400 mt-2">
                    A few sample styles you can generate. Use them as prompt inspiration, then customize colors, shapes, and details.
                </p>
            </div>
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
                    <div className="p-5">
                        <h3 className="font-semibold text-zinc-200 mb-2">Minimal Checkmark Icon</h3>
                        <p className="text-zinc-400 text-sm">Clean UI icon for check states, confirmations, and action success messages.</p>
                        <p className="text-xs text-zinc-500 font-mono mt-3">icon • ui • minimal</p>
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
                    <div className="p-5">
                        <h3 className="font-semibold text-zinc-200 mb-2">Camera Logo Concept</h3>
                        <p className="text-zinc-400 text-sm">Geometric logo direction for branding concepts, app marks, and social media mockups.</p>
                        <p className="text-xs text-zinc-500 font-mono mt-3">logo • camera • geometric</p>
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
                    <div className="p-5">
                        <h3 className="font-semibold text-zinc-200 mb-2">Mountain Peak Symbol</h3>
                        <p className="text-zinc-400 text-sm">Simple outdoor-style symbol for badges, labels, or brand identity explorations.</p>
                        <p className="text-xs text-zinc-500 font-mono mt-3">nature • abstract • symbol</p>
                    </div>
                </div>

            </div>
        </section>
    );
};
