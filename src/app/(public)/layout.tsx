import { db } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { PwaPrompt } from "@/components/shared/PwaPrompt";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await db.siteSetting.findFirst();
    const siteName = settings?.siteName || "ABCD Exam Hub";
    const logoUrl = settings?.logoUrl || undefined;

    const navbarItems = (db as any).navbarItem ? await (db as any).navbarItem.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
    }) : [];

    const dynamicPages = (db as any).dynamicPage ? await (db as any).dynamicPage.findMany({
        where: { isActive: true },
        select: { title: true, slug: true }
    }) : [];

    return (
        <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
            <Navbar
                siteName={siteName}
                logoUrl={logoUrl}
                navbarItems={navbarItems.map((item: any) => ({ label: item.label, href: item.href }))}
            />
            <main className="flex-1">
                {children}
            </main>
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
            <PwaPrompt siteName={siteName} logoUrl={logoUrl} />
        </div>
    );
}
