import React from 'react';
import Link from 'next/link';

export const SEOContent: React.FC = () => {
    return (
        <section className="max-w-4xl mx-auto mt-14 px-6 pb-20 text-zinc-300" aria-labelledby="home-help-title">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/35 p-6 md:p-7 space-y-6">
                <div>
                    <h2 id="home-help-title" className="text-xl md:text-2xl font-bold text-zinc-100 mb-2">
                        About this tool
                    </h2>
                    <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
                        FreeSVGForMe generates editable SVG code from a text prompt. It works best for icons, symbols, simple logos, and lightweight vector illustrations.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                        <h3 className="font-semibold text-zinc-100 mb-2">How to use it</h3>
                        <ol className="text-sm text-zinc-400 list-decimal pl-4 space-y-1 marker:text-indigo-400">
                            <li>Enter a clear prompt with shape/style details.</li>
                            <li>Generate and preview the SVG result.</li>
                            <li>Download or edit the code for your project.</li>
                        </ol>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                        <h3 className="font-semibold text-zinc-100 mb-2">Quick notes</h3>
                        <ul className="text-sm text-zinc-400 list-disc pl-4 space-y-1 marker:text-indigo-400">
                            <li>No signup required.</li>
                            <li>More specific prompts usually work better.</li>
                            <li>Review outputs before production use.</li>
                        </ul>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
                    <h3 className="font-semibold text-zinc-100 mb-2">Help & policies</h3>
                    <p className="text-sm text-zinc-400 mb-3">
                        Learn the basics of SVG and review site policies.
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm">
                        <Link href="/guides/what-is-svg" className="px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
                            SVG Guide
                        </Link>
                        <Link href="/about" className="px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
                            About
                        </Link>
                        <Link href="/contact" className="px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
                            Contact
                        </Link>
                        <Link href="/privacy" className="px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
                            Terms
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};
