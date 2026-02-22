import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { CSPostHogProvider } from './providers';
import { Footer } from '@/components/Footer';
import { ConsentProvider } from '@/components/ConsentProvider';
import { ConsentNotice } from '@/components/ConsentNotice';

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
        <Script id="google-consent-mode-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function(){ dataLayer.push(arguments); };
            window.gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              functionality_storage: 'granted',
              personalization_storage: 'denied',
              security_storage: 'granted',
              wait_for_update: 500
            });
            window.gtag('set', 'ads_data_redaction', true);
            window.gtag('set', 'url_passthrough', true);
          `}
        </Script>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9433983047069695"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-zinc-950 antialiased">
        <ConsentProvider>
          <CSPostHogProvider>
            {children}
            <ConsentNotice />
            <Footer />
          </CSPostHogProvider>
        </ConsentProvider>
      </body>
    </html>
  );
}
