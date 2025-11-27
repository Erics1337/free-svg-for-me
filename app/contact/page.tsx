import React from 'react';

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 pt-24 pb-20">
            <div className="max-w-3xl mx-auto px-6">
                <h1 className="text-3xl font-bold mb-8">Contact Us</h1>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8">
                    <p className="text-lg text-zinc-300">
                        We'd love to hear from you! Whether you have a question about features, pricing, need a demo, or anything else, our team is ready to answer all your questions.
                    </p>

                    <section className="bg-zinc-900/50 p-8 rounded-lg border border-zinc-800">
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Get in Touch</h2>
                        <p className="mb-4">
                            For general inquiries, support, or feedback, please email us at:
                        </p>
                        <a
                            href="mailto:support@freesvgforme.com"
                            className="text-indigo-400 hover:text-indigo-300 text-lg font-medium"
                        >
                            support@freesvgforme.com
                        </a>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Response Time</h2>
                        <p>
                            We try to respond to all inquiries within 24-48 hours. Please note that our support team operates during standard business hours (PST).
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
