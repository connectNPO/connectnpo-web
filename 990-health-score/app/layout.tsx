import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "990 Health Score — GivingArc",
  description:
    "Free Form 990 health score for nonprofits. Get a 0–100 score, A–F grade, and personalized report.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F5F5F3] text-[#1A2E44]">
        <header className="bg-white border-b border-gray-100 h-16 flex items-center px-6 sticky top-0 z-50">
          <Link href="/" aria-label="GivingArc home" className="flex items-center">
            <Image
              src="/GivingArc-Logo.svg"
              alt="GivingArc"
              width={150}
              height={40}
              priority
            />
          </Link>
          <a
            href="https://givingarc.com"
            className="ml-auto text-sm text-gray-500 hover:text-[#1D9E75]"
          >
            Nonprofit Bookkeeping &amp; 990
          </a>
        </header>

        <div className="flex-1 flex flex-col">{children}</div>

        <footer className="py-8 text-center text-sm text-gray-500">
          <p>
            GivingArc &ndash; Bookkeeping &amp; 990 services for small
            nonprofits.
          </p>
          <p className="mt-1">© 2026 GivingArc. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
