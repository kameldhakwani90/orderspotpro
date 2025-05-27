
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Assuming Geist is preferred over Inter
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/context/LanguageContext'; // Added
import { CartProvider } from '@/context/CartContext'; // Added

const geistSans = Geist({ // Renamed from inter to geistSans
  variable: '--font-geist-sans', // Updated variable name
  subsets: ['latin'],
});

const geistMono = Geist_Mono({ // Added Geist Mono
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ConnectHost',
  description: 'Manage your hospitality services with ConnectHost.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <LanguageProvider>
            <CartProvider>
              {children}
              <Toaster />
            </CartProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
