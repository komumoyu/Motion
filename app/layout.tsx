import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers/providers";
import { EdgeStoreProvider } from "@/lib/edgestore";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Motion",
  description: "も、もゆのNotion!?",
  icons: [
    {
      media: "(prefers-color-scheme: light)",
      url: "/favicon.ico",
      href: "/favicon.ico",
    },
    {
      media: "(prefers-color-scheme: dark)",
      url: "/favicon-dark.ico",
      href: "/favicon-dark.ico",
    },
  ],
};

export default function RootLayout({
  children,
}:  {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <EdgeStoreProvider>
          <Providers>
            <Toaster position="bottom-center" />
            {children}
          </Providers>
        </EdgeStoreProvider>
      </body>
    </html>
  );
}
