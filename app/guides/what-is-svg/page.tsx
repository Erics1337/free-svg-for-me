import React from 'react';

export default function WhatIsSvgPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 pt-24 pb-20">
            <div className="max-w-3xl mx-auto px-6">
                <h1 className="text-3xl font-bold mb-8">What is SVG? The Ultimate Guide for Beginners</h1>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8">
                    <section>
                        <p className="text-lg text-zinc-300 leading-relaxed">
                            SVG stands for <strong>Scalable Vector Graphics</strong>. Unlike standard image formats like JPEG or PNG, which are made up of pixels, SVGs are made up of <em>vectors</em>—mathematical descriptions of lines, curves, and shapes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Pixels vs. Vectors: What's the Difference?</h2>
                        <p>
                            Imagine drawing a circle on a grid of graph paper by filling in squares. This is how a <strong>raster image</strong> (like a flexible JPEG) works. If you zoom in close enough, you'll see the individual squares (pixels), and the edges will look jagged.
                        </p>
                        <p className="mt-4">
                            Now imagine describing that same circle with a math formula: <em>"Draw a circle with a radius of 5cm at these coordinates."</em> This is a <strong>vector image</strong>. No matter how much you zoom in or how big you print it, the computer just recalculates the formula, so the lines stay perfectly smooth and crisp.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Why Should You Use SVGs?</h2>
                        <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                            <li><strong>Infinite Scalability:</strong> SVGs look sharp on everything from a smartwatch to a billboard.</li>
                            <li><strong>Small File Size:</strong> Because they are just text code, simple SVGs are often tiny (mere kilobytes) compared to high-res images.</li>
                            <li><strong>Editable Code:</strong> You can open an SVG file in a text editor and change colors or shapes directly in the code.</li>
                            <li><strong>Animation & Interactivity:</strong> You can use CSS and JavaScript to animate individual parts of an SVG, making them perfect for interactive web icons.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">When to Use SVGs</h2>
                        <p>
                            SVGs are perfect for:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                                <h3 className="font-medium text-indigo-400 mb-2">✅ Logos and Icons</h3>
                                <p className="text-sm">Branding assets that need to look sharp at any size.</p>
                            </div>
                            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                                <h3 className="font-medium text-indigo-400 mb-2">✅ Simple Illustrations</h3>
                                <p className="text-sm">Flat illustrations, diagrams, and charts.</p>
                            </div>
                             <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                                <h3 className="font-medium text-pink-400 mb-2">❌ Photographs</h3>
                                <p className="text-sm">Complex photos with thousands of colors are better as JPEGs or WebP.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">How to Use SVGs in Web Development</h2>
                        <p>
                            There are two main ways to use SVGs on a website:
                        </p>
                        <div className="mt-4 space-y-4">
                            <div>
                                <h3 className="font-medium text-white">1. As an Image Source</h3>
                                <code className="block bg-zinc-900 p-3 rounded text-sm font-mono mt-2 text-indigo-300">
                                    &lt;img src="logo.svg" alt="Company Logo" /&gt;
                                </code>
                                <p className="text-sm mt-2 text-zinc-500">Good for simple static images. You can't change colors with CSS this way.</p>
                            </div>
                            <div>
                                <h3 className="font-medium text-white">2. Inline SVG</h3>
                                <code className="block bg-zinc-900 p-3 rounded text-sm font-mono mt-2 text-indigo-300">
                                    &lt;svg viewBox="0 0 100 100"&gt;...&lt;/svg&gt;
                                </code>
                                <p className="text-sm mt-2 text-zinc-500">Paste the SVG code directly into your HTML. This gives you full control to style it with CSS (e.g., changing <code>fill</code> on hover).</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
