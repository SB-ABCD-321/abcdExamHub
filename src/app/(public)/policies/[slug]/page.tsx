import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Calendar, ChevronRight, Scale, ShieldCheck,
    CreditCard, AlertCircle, FileText, Headphones, ExternalLink
} from "lucide-react";
import PolicyActions from "./policy-actions";
import PolicyContent from "./policy-content";

export const dynamic = "force-dynamic";

interface PolicyPageProps {
    params: Promise<{ slug: string }>;
}

function getPolicyIcon(title: string) {
    const lower = title.toLowerCase();
    if (lower.includes("privacy")) return <ShieldCheck className="size-4 shrink-0" />;
    if (lower.includes("terms") || lower.includes("condition")) return <Scale className="size-4 shrink-0" />;
    if (lower.includes("refund")) return <CreditCard className="size-4 shrink-0" />;
    if (lower.includes("disclaimer")) return <AlertCircle className="size-4 shrink-0" />;
    return <FileText className="size-4 shrink-0" />;
}

export default async function PolicyPage({ params }: PolicyPageProps) {
    const resolvedParams = await params;
    const rawSlug = decodeURIComponent(resolvedParams.slug);
    const cleanSlug = rawSlug.replace(/^-+|-+$/g, "");

    // 1. Fetch all active policies for navigation + site settings
    const [allPages, settings] = await Promise.all([
        (db as any).dynamicPage
            ? (db as any).dynamicPage.findMany({
                where: { isActive: true },
                select: { id: true, title: true, slug: true, updatedAt: true },
                orderBy: { createdAt: "asc" }
            })
            : [],
        db.siteSetting.findFirst()
    ]);

    // 2. Find matching page (exact match, or clean normalized slug)
    let matchedPage = allPages.find(
        (p: any) => p.slug === rawSlug || p.slug.replace(/^-+|-+$/g, "") === cleanSlug
    );

    // If not found in active list, check DB directly
    if (!matchedPage && (db as any).dynamicPage) {
        matchedPage = await (db as any).dynamicPage.findFirst({
            where: {
                OR: [
                    { slug: rawSlug },
                    { slug: cleanSlug },
                    { slug: `-${cleanSlug}` }
                ],
                isActive: true
            }
        });
    }

    if (!matchedPage) {
        notFound();
    }

    // 3. Fetch full page data if not complete
    const pageData = (db as any).dynamicPage
        ? await (db as any).dynamicPage.findUnique({
            where: { id: matchedPage.id }
        })
        : null;

    if (!pageData || !pageData.isActive) {
        notFound();
    }

    const effectiveDate = pageData.updatedAt
        ? new Date(pageData.updatedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
        : "Current";

    return (
        <div className="flex-1 w-full bg-background transition-colors min-h-screen pt-28 sm:pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-12 gap-8 lg:gap-12">
                {/* Desktop Left Side Navigation & Actions (Static / Sticky) */}
                <aside className="md:col-span-4 lg:col-span-3">
                    <div className="sticky top-28 sm:top-32 space-y-6">
                        {/* Policy Navigation List */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 mb-3">
                                    <span className="w-4 h-[1px] bg-primary/60" /> Platform Policies
                                </h3>
                                <nav className="space-y-1.5">
                                    {allPages.map((navPage: any) => {
                                        const isActive = navPage.id === pageData.id || navPage.slug === pageData.slug;
                                        return (
                                            <Link
                                                key={navPage.id}
                                                href={`/policies/${navPage.slug}`}
                                                className={cn(
                                                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group relative overflow-hidden",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                                )}
                                            >
                                                {getPolicyIcon(navPage.title)}
                                                <span className="truncate">{navPage.title}</span>
                                                {isActive ? (
                                                    <span className="size-1.5 rounded-full bg-primary-foreground ml-auto shrink-0" />
                                                ) : (
                                                    <ChevronRight className="size-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>

                            {/* Left Side Static Action: Download A4 PDF & Share */}
                            <PolicyActions
                                title={pageData.title}
                                content={pageData.content}
                                effectiveDate={effectiveDate}
                                slug={pageData.slug}
                            />
                        </div>

                        {/* Need Clarity Card */}
                        <div className="p-5 rounded-2xl bg-secondary/30 dark:bg-zinc-900/30 border border-border/60 space-y-2.5">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                <Headphones className="size-3.5 text-primary" />
                                Need Clarity?
                            </h4>
                            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                For any questions regarding our legal framework or institutional terms, please reach out to our team.
                            </p>
                            <div className="pt-1">
                                <Link
                                    href="/support"
                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline inline-flex items-center gap-1"
                                >
                                    <span>Support Hub</span>
                                    <ExternalLink className="size-2.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area (Right Column) */}
                <main className="md:col-span-8 lg:col-span-9 space-y-6">
                    {/* Header Area with Title & Date directly aligned with content */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                            <span className="w-8 h-[2px] bg-primary rounded-full" />
                            Institutional Governance
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                            {pageData.title}
                        </h1>

                        <div className="flex items-center gap-6 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                            <span className="flex items-center gap-2">
                                <Calendar className="size-3.5 text-primary" />
                                Effective: <span className="text-foreground">{effectiveDate}</span>
                            </span>
                            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active Version
                            </span>
                        </div>

                        {/* Subtle Horizontal Divider */}
                        <div className="w-full h-[1px] bg-border/60 my-6" />
                    </div>

                    {/* Main Parsed Policy Document Content */}
                    <div className="space-y-6">
                        <PolicyContent
                            content={pageData.content}
                            pageTitle={pageData.title}
                        />
                    </div>

                    {/* Footer Notice */}
                    <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                        <p>
                            © {new Date().getFullYear()} {settings?.siteName || "ABCD Exam Hub"}. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="/" className="hover:text-primary transition-colors">
                                Home
                            </Link>
                            <span>•</span>
                            <Link href="/services" className="hover:text-primary transition-colors">
                                Services
                            </Link>
                            <span>•</span>
                            <Link href="/support" className="hover:text-primary transition-colors">
                                Support
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
