import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { NavClient } from "../components/ui/NavClient";

export const metadata: Metadata = {
  title: "RecoveryOS | Razorpay",
  description: "Agentic Collections System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen flex flex-col transition-colors duration-500`}>
        <NavClient />
        <main className="flex-1 pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
