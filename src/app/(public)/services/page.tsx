import { LucideIcon, Zap, ShieldCheck, BarChart3, Bot, Globe, ArrowRight } from "lucide-react";
import { getIconByName } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TypingText from "@/components/shared/TypingText";
import SectionHeader from "@/components/shared/SectionHeader";
import Link from "next/link";
import { db } from "@/lib/prisma";

// ICON_MAP removed - now in src/lib/icons.ts

const DEFAULT_SERVICES = [
    {
        iconName: "Building2",
        title: "Portal Administrator",
        iconColor: "bg-zinc-950",
        description: "Architect the future of your institution. Manage global settings, multi-tenant workspaces, and cross-platform security protocols from a single command center.",
        features: [
            "Workspace Provisioning",
            "Identity Management",
            "Financial Transparency",
            "Platform Configuration"
        ]
    },
    {
        iconName: "Users",
        title: "Exam Faculty",
        iconColor: "bg-primary",
        isPrimary: true,
        description: "The operational core of assessment accuracy. Leverage AI to design challenging topics, manage deep question banks, and proctor live missions.",
        features: [
            "Gemini AI Generation",
            "Proctoring Intelligence",
            "Psychometric Analytics",
            "Topic Clusters"
        ]
    },
    {
        iconName: "Rocket",
        title: "Student Cohort",
        iconColor: "bg-zinc-950",
        description: "Focus-driven examination environments. Students execute their missions with distraction-free interfaces optimized for any device globally.",
        features: [
            "Anti-Focus Shifting",
            "Real-time Dashboard",
            "Magic Login Links",
            "Instant Feedback"
        ]
    }
];

interface ServiceItem {
    id?: string;
    iconName: string;
    title: string;
    iconColor: string | null;
    isPrimary: boolean;
    description: string;
    features: string[];
}

