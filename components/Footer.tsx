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

                <a
                    href="https://crestcodecreative.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-[10px] text-zinc-950 hover:text-zinc-950 transition-colors"
                >
                    .
                </a>
            </div>
        </footer>
    );
}
