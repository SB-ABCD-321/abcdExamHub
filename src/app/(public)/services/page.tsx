import {
  Zap, ShieldCheck, BarChart3, Bot, Globe, ArrowRight,
  CheckCircle2, Building2, Users, GraduationCap, Sparkles,
  Lock, Cpu, Server, Activity
} from "lucide-react";
import { getIconByName } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TypingText from "@/components/shared/TypingText";
import SectionHeader from "@/components/shared/SectionHeader";
import Link from "next/link";
import { db } from "@/lib/prisma";

const DEFAULT_SERVICES = [
  {
    iconName: "Building2",
    title: "Portal Administrator",
    badge: "Governance & Scale",
    iconColor: "bg-primary/10 text-primary",
    description: "Architect institutional testing operations. Manage multi-tenant workspaces, configure seat limits, and monitor security protocols across all examination cycles.",
    features: [
      "Workspace provisioning & custom domains",
      "Teacher & student identity governance",
      "Exam volume & AI generation quota control",
      "Institutional audit telemetry & access logs"
    ],
    highlight: "Multi-Tenant Isolation",
    ctaText: "Manage workspace",
    ctaHref: "/admin"
  },
  {
    iconName: "Users",
    title: "Exam Faculty & Educators",
    badge: "Core Engine",
    iconColor: "bg-primary text-primary-foreground",
    isPrimary: true,
    description: "The operational core of assessment accuracy. Leverage AI to construct challenging question sets, manage banks, and monitor live exam progress in real-time.",
    features: [
      "Gemini AI automated question synthesis",
      "Live anti-cheat tab & focus monitoring",
      "Instantaneous objective grading & keys",
      "Syllabus & topic-level mastery diagnostics"
    ],
    highlight: "Google Gemini AI Studio",
    ctaText: "Faculty tools",
    ctaHref: "/dashboard"
  },
  {
    iconName: "GraduationCap",
    title: "Student Cohort",
    badge: "Candidate Experience",
    iconColor: "bg-primary/10 text-primary",
    description: "Focus-driven testing environments. Students execute their assessments in distraction-free, responsive interfaces tailored for any smartphone, tablet, or PC.",
    features: [
      "Single-click onboarding via QR codes & links",
      "Focus retention & tab-switch tracker",
      "Instant score & detailed rationale feedback",
      "Seamless historical performance records"
    ],
    highlight: "100% Mobile & Web Ready",
    ctaText: "Student portal",
    ctaHref: "/dashboard"
  }
];

interface ServiceItem {
  id?: string;
  iconName: string;
  title: string;
  badge?: string;
  iconColor: string | null;
  isPrimary?: boolean;
  description: string;
  features: string[];
  highlight?: string;
  ctaText?: string;
  ctaHref?: string;
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

  const heroSubtitle = settings?.servicesHeroSubtitle || "A unified examination infrastructure engineered for intelligent question authoring, tamper-resistant proctoring, and instant performance telemetry.";

  // Short, punchy single-line typing phrases
  const typingTexts = [
    "Exam Platform",
    "Assessment Suite",
    "Smart Testing",
    "AI Proctoring"
  ];

