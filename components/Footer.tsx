import Link from 'next/link';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-zinc-800 bg-zinc-950 py-12 px-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-zinc-500 text-sm">
                        © {currentYear} Free SVG For Me. All rights reserved.
                    </div>

                    <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400">
                        <Link href="/" className="hover:text-zinc-200 transition-colors">
                            Home
                        </Link>
                        <Link href="/guides/what-is-svg" className="hover:text-zinc-200 transition-colors">
                            What is SVG?
                        </Link>
                        <Link href="/about" className="hover:text-zinc-200 transition-colors">
                            About
                        </Link>
                        <Link href="/contact" className="hover:text-zinc-200 transition-colors">
                            Contact
                        </Link>
                        <Link href="/privacy" className="hover:text-zinc-200 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-zinc-200 transition-colors">
                            Terms of Service
                        </Link>
                    </nav>
                </div>

                <div className="flex justify-center">
                    <a
                        href="https://crestcodecreative.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                        aria-label="Made with love by Crest Code"
                    >
                        <span>Made with ❤️ by</span>
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 120 138" fill="none" aria-hidden="true">
                            <defs>
                                <linearGradient id="crest-footer-gradient" x1="20" y1="12" x2="100" y2="126" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#184A7D" />
                                    <stop offset="1" stopColor="#4DE0C0" />
                                </linearGradient>
                            </defs>
                            <path d="M60 4 111 34v70l-51 30L9 104V34L60 4Z" fill="url(#crest-footer-gradient)" />
                            <path d="M60 40 25 84a7 7 0 1 0 11 9l24-30 24 30a7 7 0 0 0 11-9L60 40Zm0 30-17 22a7 7 0 1 0 11 9l6-8 6 8a7 7 0 1 0 11-9L60 70Z" fill="#0A1020" />
                        </svg>
                        <span className="underline underline-offset-2">Crest Code</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
