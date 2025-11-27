import React from 'react';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 pt-24 pb-20">
            <div className="max-w-3xl mx-auto px-6">
                <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8">
                    <p className="text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">1. Introduction</h2>
                        <p>
                            Welcome to Free SVG For Me. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you as to how we look after your personal data when you visit our website
                            and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">2. Data We Collect</h2>
                        <p>
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-2 text-zinc-400">
                            <li><strong>Usage Data:</strong> We use PostHog to analyze how users interact with our website to improve the user experience. This may include pages visited, time spent, and other interaction data.</li>
                            <li><strong>Technical Data:</strong> Internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">3. How We Use Your Data</h2>
                        <p>
                            We will only use your personal data when the law allows us to. Most commonly, we use your personal data in the following circumstances:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-2 text-zinc-400">
                            <li>To provide and improve our service.</li>
                            <li>To analyze usage trends and preferences.</li>
                            <li>To display advertisements via Google AdSense.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">4. Cookies and Tracking Technologies</h2>
                        <p>
                            We use cookies and similar tracking technologies to track the activity on our service and hold certain information.
                            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                        </p>
                        <p className="mt-2">
                            <strong>Google AdSense:</strong> We use Google AdSense to display ads. Google uses cookies to serve ads based on your prior visits to our website or other websites.
                            Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our sites and/or other sites on the Internet.
                            You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-indigo-400 hover:text-indigo-300" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">5. Third-Party Links</h2>
                        <p>
                            This website may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you.
                            We do not control these third-party websites and are not responsible for their privacy statements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-zinc-200">6. Contact Us</h2>
                        <p>
                            If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:support@freesvgforme.com" className="text-indigo-400 hover:text-indigo-300">support@freesvgforme.com</a>
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
