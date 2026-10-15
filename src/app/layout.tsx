import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import GlobalFloaters from "@/components/shared/GlobalFloaters";
import { getSiteSettings } from "@/lib/cached-data";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
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
        <head>
          {/* Resource Hints for faster 3rd-party connections */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://api.clerk.com" />
          <link rel="dns-prefetch" href="https://img.clerk.com" />
        </head>
        <body
          className={`${plusJakartaSans.variable} ${geistMono.variable} font-sans antialiased`}
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
  const settings = await getSiteSettings();
  return <GlobalFloaters whatsappNo={settings?.whatsappNo} />;
}
