import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "@fontsource/plus-jakarta-sans"; // Default weights
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import GlobalFloaters from "@/components/shared/GlobalFloaters";
import { db } from "@/lib/prisma";
import { cache } from "react";
import "./globals.css";

const getSettings = cache(async () => {
  return await db.siteSetting.findFirst();
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    title: settings?.siteName || "Super Admin Platform | abcdExamHub",
    description: settings?.siteDescription || "Next-generation SaaS platform for institutional exam management and AI-powered assessments.",
    icons: {
      icon: settings?.faviconUrl || "/favicon.ico",
      shortcut: settings?.faviconUrl || "/favicon.ico",
      apple: settings?.faviconUrl || "/favicon.ico",
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistMono.variable} font-sans antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <GlobalFloaters />
          </ThemeProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