  return (
    <div className="w-full">
      {/* Hero Section — with proper top spacing below fixed navbar */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 overflow-hidden bg-background border-b border-border/50 transition-colors">
        <div className="container mx-auto max-w-4xl relative z-10 text-center space-y-3.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
            <Zap className="size-3.5 text-primary animate-pulse" />
            <span className="text-[11px] font-semibold text-primary">
              {settings?.servicesBadge || "Platform capabilities"}
            </span>
          </div>

          {/* Rock-solid typing headline with proper cadence and baseline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto text-foreground">
            <span>Next-Gen </span>
            <span className="text-primary">
              <TypingText
                texts={typingTexts}
                speed={75}
                eraseSpeed={35}
                pauseDelay={2000}
                delay={350}
                cursor={true}
                className="text-primary font-extrabold"
              />
            </span>
          </h1>

          {/* Strictly Two-Line Description */}
          <p className="text-sm sm:text-base text-muted-foreground font-normal max-w-2xl sm:max-w-3xl mx-auto leading-relaxed">
            Automated question synthesis, tamper-resistant proctoring, and instant telemetry.
            <br className="hidden sm:inline" />
            Engineered for educational institutions seeking seamless digital testing workflows.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/pricing">
              <Button size="sm" className="h-9.5 px-5 rounded-xl font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-transform hover:scale-102">
                View enterprise pricing
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" size="sm" className="h-9.5 px-5 rounded-xl font-semibold text-xs border-border hover:bg-muted transition-colors">
                Request a live demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Unified Ecosystem Section — Modern Role Integration Cards */}
      <section className="py-12 sm:py-16 md:py-20 bg-secondary/30 dark:bg-zinc-900/30 relative transition-colors border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <SectionHeader
            badge={settings?.unifiedBadge || "Unified ecosystem"}
            title="Tailored for Every Role"
            description="Experience complete synchronicity between institutional leadership, faculty educators, and student cohorts."
            className="mb-8 sm:mb-10"
          />

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {displayServices.map((service, index) => {
              const Icon = getIconByName(service.iconName);

              return (
                <FlowCard
                  key={service.id || index}
                  icon={<Icon size={20} />}
                  role={service.title}
                  badge={service.badge || (service.isPrimary ? "Core engine" : undefined)}
                  color={service.iconColor || "bg-primary/10 text-primary"}
                  isPrimary={service.isPrimary}
                  description={service.description}
                  features={service.features}
                  highlight={service.highlight}
                  ctaText={service.ctaText}
                  ctaHref={service.ctaHref}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Engineering Integrity Section — Enterprise Scale & Architecture */}
      <section className="py-12 sm:py-16 md:py-20 bg-background transition-colors">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-5 text-left space-y-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <ShieldCheck className="size-3.5 fill-primary/20" />
                  <span className="text-[10px] font-semibold">
                    {settings?.engineeringBadge || "Engineering integrity"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                  Engineered for enterprise scale, security & compliance
                </h2>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/50 pl-4">
                <p>
                  ABCD Exam Hub operates as a strategic infrastructure layer built specifically for high-consequence assessments.
                </p>
                <p>
                  From single-classroom tests to university-wide finals, our edge-distributed infrastructure guarantees sub-150ms responsiveness, zero data loss, and strict anti-tampering enforcement across thousands of simultaneous sessions.
                </p>
              </div>

              {/* Telemetry Stats Pill Row */}
              <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                <div className="p-2.5 rounded-xl bg-card border border-border/50">
                  <div className="text-base sm:text-lg font-black text-primary">99.9%</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Uptime SLA</div>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/50">
                  <div className="text-base sm:text-lg font-black text-primary">&lt;150ms</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Sync Latency</div>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/50">
                  <div className="text-base sm:text-lg font-black text-primary">10k+</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Concurrent Seats</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link href="/pricing">
                  <Button size="sm" className="h-9.5 px-4 rounded-xl font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-xs">
                    <span>View Plans</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Architecture Cards Column */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              <FeatureDetail
                icon={<Bot className="size-4.5" />}
                badge="Gemini 1.5 Powered"
                title="Gemini AI Question Studio"
                text="Synthesize syllabus-aligned, multi-difficulty question banks in seconds with automatic distractor validation and explanations."
              />
              <FeatureDetail
                icon={<ShieldCheck className="size-4.5" />}
                badge="Continuous Proctoring"
                title="Anti-Fraud Telemetry"
                text="Track browser focus shifts, count tab-switching incidents, enforce fullscreen, and record tamper timestamps in real time."
              />
              <FeatureDetail
                icon={<BarChart3 className="size-4.5" />}
                badge="Sub-Second Delivery"
                title="Instant Performance Analytics"
                text="Deliver automated objective scoring, bell-curve distribution models, and one-click cohort gradebook export immediately upon submission."
              />
              <FeatureDetail
                icon={<Globe className="size-4.5" />}
                badge="High-Capacity Concurrency"
                title="Edge-Distributed Capacity"
                text="Fault-tolerant serverless cluster capable of hosting thousands of simultaneous examinees with zero latency degradation."
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
  badge,
  description,
  features = [],
  highlight,
  color,
  isPrimary,
  ctaText = "Learn more",
  ctaHref = "/dashboard"
}: {
  icon: React.ReactNode;
  role: string;
  badge?: string;
  description: string;
  features: string[];
  highlight?: string;
  color: string;
  isPrimary?: boolean;
  ctaText?: string;
  ctaHref?: string;
}) {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl border transition-all duration-300 group flex flex-col justify-between h-full relative",
        isPrimary
          ? "bg-card border-primary/50 shadow-md shadow-primary/5 ring-1 ring-primary/20"
          : "bg-card border-border/60 hover:border-primary/40 shadow-xs hover:shadow-sm"
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="size-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center transition-transform group-hover:scale-105">
            {icon}
          </div>
          {badge && (
            <span
              className={cn(
                "text-[10px] font-semibold px-2.5 py-0.5 rounded-full border",
                isPrimary
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-muted border-border/50 text-muted-foreground"
              )}
            >
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-bold tracking-tight mb-2 text-foreground group-hover:text-primary transition-colors">
          {role}
        </h3>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>

        <ul className="space-y-2 pt-3 border-t border-border/50 text-xs mb-5">
          {(features || []).map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-foreground/90">
              <CheckCircle2 className="size-3.5 text-primary shrink-0" />
              <span className="text-[11px] font-medium">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 mt-auto">
        {highlight && (
          <div className="px-3 py-1.5 rounded-lg bg-muted/40 border border-border/40 text-[10px] font-semibold text-muted-foreground flex items-center justify-between">
            <span>Deliverable</span>
            <span className="text-primary font-bold">{highlight}</span>
          </div>
        )}

        <Link href={ctaHref || "/dashboard"} className="block">
          <Button
            variant={isPrimary ? "default" : "outline"}
            size="sm"
            className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5 transition-all"
          >
            <span>{ctaText || "Learn more"}</span>
            <ArrowRight className="size-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FeatureDetail({
  icon,
  badge,
  title,
  text
}: {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  text: string;
}) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 hover:border-primary/40 shadow-xs hover:shadow-sm transition-all duration-300 space-y-2.5 group">
      <div className="flex items-center justify-between">
        <div className="size-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center transition-transform group-hover:scale-105">
          {icon}
        </div>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40">
            {badge}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}
