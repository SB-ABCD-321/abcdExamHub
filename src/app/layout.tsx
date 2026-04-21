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
  const timestamp = settings?.updatedAt ? new Date(settings.updatedAt).getTime() : Date.now();
  const favicon = (settings?.faviconUrl || "/abcdExamHub/branding/favicon.png") + `?v=${timestamp}`;

  return {
    title: settings?.siteName || "Super Admin Platform | abcdExamHub",
    description: settings?.siteDescription || "Next-generation SaaS platform for institutional exam management and AI-powered assessments.",
    keywords: ["exam management", "assessment platform", "online exams", "education tech", settings?.siteName || ""],
    authors: [{ name: settings?.siteName || "ExamHub" }],
    robots: "index, follow",
    openGraph: {
      title: settings?.siteName || "Super Admin Platform | abcdExamHub",
      description: settings?.siteDescription || "Next-generation SaaS platform for institutional exam management.",
      url: "https://abcdexamhub.com",
      siteName: settings?.siteName || "abcdExamHub",
      images: [
        {
          url: settings?.logoUrl || favicon,
          width: 800,
          height: 600,
          alt: "Platform Logo",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: settings?.siteName || "Super Admin Platform | abcdExamHub",
      description: settings?.siteDescription || "Next-generation SaaS platform for institutional exam management.",
      images: [settings?.logoUrl || favicon],
    },
    icons: {
      icon: [
        { url: favicon, sizes: '32x32', type: 'image/png' },
        { url: favicon, sizes: '16x16', type: 'image/png' },
      ],
      shortcut: favicon,
      apple: settings?.logoUrl || favicon,
    },
    manifest: '/manifest.webmanifest'
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
            <GlobalFloaterWrapper />
          </ThemeProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
async function GlobalFloaterWrapper() {
  const settings = await getSettings();
  return <GlobalFloaters whatsappNo={settings?.whatsappNo} />;
}
