import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import GlobalSettingsForm from "./settings-form";
import {
    Building2,
    Zap,
    Layers,
    CreditCard,
    ShieldCheck,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function GlobalSettingsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        select: { role: true }
    });

    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    let settings = await db.siteSetting.findFirst();
    if (!settings) {
        settings = await db.siteSetting.create({ data: { siteName: "ABCD Exam Hub" } });
    }

    const [
        totalWorkspaces,
        activeWorkspaces,
        banners,
        faqs,
        pricingPlans,
        advantages,
        services,
        dynamicPages,
        userGuides
    ] = await Promise.all([
        db.workspace.count(),
        db.workspace.count({ where: { status: "ACTIVE" } }),
        (db as any).banner ? (db as any).banner.findMany({ orderBy: { order: 'asc' } }) : [],
        (db as any).faq ? (db as any).faq.findMany({ orderBy: { order: 'asc' } }) : [],
        (db as any).pricingPlan ? (db as any).pricingPlan.findMany({ orderBy: { order: 'asc' } }) : [],
        (db as any).advantage ? (db as any).advantage.findMany({ orderBy: { order: 'asc' } }) : [],
        (db as any).service ? (db as any).service.findMany({ orderBy: { order: 'asc' } }) : [],
        (db as any).dynamicPage ? (db as any).dynamicPage.findMany({ orderBy: { createdAt: 'asc' } }) : [],
        (db as any).userGuide ? (db as any).userGuide.findMany({ include: { items: { orderBy: { order: 'asc' } } } }) : []
    ]);

    // KPI Metrics calculation (Numeric statistics)
    const activeBannersCount = banners.filter((b: any) => b.isActive).length;
    const activePagesCount = dynamicPages.filter((p: any) => p.isActive).length;
    const cmsAssetsTotal = banners.length + faqs.length + dynamicPages.length + services.length + advantages.length;
    const trialDaysNumber = settings.trialDays ?? 7;
    const plansCount = pricingPlans.length;

    return (
        <DashboardPage>
            {/* Standardized Dashboard Header */}
            <DashboardHeader
                title={<>Global <span className="text-primary font-black">Site Settings</span></>}
                subtitle="Unified platform intelligence, branding telemetry, commercial quota shards, and live CMS deployment."
            />

            {/* HIGH-DENSITY ANALYTICAL NUMERIC KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Workspaces Governed"
                    value={totalWorkspaces}
                    subtitle={`${activeWorkspaces} operational • ${totalWorkspaces - activeWorkspaces} inactive/trial`}
                    icon={<Building2 className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {activeWorkspaces} Online
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Default Trial Days"
                    value={trialDaysNumber}
                    subtitle={`Days trial window • ${settings.trialMaxStudents ?? 50} students cap`}
                    icon={<Zap className="size-4 text-blue-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {settings.trialMaxExams ?? 5} Exams Cap
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="CMS Platform Assets"
                    value={cmsAssetsTotal}
                    subtitle={`${banners.length} banners • ${faqs.length} FAQs • ${dynamicPages.length} policy pages`}
                    icon={<Layers className="size-4 text-purple-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            {activePagesCount} Active Pages
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Commercial Pricing Plans"
                    value={plansCount}
                    subtitle={`${services.length} services • ${settings.isGstEnabled ? `${settings.gstRate ?? 18}% GST` : '0% GST Exempt'}`}
                    icon={<CreditCard className="size-4 text-amber-500" />}
                    badge={
                        <span className={cn(
                            "text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                            settings.isGstEnabled 
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" 
                                : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
                        )}>
                            {settings.isGstEnabled ? `${settings.gstRate ?? 18}% GST` : "Tax Exempt"}
                        </span>
                    }
                />
            </div>

            {/* MAIN FORM */}
            <div className="w-full">
                <GlobalSettingsForm
                    initialSettings={settings}
                    banners={banners}
                    faqs={faqs}
                    pricingPlans={pricingPlans}
                    advantages={advantages}
                    services={services}
                    dynamicPages={dynamicPages}
                    userGuides={userGuides}
                />
            </div>

            {/* SECURITY & CACHE PROTOCOL FOOTER */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 p-5 md:p-6 transition-all">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                Global Configuration & Real-Time Sync Protocol
                                <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Zero Cold-Start
                                </span>
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Modifications to platform branding, trial caps, pricing plans, and policies invalidate Next.js route caches instantly across public, tenant workspace, and administrative boundaries.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-semibold text-[11px] bg-background border px-3 py-1.5 rounded-lg shadow-2xs">
                            <RefreshCw className="size-3 text-emerald-500" />
                            Next.js Edge Revalidation Active
                        </span>
                    </div>
                </div>
            </div>
        </DashboardPage>
    );
}
