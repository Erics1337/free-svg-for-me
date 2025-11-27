import React from 'react';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 pt-24 pb-20">
            <div className="max-w-3xl mx-auto px-6">
                <h1 className="text-3xl font-bold mb-8">About Free SVG For Me</h1>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8">
                    <section>
                        <p className="text-lg text-zinc-300 leading-relaxed">
                            Free SVG For Me is an AI-powered tool designed to democratize access to high-quality vector graphics.
                            We believe that everyone, regardless of their design skills, should be able to create beautiful, scalable icons and illustrations for their projects.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Our Mission</h2>
                        <p>
                            Our mission is simple: to provide a free, accessible, and powerful tool for generating SVG assets instantly.
                            Whether you are a developer building a new app, a designer looking for inspiration, or a content creator needing a quick graphic,
                            we are here to help you bring your ideas to life.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">How It Works</h2>
                        <p>
                            We leverage cutting-edge Large Language Models (LLMs) that have been trained on vast amounts of code and design patterns.
                            When you describe an image, our AI interprets your request and writes the SVG code from scratch, ensuring a unique and scalable result every time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Why Free?</h2>
                        <p>
                            We believe in the open web. By offering this tool for free, supported by non-intrusive advertising, we can help more creators build amazing things without the barrier of expensive subscriptions or complicated software.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
