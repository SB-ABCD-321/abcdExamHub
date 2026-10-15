import Image from "next/image";
import Link from "next/link";
import {
  BookOpenCheck, ArrowRight, ShieldCheck, Zap, BarChart3,
  Mail, MapPin, Bot, Timer, QrCode, CheckCircle2, Star, Rocket,
  Sparkles, Building2, Users, GraduationCap, Lock, Layers, Cpu, Award
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/prisma";
import HeroSlider from "@/components/layout/HeroSlider";
import { FAQList } from "@/components/layout/FAQList";
import { InteractiveProcess } from "@/components/layout/InteractiveProcess";
import { ExamAssistantChat } from "@/components/layout/ExamAssistantChat";
import { InquiryForm } from "@/components/shared/InquiryForm";

export const runtime = "nodejs";

export default async function Home() {
  const [
    settings,
    banners,
    faqs,
    testimonials,
    advantages,
    latestNotice,
  ] = await Promise.all([
    db.siteSetting.findFirst(),
    (db as any).banner ? (db as any).banner.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }) : Promise.resolve([]),
    (db as any).faq ? (db as any).faq.findMany({ orderBy: { order: 'asc' } }) : Promise.resolve([]),
    (db as any).testimonial ? (db as any).testimonial.findMany({ where: { isActive: true } }) : Promise.resolve([]),
    (db as any).advantage ? (db as any).advantage.findMany({ orderBy: { order: 'asc' } }) : Promise.resolve([]),
    (db as any).notice ? (db as any).notice.findFirst({ orderBy: { createdAt: 'desc' } }) : Promise.resolve(null),
  ]);

  // Default fallbacks with modern tone
  const heroTopTitle = (settings as any)?.heroTopTitle || "Intelligent Examination Suite";
  const heroTitle = settings?.heroTitle || "Precision testing for forward-thinking institutions";
  const heroSubtitle = settings?.heroSubtitle || "Streamline exam lifecycles with automated AI question authoring, tamper-resistant proctoring, and instant grade distributions.";
  const aboutTitle = (settings as any)?.aboutUsTitle || "Transforming assessments through technology";
  const aboutText = (settings as any)?.aboutUsText || "ABCD Exam Hub bridges pedagogical integrity with intelligent automation, equipping universities, academies, and certifying bodies with modern digital examination workflows.";
  const aboutImage = (settings as any)?.aboutUsImageUrl || "https://cdn.pixabay.com/photo/2018/02/03/09/49/startup-3127285_1280.jpg";
  const whyUsText = settings?.whyUsText || "Engineered for high reliability, fairness, and effortless scalability across mobile, tablet, and desktop environments.";

  const aboutBadge = (settings as any)?.aboutBadge || "Our platform";
  let rawFeatures = (settings as any)?.aboutFeatures;
  const aboutFeatures = (Array.isArray(rawFeatures) && rawFeatures.length > 0) ? rawFeatures : [
    "AI-powered question generation",
    "Isolated institutional workspaces",
    "Real-time proctoring telemetry",
    "Instant cohort analytics and export"
  ];

  const processBadge = (settings as any)?.processBadge || "Simple workflow";
  const processTitle = (settings as any)?.processTitle || "From configuration to delivery in four steps";
  
  const processSteps = [
    {
      step: "01",
      icon: <Building2 className="size-5" />,
      title: "Initialize Workspace",
      description: "Set up your branded institutional domain, configure admin policies, and assign subject clusters.",
      tag: "Instant tenant setup"
    },
    {
      step: "02",
      icon: <Users className="size-5" />,
      title: "Onboard Educators & Students",
      description: "Invite faculty leads with granular permissions and enroll student cohorts via secure links or QR codes.",
      tag: "Role-based access"
    },
    {
      step: "03",
      icon: <Sparkles className="size-5" />,
      title: "Author with Gemini AI",
      description: "Generate syllabus-aligned question pools in seconds or upload existing question sets in bulk.",
      tag: "Multi-variant questions"
    },
    {
      step: "04",
      icon: <ShieldCheck className="size-5" />,
      title: "Execute & Analyze",
      description: "Deliver timed exams with anti-cheat monitoring and access immediate performance analytics.",
      tag: "Live proctor logs"
    }
  ];

  const faqBadge = (settings as any)?.faqBadge || "Knowledge base";
  const contactBadge = (settings as any)?.contactBadge || "Get in touch";
  const enterpriseTitle = (settings as any)?.enterpriseTitle || "Need institutional scale?";
  const enterpriseDescription = (settings as any)?.enterpriseDescription || "Unlock unlimited AI question generations, dedicated support, and custom subdomain infrastructure.";

  const contactEmail = settings?.email || "support@abcdexamhub.com";
  const contactWhatsapp = settings?.whatsappNo || "8944899747";
  const location = settings?.location || "Kolkata, WB";

  const displayFaqs = faqs.length > 0 ? faqs : [
    { question: "How do I create an institute workspace?", answer: "Register as an administrator or submit an inquiry to provision a dedicated workspace with your institution's branding and seat limits." },
    { question: "How does AI question authoring work?", answer: "Our platform integrates Google Gemini AI to generate customized multiple-choice, numerical, and conceptual questions based on your input topics and difficulty levels." },
    { question: "What proctoring safeguards are in place?", answer: "We track window focus, monitor tab-switching counts, record blur timestamps, and support automated submission triggers to protect exam integrity." },
    { question: "Can faculty import existing question banks?", answer: "Yes, instructors can bulk-import question banks in Excel/CSV formats or construct new banks collaboratively within their subject folders." },
    { question: "Does the platform perform smoothly on mobile phones?", answer: "Yes, every interface is fully optimized for responsive mobile browsers, ensuring students can take exams reliably from any smartphone or tablet." },
    { question: "How does automated evaluation and grade export operate?", answer: "Objective question responses are graded instantaneously upon student submission with detailed answer rationales. Cohort analytics, percentile bands, and item difficulty metrics can be downloaded immediately as Excel or PDF reports." },
    { question: "Can exams be customized with section timers and shuffled questions?", answer: "Yes. Coordinators can configure global or sectional time limits, shuffle question sequences per candidate, randomize option choices, and enforce positive or negative marking schemes." }
  ];

  let statsExams = (settings as any)?.statExamsCount || 0;
  let statsTeachers = (settings as any)?.statTeachersCount || 0;
  let statsWorkspaces = (settings as any)?.statWorkspacesCount || 0;

  if ((settings as any)?.showHeroStats !== false) {
    const [realExams, realTeachers, realWorkspaces] = await Promise.all([
      (settings as any)?.statExamsCount ? Promise.resolve(0) : db.exam.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
      (settings as any)?.statTeachersCount ? Promise.resolve(0) : db.user.count({ where: { role: 'TEACHER' } }).catch(() => 0),
      (settings as any)?.statWorkspacesCount ? Promise.resolve(0) : db.workspace.count().catch(() => 0),
    ]);
    if (!(settings as any)?.statExamsCount) statsExams = realExams;
    if (!(settings as any)?.statTeachersCount) statsTeachers = realTeachers;
    if (!(settings as any)?.statWorkspacesCount) statsWorkspaces = realWorkspaces;
  }

  const heroRightImageUrl = (settings as any)?.heroRightImageUrl || "https://res.cloudinary.com/dmhipemqk/image/upload/v1772693201/branding/pnxtq45ycum1izb01wo3.png";

  return (
    <div className="flex-1 w-full">
      {/* Hero Section — exactly 1 full viewport height (100dvh / 100vh) */}
      <section className="relative min-h-[100dvh] lg:h-[100dvh] flex flex-col justify-center pt-16 sm:pt-20 pb-8 sm:pb-10 overflow-hidden bg-zinc-950">
        <HeroSlider banners={banners} />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 max-w-7xl flex-1 flex flex-col justify-center my-auto">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                <Zap className="size-3.5 text-primary animate-pulse" />
                <span className="text-[11px] font-semibold text-primary">
                  {heroTopTitle}
                </span>
              </div>

              <h1 className="font-sans font-extrabold tracking-tight text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.15] max-w-2xl">
                {heroTitle.includes('\n') ? (
                  heroTitle.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i !== heroTitle.split('\n').length - 1 && <br />}
                    </span>
                  ))
                ) : heroTitle}
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-zinc-300 font-normal max-w-xl leading-relaxed border-l-2 border-primary/60 pl-3.5">
                {heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    className="h-10 sm:h-11 px-5 sm:px-6 rounded-xl font-semibold text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-transform hover:scale-102 active:scale-98"
                  >
                    <span>Get started</span>
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </Button>
                </Link>

                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-10 sm:h-11 px-5 sm:px-6 rounded-xl font-semibold text-xs sm:text-sm border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md transition-transform hover:scale-102 active:scale-98"
                  >
                    Dashboard preview
                  </Button>
                </Link>
              </div>

              {(settings as any)?.showHeroStats !== false && (
                <div className="grid grid-cols-3 gap-3 pt-3.5 sm:pt-4 mt-3 border-t border-white/10 max-w-lg">
                  <div className="space-y-0.5">
                    <div className="text-lg sm:text-2xl font-black text-primary">{statsExams}+</div>
                    <div className="text-[10px] font-medium text-zinc-400">Exams conducted</div>
                  </div>
                  <div className="border-x border-white/10 px-3 space-y-0.5">
                    <div className="text-lg sm:text-2xl font-black text-primary">{statsTeachers}+</div>
                    <div className="text-[10px] font-medium text-zinc-400">Faculty members</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-lg sm:text-2xl font-black text-primary">{statsWorkspaces}+</div>
                    <div className="text-[10px] font-medium text-zinc-400">Institutions</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side Illustration */}
            <div className="hidden lg:flex lg:col-span-5 justify-center relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl opacity-40 pointer-events-none" />
              <div className="relative z-10 w-full max-w-[340px] xl:max-w-[380px] aspect-square rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-5 flex items-center justify-center shadow-xl">
                <Image
                  src={heroRightImageUrl}
                  alt="Exam Hub"
                  width={320}
                  height={320}
                  priority
                  className="w-full h-full object-contain pointer-events-none"
                />
                <div className="absolute top-3.5 left-3.5 p-2 bg-zinc-950/80 rounded-xl border border-white/10 backdrop-blur-md">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="absolute bottom-3.5 right-3.5 p-2 bg-primary rounded-xl shadow-md">
                  <ShieldCheck className="size-4 text-primary-foreground font-bold" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section — Enriched & Comprehensive */}
      <section id="about" className="py-12 sm:py-16 md:py-20 bg-background transition-colors">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Visual presentation with floating telemetry badges */}
            <div className="lg:col-span-5 relative group">
              <div className="relative min-h-[320px] sm:min-h-[420px] rounded-2xl overflow-hidden bg-card border border-border/60 shadow-lg">
                {aboutImage ? (
                  <Image
                    src={aboutImage}
                    alt="About ABCD Exam Hub"
                    fill
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <BookOpenCheck size={56} className="text-primary opacity-30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />

                {/* Top Engine Badge */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md border border-white/15 text-white text-[11px] font-medium shadow-md">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Gemini AI Engine</span>
                </div>

                {/* Floating Bottom Integrity Card */}
                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-zinc-950/90 backdrop-blur-md border border-white/10 text-white shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20 text-primary border border-primary/30 shrink-0">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">Bank-Grade Exam Integrity</h4>
                      <p className="text-[10px] text-zinc-300">Continuous tab detection, blur logging & anti-cheat triggers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini Metrics Row Below Image */}
              <div className="grid grid-cols-3 gap-2.5 pt-4 text-center">
                <div className="p-2.5 rounded-xl bg-card border border-border/50">
                  <div className="text-base sm:text-lg font-black text-primary">99.9%</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Uptime SLA</div>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/50">
                  <div className="text-base sm:text-lg font-black text-primary">&lt;150ms</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Sync Latency</div>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/50">
                  <div className="text-base sm:text-lg font-black text-primary">100%</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Mobile Ready</div>
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Narrative & Feature Matrix */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <Star className="size-3 fill-primary" />
                  <span className="text-[10px] font-semibold">{aboutBadge}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  {aboutTitle}
                </h2>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/50 pl-4 py-0.5">
                <p>
                  {aboutText}
                </p>
                <p>
                  Built specifically for modern educational ecosystems, ABCD Exam Hub unifies the entire testing lifecycle into one friction-free workflow. We eliminate manual grading delays, eradicate question leakages, and equip institutional leaders with deep, actionable intelligence into cohort performance.
                </p>
              </div>

              {/* 4 Pillars Matrix */}
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="size-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground">AI Question Generation</h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-normal">
                    Generate syllabus-aligned question banks, multi-tier difficulty curves, and detailed answers in seconds with Google Gemini.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <ShieldCheck className="size-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground">Anti-Cheat Proctoring</h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-normal">
                    Real-time window blur monitoring, tab-switch counts, and strict lockdown controls ensure uncompromised assessment fairness.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground">Institutional Workspaces</h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-normal">
                    Dedicated multi-tenant environments with isolated student cohorts, branded domains, and granular role permissions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <BarChart3 className="size-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground">Actionable Analytics</h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-normal">
                    Instant cohort grade distributions, topic-level weakness diagnostics, and one-click tabular grade exports.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/services">
                  <Button
                    size="sm"
                    className="h-9.5 px-4 rounded-xl font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors gap-1.5 shadow-xs"
                  >
                    <span>Explore services</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>

                <Link href="#contact">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9.5 px-4 rounded-xl font-semibold text-xs border-border hover:bg-muted transition-colors"
                  >
                    Request a Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advantage Section */}
      <section className="py-10 sm:py-12 md:py-14 bg-secondary/30 dark:bg-zinc-900/30 border-y border-border/50 transition-colors">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary mx-auto">
              <Star className="size-3 fill-primary" />
              <span className="text-[10px] font-semibold">Core advantages</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Why institutions trust ABCD Exam Hub
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              {whyUsText}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {advantages.length > 0 ? (
              advantages.map((adv: any) => (
                <FeatureCard
                  key={adv.id}
                  icon={<div className="size-5 flex items-center justify-center font-bold text-sm">{adv.title.charAt(0)}</div>}
                  title={adv.title}
                  description={adv.description}
                />
              ))
            ) : (
              <>
                <FeatureCard
                  icon={<ShieldCheck className="size-4" />}
                  title="Isolated Workspaces"
                  description="Tenant data isolation ensures questions, grades, and rosters are completely segregated and secure."
                />
                <FeatureCard
                  icon={<Bot className="size-4" />}
                  title="Gemini AI Integration"
                  description="Generate syllabus-compliant question variants in seconds using deeply embedded Google Gemini AI."
                />
                <FeatureCard
                  icon={<Timer className="size-4" />}
                  title="Real-Time Proctoring"
                  description="Track browser focus shifts, count tab changes, and prevent unverified actions during live exams."
                />
                <FeatureCard
                  icon={<Zap className="size-4" />}
                  title="Instant Evaluation"
                  description="Automated scoring delivers instantaneous results to students while providing rich performance summaries."
                />
                <FeatureCard
                  icon={<QrCode className="size-4" />}
                  title="Smart Onboarding"
                  description="Seamless student and instructor onboarding via dynamic QR codes and secure single-use invitation links."
                />
                <FeatureCard
                  icon={<BarChart3 className="size-4" />}
                  title="Cohort Analytics"
                  description="Actionable grade distributions, percentile bands, and topic-level mastery reports for coordinators."
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it Works / Advanced Interactive Stepper Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-background transition-colors">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="text-center mb-8 sm:mb-12 space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary mx-auto">
              <Star className="size-3 fill-primary" />
              <span className="text-[10px] font-semibold">{processBadge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {processTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A frictionless pathway designed to get your entire institution running examinations in minutes.
            </p>
          </div>

          {/* Interactive Pipeline & Simulated Terminal Tour */}
          <InteractiveProcess />
        </div>
      </section>

      {/* FAQ & AI Assistant Section — with matching equal heights */}
      <section id="faq" className="py-12 sm:py-16 md:py-20 bg-secondary/30 dark:bg-zinc-900/30 border-t border-border/50 transition-colors overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl w-full">
          <div className="text-center mb-8 sm:mb-10 space-y-1.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary mx-auto">
              <Star className="size-3 fill-primary" />
              <span className="text-[10px] font-semibold">{faqBadge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Answers to common queries regarding institutional setup, AI features, and assessment security.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start lg:items-stretch w-full min-w-0">
            {/* Left AI Chat Assistant Preview — strictly locked height with internal auto-scroll */}
            <div className="lg:col-span-5 flex flex-col h-[480px] sm:h-[520px] lg:h-full max-h-[560px] min-h-0 w-full min-w-0">
              <ExamAssistantChat />
            </div>

            {/* Right Accordion FAQ List — matching height */}
            <div className="lg:col-span-7 flex flex-col min-h-0 w-full min-w-0">
              <FAQList faqs={displayFaqs} className="h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Enterprise CTA — Matching Equal Heights */}
      <section id="contact" className="py-12 sm:py-16 md:py-20 bg-background border-t border-border/50 transition-colors">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Contact Info & Enterprise Card — matching height with form */}
            <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-5">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                    <Star className="size-3 fill-primary" />
                    <span className="text-[10px] font-semibold">{contactBadge}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                    Get in touch with our team
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Have questions about custom institutional deployments, volume licensing, or API integration? We are here to help.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <ContactInfo icon={<Mail className="size-4 text-primary" />} title="Corporate Email" value={contactEmail} />
                  <ContactInfo icon={<FaWhatsapp className="size-4 text-emerald-500" />} title="WhatsApp Support" value={contactWhatsapp} />
                  <ContactInfo icon={<MapPin className="size-4 text-primary" />} title="Headquarters" value={location} />
                </div>
              </div>

              {/* Enterprise Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Rocket className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{enterpriseTitle}</h4>
                    <p className="text-xs text-muted-foreground">{enterpriseDescription}</p>
                  </div>
                </div>
                <Link href="/pricing" className="block pt-1">
                  <Button size="sm" className="w-full h-9 rounded-xl font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                    Explore Enterprise Plans <ArrowRight className="ml-1.5 size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side Inquiry Form — matching height */}
            <div className="lg:col-span-6 flex flex-col h-full">
              <InquiryForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 hover:border-primary/40 shadow-xs hover:shadow-sm transition-all duration-300 space-y-2.5 group">
      <div className="size-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center transition-transform group-hover:scale-105">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function Step({ stepNumber, icon, title, description, tag }: { stepNumber: string; icon: React.ReactNode; title: string; description: string; tag?: string }) {
  return (
    <div className="relative p-4 sm:p-5 rounded-2xl bg-card border border-border/60 hover:border-primary/40 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center transition-transform group-hover:scale-110">
            {icon}
          </div>
          <span className="text-xs font-bold text-muted-foreground font-mono">
            {stepNumber}
          </span>
        </div>
        <h4 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors mb-1">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      {tag && (
        <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center gap-1.5 text-[10px] font-semibold text-primary">
          <CheckCircle2 className="size-3" />
          <span>{tag}</span>
        </div>
      )}
    </div>
  );
}

function ContactInfo({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-card border border-border/50">
      <div className="p-1.5 rounded-lg bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-muted-foreground">{title}</div>
        <div className="text-xs sm:text-sm font-semibold text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}
