import Image from "next/image";
import Link from "next/link";
import {
  BookOpenCheck, ArrowRight, ShieldCheck, Zap, BarChart3, HelpCircle,
  Mail, Phone, MapPin, Bot, Timer, QrCode, CheckCircle2, Star, Rocket,
  Building2, ChevronRight, Play, Megaphone, MessageCircle
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import HeroSlider from "@/components/layout/HeroSlider";
import { FAQList } from "@/components/layout/FAQList";
import { InquiryForm } from "@/components/shared/InquiryForm";

export const runtime = "nodejs";

export default async function Home() {
  // Fetch safety-checked lists in parallel to reduce connection overhead and round-trips
  const [
    settings,
    banners,
    faqs,
    testimonials,
    navbarItems,
    advantages,
    services,
    latestNotice,
    dynamicPages
  ] = await Promise.all([
    db.siteSetting.findFirst(),
    (db as any).banner ? (db as any).banner.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }) : Promise.resolve([]),
    (db as any).faq ? (db as any).faq.findMany({ orderBy: { order: 'asc' } }) : Promise.resolve([]),
    (db as any).testimonial ? (db as any).testimonial.findMany({ where: { isActive: true } }) : Promise.resolve([]),
    (db as any).navbarItem ? (db as any).navbarItem.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }) : Promise.resolve([]),
    (db as any).advantage ? (db as any).advantage.findMany({ orderBy: { order: 'asc' } }) : Promise.resolve([]),
    (db as any).service ? (db as any).service.findMany({ orderBy: { order: 'asc' } }) : Promise.resolve([]),
    (db as any).notice ? (db as any).notice.findFirst({ orderBy: { createdAt: 'desc' } }) : Promise.resolve(null),
    (db as any).dynamicPage ? (db as any).dynamicPage.findMany({ where: { isActive: true } }) : Promise.resolve([]),
  ]);

  // Default fallbacks
  const siteName = settings?.siteName || "ABCD Exam Hub";
  const heroTopTitle = (settings as any)?.heroTopTitle || "Smart Exam Solutions";
  const heroTitle = settings?.heroTitle || "Building Confidence Through Better Testing";
  const heroSubtitle = settings?.heroSubtitle || "Streamline exam management with automated workflows, instant grading, and real-time insights for educators and learners alike.";
  const aboutTitle = (settings as any)?.aboutUsTitle || "Transforming Exams Together";
  const aboutText = (settings as any)?.aboutUsText || "Our platform is built on the belief that assessment should be a catalyst for growth, not a barrier to progress. We bridge the gap between traditional integrity and modern AI efficiency, providing institutions with the tools they need to define the future of education.";
  const aboutImage = (settings as any)?.aboutUsImageUrl || "https://cdn.pixabay.com/photo/2018/02/03/09/49/startup-3127285_1280.jpg";
  const whyUsText = settings?.whyUsText || "We combine innovation, security, and simplicity to deliver exams that are fair, accessible, and stress-free for everyone.";
  const footerDescription = settings?.footerDescription || settings?.footerText || "The ultimate digital assessment platform for modern institutions.";

  const aboutBadge = (settings as any)?.aboutBadge || "Our Legacy";
  let rawFeatures = (settings as any)?.aboutFeatures;
  const aboutFeatures = (Array.isArray(rawFeatures) && rawFeatures.length > 0) ? rawFeatures : [
    "AI-Powered Question Banks",
    "Military Grade Security",
    "Real-time Proctoring",
    "Instant Result Analytics"
  ];
  const processBadge = (settings as any)?.processBadge || "OUR PROCESS";
  const processTitle = (settings as any)?.processTitle || "From Setup to Success";
  let rawSteps = (settings as any)?.processSteps;
  const processSteps = (Array.isArray(rawSteps) && rawSteps.length > 0) ? rawSteps : [
    { icon: "01", title: "Create Workspace", description: "Register your institution and set up your dedicated administrative workspace." },
    { icon: "02", title: "Onboard Team", description: "Add teachers to manage subjects and students to participate in exams." },
    { icon: "03", title: "Build Questions", description: "Use AI or manual tools to construct comprehensive question banks and topics." },
    { icon: "04", title: "Deploy Exams", description: "Configure secure assessment sessions and analyze results in real-time." }
  ];
  const faqBadge = (settings as any)?.faqBadge || "KNOWLEDGE BASE";
  const contactBadge = (settings as any)?.contactBadge || "CONTACT US";
  const enterpriseTitle = (settings as any)?.enterpriseTitle || "Ready for Enterprise?";
  const enterpriseDescription = (settings as any)?.enterpriseDescription || "Unlock custom features, dedicated support, and institutional-scale testing infrastructure tailored for your organization's unique needs.";

  const contactEmail = settings?.email || "support@abcdexamhub.com";
  const contactPhone = settings?.mobileNo || "8944899747";
  const contactWhatsapp = settings?.whatsappNo || "8944899747";
  const location = settings?.location || "Kolkata, WB";

  const displayFaqs = faqs.length > 0 ? faqs : [
    { question: "How do I create an institute workspace?", answer: "Register as an administrator or contact us to provision an Enterprise Workspace for your institution." },
    { question: "Is the AI Question Generator limited?", answer: "Trial accounts include AI generations. Upgrade to our Enterprise plan for unlimited AI-powered assessment creation." },
    { question: "How secure is the proctoring system?", answer: "We monitor tab-switching, focus changes, and real-time activity to ensure the integrity of every assessment mission." },
    { question: "Can I import existing questions?", answer: "Yes! You can bulk import questions via Excel/CSV formats or use our AI to convert your existing documents into interactive quizzes." },
    { question: "Does it support mobile devices?", answer: "The platform is fully responsive and optimized for all devices, including tablets and smartphones, ensuring a seamless experience for students." }
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

  const heroRightImageUrl = (settings as any)?.heroRightImageUrl || "https://res.cloudinary.com/dmhipemqk/image/upload/v1772693201/branding/pnxtq45ycum1izb01wo3.png"; // Fallback to logo or suitable exam image

  return (
    <>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[100dvh] lg:min-h-screen flex items-center pt-16 md:pt-24 pb-16 overflow-hidden bg-zinc-950">
          {/* Dynamic Slider Background */}
          <HeroSlider banners={banners} />

          <div className="container relative z-10 mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-6 items-center">
              <div className="text-left space-y-10">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      {heroTopTitle}
                    </span>
                  </div>

                  <h1
                    className="font-sans font-black tracking-tight text-white leading-tight drop-shadow-2xl max-w-4xl"
                    style={{
                      fontSize: `clamp(${(settings as any)?.heroTitleMobileFontSize || 40}px, 8vw, ${(settings as any)?.heroTitleFontSize || 80}px)`,
                      lineHeight: '1.1'
                    }}
                  >
                    {heroTitle.includes('\n') ? (
                      heroTitle.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          {i !== heroTitle.split('\n').length - 1 && <br />}
                        </span>
                      ))
                    ) : heroTitle}
                  </h1>
                </div>

                <p className="text-base text-zinc-300/80 font-medium max-w-xl leading-relaxed border-l-2 border-primary/50 pl-4 py-1 italic line-clamp-3">
                  {heroSubtitle}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/sign-in" className="flex-1 sm:max-w-xs">
                    <button suppressHydrationWarning className="w-full group relative h-14 bg-primary text-zinc-950 font-sans font-bold tracking-tight text-lg rounded-xl shadow-[0_15px_40px_-10px_rgba(212,175,55,0.4)] transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(212,175,55,0.6)] hover:-translate-y-1 active:scale-95 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative z-10 flex items-center gap-2">Get Started <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
                    </button>
                  </Link>
                  <Link href="/dashboard" className="flex-1 sm:max-w-xs">
                    <button suppressHydrationWarning className="w-full h-14 border border-white/20 text-white font-sans font-bold tracking-tight text-lg rounded-xl transition-all duration-300 hover:-translate-y-1 active:scale-95 backdrop-blur-md hover:bg-white/10 flex items-center justify-center">
                      Dashboard
                    </button>
                  </Link>
                </div>

                {(settings as any)?.showHeroStats !== false && (
                  <div className="grid grid-cols-3 gap-1 sm:gap-4 pt-8 mt-8 border-t border-white/10 w-full">
                    <div className="text-center space-y-1">
                      <div className="text-2xl sm:text-3xl font-black text-primary drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{statsExams}+</div>
                      <div className="text-[8px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] leading-tight">Exams<br className="sm:hidden" /> Conducted</div>
                    </div>
                    <div className="text-center border-x border-white/10 space-y-1">
                      <div className="text-2xl sm:text-3xl font-black text-primary drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{statsTeachers}+</div>
                      <div className="text-[8px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] leading-tight">Teachers<br className="sm:hidden" /> Available</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="text-2xl sm:text-3xl font-black text-primary drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{statsWorkspaces}+</div>
                      <div className="text-[8px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] leading-tight">Live<br className="sm:hidden" /> Workspaces</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side Illustration / Animation */}
              <div className="hidden lg:block relative group">
                <div className="absolute -inset-10 bg-primary/20 rounded-full blur-[100px] animate-pulse opacity-50" />
                <div className="relative z-10 flex items-center justify-end transform group-hover:scale-105 transition-transform duration-700">
                  <div className="relative aspect-square w-full max-w-[460px] rounded-[4rem] border border-white/10 bg-zinc-900/50 backdrop-blur-xl p-8 overflow-hidden shadow-[0_0_120px_-20px_rgba(212,175,55,0.15)]">
                    <Image
                      src={heroRightImageUrl}
                      alt="Exam Illustration"
                      width={460}
                      height={460}
                      priority
                      className="w-full h-full object-contain pointer-events-none drop-shadow-[0_0_30px_rgba(255,215,0,0.1)]"
                    />

                    {/* Interactive Elements Overlay */}
                    <div className="absolute top-12 left-12 p-5 bg-zinc-950/80 rounded-3xl border border-white/10 backdrop-blur-md animate-bounce duration-[3000ms]">
                      <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute bottom-12 right-12 p-6 bg-primary rounded-3xl shadow-2xl scale-125">
                      <ShieldCheck className="w-8 h-8 text-black font-bold" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 bg-background relative overflow-hidden">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-stretch">
              <div className="relative group h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-yellow-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative h-full min-h-[400px] rounded-[2.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-border/50 shadow-2xl">
                  {aboutImage ? (
                    <Image
                      src={aboutImage}
                      alt="About Us"
                      fill
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      <BookOpenCheck size={100} className="text-primary opacity-20" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-6 py-4">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                    <Star className="w-3.5 h-3.5 fill-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{aboutBadge}</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-sans font-bold tracking-tight leading-[1] text-balance">
                    {aboutTitle}
                  </h2>
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed italic font-medium border-l-4 border-primary/30 pl-6 py-2">
                  {aboutText}
                </p>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  {(aboutFeatures || []).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 group/item">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary group-hover/item:scale-150 transition-transform" />
                      <span className="text-xs font-black uppercase tracking-widest opacity-70 group-hover/item:opacity-100 transition-opacity">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6">
                  <Link href="/services">
                    <Button
                      variant="outline"
                      className="h-14 px-12 border-2 border-zinc-950 dark:border-white text-zinc-950 dark:text-white font-sans font-bold tracking-tight text-lg rounded-xl transition-all duration-300 hover:bg-zinc-950 hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 active:scale-95 flex items-center justify-center gap-2"
                    >
                      More About Us <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Advantage Section */}
        <section className="py-32 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-y border-border/50">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -ml-64 -mb-64" />
          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="text-center mb-24 max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mx-auto">
                <Star className="w-3.5 h-3.5 fill-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">OUR ADVANTAGE</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-sans font-bold tracking-tight leading-[1.1] text-balance">
                Why Choose Our Platform
              </h2>
              <p className="text-lg text-muted-foreground italic font-medium leading-relaxed max-w-2xl mx-auto">
                {whyUsText}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {advantages.length > 0 ? (
                advantages.map((adv: any) => (
                  <FeatureCard
                    key={adv.id}
                    icon={<div className="h-8 w-8 flex items-center justify-center font-bold text-lg">{adv.title.charAt(0)}</div>}
                    title={adv.title}
                    description={adv.description}
                  />
                ))
              ) : (
                <>
                  <FeatureCard
                    icon={<ShieldCheck className="h-8 w-8" />}
                    title="Isolated Workspaces"
                    description="Secure multi-tenant architecture ensures your data and exams remain completely private and isolated."
                  />
                  <FeatureCard
                    icon={<Bot className="h-8 w-8" />}
                    title="Gemini AI Integration"
                    description="Generate highly relevant question variants instantly using our deeply integrated Google Gemini AI engine."
                  />
                  <FeatureCard
                    icon={<Timer className="h-8 w-8" />}
                    title="Live Proctoring"
                    description="Monitor student behavior in real-time with automated tab-switching alerts and environment focus tracking."
                  />
                  <FeatureCard
                    icon={<Zap className="h-8 w-8" />}
                    title="Instant Evaluation"
                    description="Automated grading systems provide immediate feedback to students and detailed analytics to examiners."
                  />
                  <FeatureCard
                    icon={<QrCode className="h-8 w-8" />}
                    title="Smart Onboarding"
                    description="Easily onboard students and teachers using dynamic QR codes and link sharing for rapid deployment."
                  />
                  <FeatureCard
                    icon={<BarChart3 className="h-8 w-8" />}
                    title="Cohort Analytics"
                    description="Deep dive into performance metrics with automated demographic reports and distribution mapping."
                  />
                </>
              )}
            </div>
          </div>
        </section>

        {/* How to Use - Steps Section */}
        <section className="py-32 bg-background">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-24 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mx-auto">
                <Star className="w-3.5 h-3.5 fill-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">{processBadge}</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-sans font-bold tracking-tight leading-[1.1] text-balance">
                {processTitle}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
              <div className="hidden lg:block absolute top-[35%] left-20 right-20 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent z-0"></div>
              {(processSteps || []).map((step: any, idx) => (
                <Step 
                  key={idx} 
                  icon={step.icon || `0${idx + 1}`} 
                  title={step.title} 
                  description={step.description} 
                />
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 bg-zinc-50 dark:bg-zinc-900/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -ml-64 -mt-64" />
          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="text-center mb-24 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mx-auto">
                <Star className="w-3.5 h-3.5 fill-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">{faqBadge}</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-sans font-bold tracking-tight leading-[1.1] text-balance">
                Common Asked Questions
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-stretch">
              {/* Left Column: AI Chat Visual */}
              <div className="flex flex-col gap-8 h-full">
                <div className="flex-1 rounded-[3rem] bg-white dark:bg-zinc-950 border border-border/50 shadow-2xl relative overflow-hidden group flex flex-col min-h-[500px] h-full">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                    <Bot size={150} className="text-primary" />
                  </div>

                  {/* Chat Header */}
                  <div className="relative z-10 p-8 pb-4 border-b border-border/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Bot className="text-primary-foreground w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black uppercase tracking-tight">AI Assistant</h4>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Online & Ready</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages - Scrollable */}
                  <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-6 md:p-8 pt-6 space-y-4 scroll-smooth scrollbar-hide">
                      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 max-w-[85%] rounded-tl-none border border-border/50">
                        <p className="text-sm font-medium italic">Hello! How can I help you today?</p>
                      </div>
                      <div className="bg-primary/10 text-primary rounded-2xl p-4 max-w-[85%] ml-auto rounded-tr-none border border-primary/20">
                        <p className="text-sm font-bold">What is Gemini AI integration?</p>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 max-w-[85%] rounded-tl-none border border-border/50">
                        <p className="text-sm font-medium italic">Our platform uses Google's Gemini AI to generate high-quality, relevant question variants automatically!</p>
                      </div>
                      <div className="bg-primary/10 text-primary rounded-2xl p-4 max-w-[85%] ml-auto rounded-tr-none border border-primary/20">
                        <p className="text-sm font-bold">Is it secure for exams?</p>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 max-w-[85%] rounded-tl-none border border-border/50">
                        <p className="text-sm font-medium italic">Yes! We use isolated workspaces and real-time proctoring to ensure top-tier security.</p>
                      </div>
                      <div className="bg-primary/10 text-primary rounded-2xl p-4 max-w-[85%] ml-auto rounded-tr-none border border-primary/20">
                        <p className="text-sm font-bold">Does it support bulk uploads?</p>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 max-w-[85%] rounded-tl-none border border-border/50">
                        <p className="text-sm font-medium italic">Absolutely! You can import hundreds of students via Excel or CSV in seconds.</p>
                      </div>
                      <div className="bg-primary/10 text-primary rounded-2xl p-4 max-w-[85%] ml-auto rounded-tr-none border border-primary/20">
                        <p className="text-sm font-bold">What about automated grading?</p>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 max-w-[85%] rounded-tl-none border border-border/50">
                        <p className="text-sm font-medium italic">Most question types are graded instantly, providing immediate feedback.</p>
                      </div>
                      <div className="flex items-center gap-1 pl-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Smart FAQ Accordion */}
              <FAQList faqs={displayFaqs} />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-32 bg-white dark:bg-zinc-950 border-t border-border/50">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-20 items-stretch">
              <div className="space-y-12 flex flex-col h-full">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                    <Star className="w-3.5 h-3.5 fill-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{contactBadge}</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-sans font-bold tracking-tight leading-[1.1] text-balance">
                    Let’s Talk
                  </h2>
                </div>

                <div className="space-y-10 flex-1">
                  <ContactInfo icon={<Mail className="text-primary" />} title="Corporate Email" value={contactEmail} />
                  <ContactInfo icon={<FaWhatsapp className="text-primary" />} title="WhatsApp Support" value={contactWhatsapp} />
                  <ContactInfo icon={<MapPin className="text-primary" />} title="Global Headquarters" value={location} />
                </div>

                <div className="p-10 rounded-[3rem] bg-zinc-950 text-white relative overflow-hidden group border border-white/5 shadow-2xl">
                  <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-150 transition-transform duration-1000 group-hover:rotate-12">
                    <Rocket size={120} className="text-primary" />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-3xl md:text-4xl font-sans font-black tracking-tighter uppercase leading-none italic text-primary">{enterpriseTitle}</h4>
                      <p className="text-sm text-zinc-400 font-medium max-w-sm leading-relaxed">
                        {enterpriseDescription}
                      </p>
                    </div>
                    <Link href="/pricing" className="inline-flex items-center justify-center bg-primary text-primary-foreground font-arial font-black uppercase tracking-widest text-md h-14 rounded-2xl px-12 hover:scale-105 transition-all shadow-xl shadow-primary/20">
                      PRICING PLAN <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="h-full">
                <InquiryForm />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center text-center space-y-2 group hover:bg-white/10 transition-all">
      <div className="text-primary p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs font-bold text-zinc-500">{label}</div>
    </div>
  )
}

function AboutItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="p-1 bg-primary rounded-full">
        <CheckCircle2 size={12} className="text-primary-foreground" />
      </div>
      <span className="text-xs font-bold text-foreground/80">{text}</span>
    </li>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-border/50 shadow-xl shadow-zinc-200/20 dark:shadow-none hover:shadow-primary/20 hover:border-primary/40 hover:translate-y-[-10px] transition-all duration-700 group relative overflow-hidden min-h-[300px] hover:bg-primary/[0.03] dark:hover:bg-primary/[0.03]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-primary/20 transition-all duration-1000" />
      <div className="mb-8 sm:mb-10 p-5 sm:p-6 bg-primary/10 text-primary w-fit rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-[360deg] transition-all duration-700 shadow-lg shadow-primary/5 border border-primary/20">
        {icon}
      </div>
      <div className="space-y-4 relative z-10">
        <h3 className="text-xl font-bold tracking-tight text-foreground transition-all duration-500 group-hover:text-primary">{title}</h3>
        <p className="text-sm text-muted-foreground font-medium italic leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{description}</p>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
    </div>
  );
}

function Step({ icon, title, description }: { icon: string; title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 relative z-10 group">
      <div className="relative">
        <div className="absolute -inset-6 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="w-24 h-24 rounded-[2rem] bg-zinc-950 border-2 border-primary/30 flex items-center justify-center text-primary font-black text-3xl group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-2xl relative z-10">
          {icon}
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/20 backdrop-blur-sm border border-primary/40 dark:border-primary/30 flex items-center justify-center text-[10px] font-bold text-zinc-900 dark:text-primary group-hover:bg-white group-hover:text-primary transition-colors shadow-sm">
            STEP
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-sm text-muted-foreground font-medium italic leading-relaxed px-4 opacity-70 group-hover:opacity-100 transition-opacity">{description}</p>
      </div>
    </div>
  )
}

function ContactInfo({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) {
  return (
    <div className="flex items-start gap-6 group">
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/50 group-hover:bg-primary/10 transition-colors">
        {icon}
      </div>
      <div className="space-y-1">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</h5>
        <p className="text-lg font-bold tracking-tight">{value}</p>
      </div>
    </div>
  )
}

