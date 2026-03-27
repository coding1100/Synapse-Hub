import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import Script from 'next/script';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { WorkspaceProvider } from '@/providers/workspace-provider';

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700'],
});

const body = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'SynapseHub',
  description: 'Realtime team collaboration platform',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <Script id="synapsehub-theme-init" strategy="beforeInteractive">
          {`(() => {
            try {
              const stored = localStorage.getItem('synapsehub-theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
              document.documentElement.classList.toggle('dark', theme === 'dark');
              document.documentElement.dataset.theme = theme;
            } catch (_) {}
          })();`}
        </Script>
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>
            <WorkspaceProvider>
              {children}
              <Toaster position="top-right" richColors closeButton />
            </WorkspaceProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
