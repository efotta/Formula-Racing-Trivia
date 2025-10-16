
import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/providers';
import PWAInstaller from '@/components/pwa-installer';
import PWAUpdateNotification from '@/components/pwa-update-notification';

export const metadata: Metadata = {
  title: 'Formula Racing Trivia',
  description: 'Test your Formula 1 knowledge with challenging trivia questions across multiple levels',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Formula Racing Trivia',
  },
  icons: {
    icon: [
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  other: {
    'msapplication-TileColor': '#4338ca',
    'msapplication-TileImage': '/icon-144x144.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
  viewportFit: 'cover' as const,
  themeColor: '#4338ca',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <PWAInstaller />
          <PWAUpdateNotification />
        </Providers>
      </body>
    </html>
  );
}
