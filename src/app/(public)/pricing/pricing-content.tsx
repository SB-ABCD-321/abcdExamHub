"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Bot, Sparkles, Zap, Users, GraduationCap, FileText, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPricingPlans, getPricingSettings } from "@/actions/pricing";
import TypingText from "@/components/shared/TypingText";

interface PricingPlan {
    id: string;
    name: string;
    description: string | null;
    price1Month: number;
    price6Month: number;
    price12Month: number;
    maxStudents1Month: number;
    maxStudents6Month: number;
    maxStudents12Month: number;
    maxTeachers1Month: number;
    maxTeachers6Month: number;
    maxTeachers12Month: number;
    maxExams1Month: number;
    maxExams6Month: number;
    maxExams12Month: number;
    aiLimit1Month: number;
    aiLimit6Month: number;
    aiLimit12Month: number;
    features: string[];
    isPopular: boolean;
    isCustom: boolean;
    buttonText: string;
    buttonLink: string | null;
}

export default function PricingContent({
    initialPlans = [],
    initialSettings = {}
}: {
    initialPlans?: PricingPlan[];
    initialSettings?: any;
}) {
    const [plans, setPlans] = useState<PricingPlan[]>(initialPlans);
    const [settings, setSettings] = useState<any>(initialSettings);
    const [loading, setLoading] = useState(initialPlans.length === 0);
    const [duration, setDuration] = useState<"1M" | "6M" | "12M">("1M");
    const [aiQuery, setAiQuery] = useState("");
    const [recommendation, setRecommendation] = useState<{ plan: string, reason: string } | null>(null);

    const displayPlans = plans;
    const standardPlans = displayPlans.filter(p => !p.isCustom);
    const customPlan = displayPlans.find(p => p.isCustom);

    useEffect(() => {
        if (initialPlans.length > 0) return;
        const fetchData = async () => {
            try {
                const [fetchedPlans, fetchedSettings] = await Promise.all([
                    getPricingPlans(),
                    getPricingSettings()
                ]);
                // @ts-ignore
                setPlans(fetchedPlans);
                setSettings(fetchedSettings);
            } catch (error) {
                console.error("Failed to fetch pricing data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [initialPlans]);

    const getAiRecommendation = () => {
        if (!aiQuery) return;
        setLoading(true);
        setTimeout(() => {
            const query = aiQuery.toLowerCase();
            const recommended = displayPlans.find(p =>
                query.includes(p.name.toLowerCase()) ||
                (p.isPopular && query.includes("recommend"))
            ) || displayPlans[0];

            if (recommended) {
                setRecommendation({
                    plan: recommended.name,
                    reason: `Based on your query, the ${recommended.name} tier best aligns with your stated objectives.`
                });
            }
            setLoading(false);
        }, 1000);
    };

    const getMetrics = (plan: PricingPlan) => {
        if (plan.isCustom) return null;
        switch (duration) {
            case "1M": return { price: plan.price1Month, students: plan.maxStudents1Month, teachers: plan.maxTeachers1Month, exams: plan.maxExams1Month, ai: plan.aiLimit1Month };
            case "6M": return { price: plan.price6Month, students: plan.maxStudents6Month, teachers: plan.maxTeachers6Month, exams: plan.maxExams6Month, ai: plan.aiLimit6Month };
            case "12M": return { price: plan.price12Month, students: plan.maxStudents12Month, teachers: plan.maxTeachers12Month, exams: plan.maxExams12Month, ai: plan.aiLimit12Month };
        }
    };

    return (
        <div className="flex-1 w-full">
            {/* Header — consistent typing title in one line, description in strictly two lines, no buttons */}
            <section className="relative pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 overflow-hidden bg-background border-b border-border/50 transition-colors">
                <div className="container mx-auto max-w-4xl text-center space-y-3.5 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                        <Zap className="size-3.5 text-primary animate-pulse" />
                        <span className="text-[11px] font-semibold text-primary">
                            {settings.pricingBadge || "Transparent plans"}
                        </span>
                    </div>

                    {/* Single-line Typing Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto text-foreground">
                        <span>Transparent </span>
                        <span className="text-primary">
                            <TypingText
                                texts={["Academic Plans", "Exam Pricing", "Institution Tiers", "Growth Packages"]}
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
                        Predictable, scalable plans designed for tutoring academies, schools, and colleges.
                        <br className="hidden sm:inline" />
                        Choose the ideal tier with dedicated AI question credits, proctoring, and seat limits.
                    </p>
                </div>
            </section>

            {/* Free Plan Highlight */}
            <section className="py-8 sm:py-10 px-4 sm:px-6">
                <div className="container mx-auto max-w-5xl group">
                    <div className="bg-card text-card-foreground rounded-2xl p-5 sm:p-6 md:p-7 border border-border/60 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1 space-y-3 relative z-10 w-full">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary">
                                <Sparkles className="size-3" />
                                <span className="text-[10px] font-semibold">Free explorer pass</span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                {settings.pricingPromoTitle || "Catalyst Explorer Pass"}
                            </h3>
                            <p className="text-muted-foreground text-xs sm:text-sm max-w-lg leading-relaxed border-l-2 border-primary/50 pl-3">
                                {settings.pricingPromoDescription || "Unlock 30 days of standard workspace power at zero cost. Experience absolute control over your digital assessments."}
                            </p>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 mt-3 border-t border-border/40 w-full">
                                {[
                                    { icon: Users, label: "Students", val: (settings as any).freeMaxStudents || 50, color: "text-blue-500" },
                                    { icon: GraduationCap, label: "Teachers", val: (settings as any).freeMaxTeachers || 1, color: "text-emerald-500" },
                                    { icon: FileText, label: "Exams", val: (settings as any).freeMaxExams || 3, color: "text-purple-500" },
                                    { icon: BrainCircuit, label: "AI Credits", val: (settings as any).freeAiLimit || 3, color: "text-primary" }
                                ].map((stat, i) => (
                                    <div key={i} className="flex flex-col gap-1 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                        <stat.icon className={cn("size-3.5", stat.color)} />
                                        <div>
                                            <div className="text-base font-bold tracking-tight text-foreground">{stat.val}</div>
                                            <div className="text-[9px] font-medium text-muted-foreground">{stat.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Price Action Block */}
                        <div className="relative z-10 p-5 rounded-xl bg-muted/40 border border-border/60 w-full md:w-[220px] shrink-0 flex flex-col items-center justify-center text-center">
                            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-0.5">₹0</div>
                            <div className="text-[10px] font-semibold text-primary mb-3">First Month Free</div>

                            <Button asChild size="sm" className="w-full h-9 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                                <a href={`/pricing/request?plan=FREE&duration=1M`} className="flex items-center justify-center gap-1.5">
                                    <span>Activate now</span>
                                    <ArrowRight className="size-3.5" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Duration Toggle */}
            <div className="flex justify-center pb-8 sm:pb-10 relative z-10 px-4">
                <div className="flex bg-muted/70 p-1 rounded-xl w-full max-w-xs sm:max-w-sm border border-border/60 shadow-xs">
                    <button
                        onClick={() => setDuration("1M")}
                        className={cn("flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all", duration === "1M" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                        1 Month
                    </button>
                    <button
                        onClick={() => setDuration("6M")}
                        className={cn("flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all", duration === "6M" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                        6 Months
                    </button>
                    <button
                        onClick={() => setDuration("12M")}
                        className={cn("flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all", duration === "12M" ? "bg-background shadow-xs text-primary font-bold" : "text-muted-foreground hover:text-foreground")}
                    >
                        12 Months <span className="text-[10px] text-primary/80 hidden sm:inline font-bold">(-20%)</span>
                    </button>
                </div>
            </div>

            {/* Pricing Grid */}
            <section className="pb-10 sm:pb-12 md:pb-14 px-4 sm:px-6">
                <div className="container mx-auto max-w-7xl">
                    <div className={cn(
                        "grid gap-5 items-stretch",
                        standardPlans.length === 4 ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
                    )}>
                        {standardPlans.map((plan) => {
                            const metrics = getMetrics(plan);

                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "p-5 sm:p-6 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between group",
                                        plan.isPopular
                                            ? "bg-card border-primary/50 shadow-md shadow-primary/5 relative ring-1 ring-primary/20"
                                            : "bg-card border-border/60 hover:border-primary/40 shadow-xs hover:shadow-sm"
                                    )}
                                >
                                    {plan.isPopular && (
                                        <div className="absolute top-0 right-5 -translate-y-1/2 bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                                            Most popular
                                        </div>
                                    )}

                                    <div>
                                        <h3 className={cn("text-sm font-bold mb-1.5", plan.isPopular ? "text-primary" : "text-foreground")}>
                                            {plan.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">{plan.description}</p>

                                        <div className="flex flex-col items-start gap-1 mb-5 border-b border-border/40 pb-4">
                                            {!plan.isCustom ? (
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-3xl font-extrabold tracking-tight text-foreground">
                                                        ₹{metrics?.price}
                                                    </span>
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        / {duration === "1M" ? "mo" : duration === "6M" ? "6 mo" : "yr"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-baseline">
                                                    <span className="text-2xl font-extrabold tracking-tight">Custom</span>
                                                </div>
                                            )}
                                        </div>

                                        <ul className="space-y-2.5 mb-5 w-full text-xs">
                                            {metrics && (
                                                <>
                                                    <li className="flex items-center gap-2">
                                                        <div className="size-5 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                                            <Users className="size-3" />
                                                        </div>
                                                        <span className="text-foreground"><strong className="font-semibold">{metrics.students}</strong> Students</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="size-5 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                                            <GraduationCap className="size-3" />
                                                        </div>
                                                        <span className="text-foreground"><strong className="font-semibold">{metrics.teachers}</strong> Teachers</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="size-5 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                                            <FileText className="size-3" />
                                                        </div>
                                                        <span className="text-foreground"><strong className="font-semibold">{metrics.exams}</strong> Exams / mo</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="size-5 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                                            <BrainCircuit className="size-3" />
                                                        </div>
                                                        <span className="text-foreground"><strong className="font-semibold">{metrics.ai}</strong> AI Credits</span>
                                                    </li>
                                                    <div className="h-px w-full bg-border/40 my-1.5" />
                                                </>
                                            )}

                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                                                    <span className="text-muted-foreground">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <Button
                                        suppressHydrationWarning
                                        asChild
                                        size="sm"
                                        className={cn(
                                            "w-full h-9 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer mt-2",
                                            plan.isPopular
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50"
                                        )}
                                    >
                                        <a href={`/pricing/request?plan=${encodeURIComponent(plan.name)}&duration=${duration}`}>
                                            {plan.buttonText} <ArrowRight className="ml-1.5 size-3.5" />
                                        </a>
                                    </Button>

                                </div>
                            );
                        })}
                    </div>

                    {customPlan && (
                        <div className="mt-8 sm:mt-10 w-full bg-card text-card-foreground rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs border border-border/60">
                            <div className="flex-1 space-y-2.5 text-center md:text-left">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                    <Sparkles className="size-3" />
                                    <span className="text-[10px] font-semibold">Enterprise custom tier</span>
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    {customPlan.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                                    {customPlan.description}
                                </p>
                                <ul className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                                    {customPlan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-1.5 bg-muted/60 px-3 py-1 rounded-lg border border-border/50 text-xs font-medium text-foreground">
                                            <CheckCircle2 className="size-3 text-emerald-500" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="shrink-0 w-full md:w-auto">
                                <Button asChild size="sm" className="w-full md:w-auto h-10 px-6 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                                    <a href={customPlan.buttonLink || "/support"}>
                                        {customPlan.buttonText} <ArrowRight className="ml-1.5 size-3.5" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* AI Plan Recommender */}
            <section className="pb-10 sm:pb-12 md:pb-14 px-4 sm:px-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border/60 shadow-xs relative overflow-hidden">
                        <div className="relative z-10 space-y-5">
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                    <Bot className="size-3" />
                                    <span className="text-[10px] font-semibold">{settings.aiConsultantBadge || "AI plan consultant"}</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    Unsure which tier fits your institution?
                                </h2>
                                <p className="text-xs sm:text-sm text-muted-foreground">Describe your students count, exam frequency, or requirements, and AI will suggest the best fit.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                                <input
                                    suppressHydrationWarning
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    type="text"
                                    placeholder="e.g. 'We are an academy with 300 students running bi-weekly quizzes...'"
                                    className="w-full bg-background border border-border/70 rounded-xl h-10 px-4 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-normal"
                                />
                                <Button
                                    onClick={getAiRecommendation}
                                    disabled={!aiQuery}
                                    suppressHydrationWarning
                                    className="w-full sm:w-auto h-10 px-5 text-xs font-semibold rounded-xl shrink-0"
                                >
                                    Ask consultant <ArrowRight className="ml-1.5 size-3.5" />
                                </Button>
                            </div>

                            {recommendation && (
                                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in duration-300">
                                    <div className="flex items-start gap-3">
                                        <div className="size-8 bg-primary rounded-lg text-primary-foreground flex items-center justify-center shrink-0">
                                            <Zap className="size-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-foreground">Suggested Plan: {recommendation.plan}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{recommendation.reason}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
