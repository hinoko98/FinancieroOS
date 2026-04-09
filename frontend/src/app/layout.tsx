import type { Metadata } from 'next';
import { IBM_Plex_Mono, Manrope } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { QueryProvider } from '@/lib/query/query-provider';
import { SettingsProvider } from '@/lib/settings/settings-provider';
import './globals.css';

const manrope = Manrope({
  variable: '--font-sans',
  subsets: ['latin'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Control Financiero',
  description: 'Panel web para control financiero integral y operativo',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${manrope.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] antialiased">
        <QueryProvider>
          <AuthProvider>
            <SettingsProvider>{children}</SettingsProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
