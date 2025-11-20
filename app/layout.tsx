import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free SVG For Me | AI Vector Art & Icon Generator",
  description: "Generate high-quality, royalty-free SVGs, vector art, and icons instantly using AI. Just describe what you need and get a custom SVG for your project.",
  keywords: "free svg generator, ai svg, text to vector, custom icons, free vector art, svg creator, royalty free svg",
  metadataBase: new URL('https://www.freesvgforme.com'),
  openGraph: {
    type: "website",
    url: "https://www.freesvgforme.com/",
    title: "Free SVG For Me | AI Vector Art Generator",
    description: "Create stunning, custom SVGs from text descriptions in seconds. Free, no signup required.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free SVG For Me | AI Vector Art Generator",
    description: "Create stunning, custom SVGs from text descriptions in seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9433983047069695"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} bg-zinc-950 antialiased`}>
        {children}
      </body>
    </html>
  );
}
