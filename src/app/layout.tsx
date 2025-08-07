
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import { TranslationProvider } from '@/context/translation-context';
import { ThemeProvider } from '@/context/theme-provider';
import 'leaflet/dist/leaflet.css';


export const metadata: Metadata = {
  title: 'KisaanConnect',
  description: 'Empowering farmers with technology.',
  icons: {
    icon: '/logo.svg',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "min-h-screen bg-background font-sans")}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TranslationProvider>
                {children}
                <Toaster />
            </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
