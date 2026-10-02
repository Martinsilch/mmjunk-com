import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mmjunk.com'),
  title: {
    default: 'M&M Junk Removal | Top-Rated Hauling & Eco-Sorting',
    template: '%s | M&M Junk Removal'
  },
  description: 'Fast, friendly junk removal & eco-sorting in Federal Way, Auburn, Tacoma & King/Pierce Counties. Same-day service, upfront rates from $125.',
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US">
      <head>
        <link rel="icon" type="image/png" href="/assets/images/favicon.png" />
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937' }}>
        {children}
      </body>
    </html>
  );
}
