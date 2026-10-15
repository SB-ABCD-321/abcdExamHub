import { ClerkProvider } from "@clerk/nextjs";
import { getPublicNavData } from "@/lib/cached-data";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NotFoundContent from "@/components/layout/NotFoundContent";

export default async function NotFound() {
    const { settings, navbarItems, dynamicPages } = await getPublicNavData();
    const siteName = settings?.siteName || "ABCD Exam Hub";
    const logoUrl = settings?.logoUrl || undefined;

    return (
        <ClerkProvider>
            <div className="flex min-h-screen flex-col bg-background selection:bg-amber-500/25">
            {/* Actual Global Site Navbar */}
            <Navbar
                siteName={siteName}
                logoUrl={logoUrl}
                navbarItems={navbarItems.map((item: any) => ({ label: item.label, href: item.href }))}
            />

            {/* Central 404 Experience - Full 100vh fold with centered content */}
            <main className="min-h-[100dvh] flex items-center justify-center pt-24 pb-12 px-4 relative overflow-hidden">
                {/* Ambient Background Glow Orbs & Grid */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] sm:w-[44rem] h-[36rem] sm:h-[44rem] bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-[130px] animate-pulse" />
                    <div className="absolute top-1/3 -left-20 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-[120px]" />
                    
                    {/* Modern subtle grid pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-45 dark:opacity-30 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,#000_65%,transparent_100%)]" />
                </div>

                <NotFoundContent />
            </main>

            {/* Actual Global Site Footer */}
            <Footer
                siteName={siteName}
                logoUrl={logoUrl}
                footerDescription={settings?.footerDescription || settings?.footerText || undefined}
                contactInfo={{
                    email: settings?.email || undefined,
                    phone: settings?.mobileNo || undefined,
                    whatsapp: settings?.whatsappNo || undefined,
                    address: settings?.location || undefined,
                }}
                socialLinks={{
                    facebook: settings?.facebookUrl || undefined,
                    twitter: settings?.twitterUrl || undefined,
                    linkedin: settings?.linkedinUrl || undefined,
                    instagram: settings?.instagramUrl || undefined,
                    youtube: settings?.youtubeUrl || undefined,
                    github: settings?.githubUrl || undefined,
                    tiktok: settings?.tiktokUrl || undefined,
                    threads: settings?.threadsUrl || undefined,
                }}
                navbarItems={navbarItems.map((item: any) => ({ label: item.label, href: item.href }))}
                dynamicPages={dynamicPages}
            />
        </div>
        </ClerkProvider>
    );
}
