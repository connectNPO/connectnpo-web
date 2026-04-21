import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'Financial Dashboard — GivingArc',
  description: 'Board-ready financial dashboard for nonprofits',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-[#f8f8f6] text-black font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