export default async function ServicesPage() {
    const [settings, dbServices] = await Promise.all([
        db.siteSetting.findFirst(),
        db.service.findMany({
            orderBy: { order: 'asc' }
        })
    ]);

    const displayServices: ServiceItem[] = dbServices.length > 0 
        ? (dbServices as unknown as ServiceItem[]) 
        : (DEFAULT_SERVICES as ServiceItem[]);

    const heroTitle = settings?.servicesHeroTitle || "Next-Gen Online";
    const heroSubtitle = settings?.servicesHeroSubtitle || "Manage exams effortlessly with automated question generation, secure proctoring, and instant results.";
    const typingTexts = Array.isArray(settings?.servicesTypingTexts)
        ? (settings?.servicesTypingTexts as string[])
        : ["Exam Solution", "Question Making", "AI Using"];

    return (
        <div className="pt-32">
            {/* Hero Section */}
            <section className="relative py-24 px-6 overflow-hidden bg-background">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full -mr-32 -mt-32" />

                <div className="container mx-auto max-w-7xl relative z-10 text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-4">
                        <Zap className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            {settings?.servicesBadge || "Our Capabilities"}
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-[1] max-w-5xl mx-auto text-zinc-950 dark:text-white">
                        <TypingText
                            text={heroTitle}
                            className="block mb-4"
                            delay={200}
                            cursor={false}
                        />
                        <TypingText
                            texts={typingTexts}
                            className="text-primary italic"
                            speed={100}
                            eraseSpeed={100}
                            pauseDelay={2000}
                            cursor={false}
                        />
                    </h1>

                    <p className="text-xl text-muted-foreground font-medium italic max-w-3xl mx-auto leading-relaxed border-l-2 border-primary/50 pl-6 py-2">
                        {heroSubtitle}
                    </p>
                </div>
            </section>

            {/* The Flow Section */}
            <section className="py-32 bg-zinc-50 dark:bg-zinc-900/40 relative">
                <div className="container mx-auto px-6 max-w-7xl">
                    <SectionHeader
                        badge={settings?.unifiedBadge || "THE UNIFIED ECOSYSTEM"}
                        title="Seamless Role Integration"
                        description="Experience absolute synchronicity between administration, faculty, and student cohorts."
                    />

                    <div className="grid md:grid-cols-3 gap-8 relative pb-12">
                        {displayServices.map((service, index) => {
                            const Icon = getIconByName(service.iconName);

                            return (
                                <FlowCard
                                    key={service.id || index}
                                    icon={<Icon size={32} />}
                                    role={service.title}
                                    color={service.iconColor || "bg-zinc-950"}
                                    isPrimary={service.isPrimary}
                                    description={service.description}
                                    features={service.features}
                                />
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Core Features Grid */}
            <section className="py-32 bg-white dark:bg-zinc-950">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="text-left space-y-6">
                            <SectionHeader
                                align="left"
                                badge={settings?.engineeringBadge || "ENGINEERING INTEGRITY"}
                                title={
                                    <>
                                        Intelligent <br />
                                        <span className="text-primary italic">Assessment Architecture</span>
                                    </>
                                }
                                className="mb-0"
                                description="Our platform isn't just a utility—it's a strategic infrastructure layer engineered for high-consequence assessments."
                            />
                            <div className="pt-4">
                                <Link href="/pricing">
                                    <Button variant="outline" className="h-14 px-10 border-2 border-zinc-950 dark:border-white font-bold rounded-xl flex items-center gap-2 hover:bg-zinc-950 hover:text-white transition-all">
                                        Explore Enterprise Plans <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8">
                            <FeatureDetail
                                icon={<Bot className="w-6 h-6" />}
                                title="Gemini AI Core"
                                text="Industrial-grade AI integration that synthesizes complex question variants from raw documentation in seconds."
                            />
                            <FeatureDetail
                                icon={<ShieldCheck className="w-6 h-6" />}
                                title="Anti-Fraud Engine"
                                text="Sophisticated browser focus tracking and identity verification protocols that eliminate session manipulation."
                            />
                            <FeatureDetail
                                icon={<BarChart3 className="w-6 h-6" />}
                                title="Psychometrics"
                                text="Automated difficulty mapping and cohort performance visualization for data-driven academic decisions."
                            />
                            <FeatureDetail
                                icon={<Globe className="w-6 h-6" />}
                                title="Global Scaling"
                                text="Edge-accelerated infrastructure capable of hosting thousands of concurrent examiners across timezones."
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function FlowCard({
    icon,
    role,
    description,
    features = [],
    color,
    isPrimary
}: {
    icon: React.ReactNode,
    role: string,
    description: string,
    features: string[],
    color: string,
    isPrimary?: boolean
}) {
    return (
        <div className={cn(
            "p-12 rounded-[3.5rem] border transition-all duration-500 group overflow-hidden relative flex flex-col h-full",
            isPrimary
                ? "bg-white dark:bg-zinc-900 border-primary/20 shadow-[0_40px_80px_-20px_rgba(212,175,55,0.15)] scale-[1.02] z-10"
                : "bg-white/40 dark:bg-zinc-900/40 border-border/50 hover:bg-white dark:hover:bg-zinc-900"
        )}>
            <div
                className={cn(
                    "p-5 rounded-3xl mb-10 w-fit text-white shadow-xl group-hover:scale-110 transition-transform duration-500",
                    color && !color.startsWith("#") ? color : "bg-zinc-950"
                )}
                style={color && color.startsWith("#") ? { backgroundColor: color } : {}}
            >
                {icon}
            </div>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">{role}</h3>
            <p className="text-sm text-muted-foreground font-medium italic mb-10 leading-relaxed flex-1">{description}</p>
            <ul className="space-y-4 pt-6 border-t border-border/50">
                {(features || []).map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.1em] opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    )
}

function FeatureDetail({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) {
    return (
        <div className="space-y-4 p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 border border-transparent hover:border-primary/20 hover:shadow-2xl transition-all duration-500 group">
            <div className="p-3 bg-primary/10 rounded-xl text-primary w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                {icon}
            </div>
            <h4 className="text-xl font-bold tracking-tight">{title}</h4>
            <p className="text-xs text-muted-foreground italic font-medium leading-relaxed">{text}</p>
        </div>
    )
}
