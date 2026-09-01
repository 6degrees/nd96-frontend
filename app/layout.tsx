import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/shared/ui/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saudi National Day 96',
  description: 'SATORP — Message to the Nation & Kings and Energy Journey',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // suppress pinch zoom on kiosks
  viewportFit: 'cover', // booth uses env(safe-area-inset-*)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Arabic-first: runtime language switching updates these via the i18n store.
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
