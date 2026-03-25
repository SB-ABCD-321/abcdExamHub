"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Bot, Sparkles, Zap, Users, GraduationCap, FileText, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPricingPlans, getPricingSettings } from "@/actions/pricing";

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

export default function PricingContent() {
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [settings, setSettings] = useState({ pricingTitle: "", pricingSubtitle: "" });
    const [loading, setLoading] = useState(true);
    const [duration, setDuration] = useState<"1M" | "6M" | "12M">("1M");
    const [aiQuery, setAiQuery] = useState("");
    const [recommendation, setRecommendation] = useState<{ plan: string, reason: string } | null>(null);

    const displayPlans = plans;
    const standardPlans = displayPlans.filter(p => !p.isCustom);
    const customPlan = displayPlans.find(p => p.isCustom);

    useEffect(() => {
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
    }, []);

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
        <div className="flex-1">
            {/* Header */}
            <section className="py-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/5 blur-[120px] rounded-full z-0" />
                <div className="container mx-auto max-w-7xl text-center space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md my-2">
                        <Zap className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Transparent SaaS Pricing
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1]">
                        {(settings.pricingTitle || "Invest in Academic Excellence").split(" ").slice(0, -2).join(" ")} <br />
                        <span className="text-primary italic">{(settings.pricingTitle || "Academic Excellence").split(" ").slice(-2).join(" ")}</span>
                    </h1>
                    <p className="text-xl text-muted-foreground font-medium italic max-w-2xl mx-auto leading-relaxed">
                        {settings.pricingSubtitle}
                    </p>

                    <div className="pt-10 flex justify-center">
                        <div className="flex bg-muted p-1.5 rounded-full w-full max-w-md shadow-inner border">
                            <button
                                onClick={() => setDuration("1M")}
                                className={cn("flex-1 py-2.5 text-sm font-bold rounded-full transition-all tracking-wide", duration === "1M" ? "bg-background shadow-md text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                                1 Month
                            </button>
                            <button
                                onClick={() => setDuration("6M")}
                                className={cn("flex-1 py-2.5 text-sm font-bold rounded-full transition-all tracking-wide", duration === "6M" ? "bg-background shadow-md text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                                6 Months
                            </button>
                            <button
                                onClick={() => setDuration("12M")}
                                className={cn("flex-1 py-2.5 text-sm font-bold rounded-full transition-all tracking-wide", duration === "12M" ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground")}
                            >
                                12 Months
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Grid */}
            <section className="py-20 px-6">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className={cn(
                        "grid gap-8 items-start",
                        standardPlans.length === 4 ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
                    )}>
                        {standardPlans.map((plan) => {
                            const metrics = getMetrics(plan);

                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "p-10 rounded-[3rem] border transition-all duration-500 relative flex flex-col items-start group min-h-[600px]",
                                        plan.isPopular
                                            ? "bg-zinc-900 border-primary shadow-2xl shadow-primary/10 text-white xl:scale-105 z-10"
                                            : "bg-white dark:bg-zinc-900/50 border-border/50 hover:border-primary/50"
                                    )}
                                >
                                    {plan.isPopular && (
                                        <div className="absolute top-0 right-10 -translate-y-1/2 bg-primary text-primary-foreground px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                            Most Popular
                                        </div>
                                    )}

                                    <h3 className={cn("text-sm font-black uppercase tracking-[0.2em] mb-3", plan.isPopular ? "text-primary" : "text-muted-foreground")}>
                                        {plan.name}
                                    </h3>
                                    <p className="text-sm font-medium opacity-60 mb-6 leading-relaxed h-10">{plan.description}</p>

                                    <div className="flex flex-col items-start gap-1 mb-10 h-24 justify-center w-full border-b border-border/20 pb-8">
                                        {!plan.isCustom ? (
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-black italic tracking-tighter">
                                                    ₹{metrics?.price}
                                                </span>
                                                <span className="text-xs font-bold opacity-50 uppercase tracking-widest">
                                                    / {duration === "1M" ? "Mo" : duration === "6M" ? "6 Mo" : "Yr"}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black tracking-tight">Custom</span>
                                            </div>
                                        )}
                                    </div>

                                    <ul className="space-y-5 mb-12 flex-1 w-full">
                                        {metrics && (
                                            <>
                                                <li className="flex items-center gap-4">
                                                    <div className={cn("p-2 rounded-lg", plan.isPopular ? "bg-white/10" : "bg-primary/10")}>
                                                        <Users className={cn("w-4 h-4", plan.isPopular ? "text-white" : "text-primary")} />
                                                    </div>
                                                    <span className="text-sm font-bold opacity-90"><strong>{metrics.students}</strong> Students</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className={cn("p-2 rounded-lg", plan.isPopular ? "bg-white/10" : "bg-primary/10")}>
                                                        <GraduationCap className={cn("w-4 h-4", plan.isPopular ? "text-white" : "text-primary")} />
                                                    </div>
                                                    <span className="text-sm font-bold opacity-90"><strong>{metrics.teachers}</strong> Teachers</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className={cn("p-2 rounded-lg", plan.isPopular ? "bg-white/10" : "bg-primary/10")}>
                                                        <FileText className={cn("w-4 h-4", plan.isPopular ? "text-white" : "text-primary")} />
                                                    </div>
                                                    <span className="text-sm font-bold opacity-90"><strong>{metrics.exams}</strong> Exams / Mo</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className={cn("p-2 rounded-lg", plan.isPopular ? "bg-white/10" : "bg-primary/10")}>
                                                        <BrainCircuit className={cn("w-4 h-4", plan.isPopular ? "text-white" : "text-primary")} />
                                                    </div>
                                                    <span className="text-sm font-bold opacity-90"><strong>{metrics.ai}</strong> AI Credits / Mo</span>
                                                </li>
                                                <div className="h-px w-full bg-border/20 my-4" />
                                            </>
                                        )}

                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-4">
                                                <CheckCircle2 className={cn("w-4 h-4", plan.isPopular ? "text-primary" : "text-primary/70")} />
                                                <span className="text-xs font-bold uppercase tracking-widest opacity-70">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        suppressHydrationWarning
                                        asChild
                                        className={cn(
                                            "w-full h-14 rounded-2xl text-sm font-bold transition-all active:scale-95 cursor-pointer mt-auto tracking-widest uppercase",
                                            plan.isPopular
                                                ? "bg-primary text-primary-foreground hover:bg-white hover:text-zinc-900 shadow-xl shadow-primary/20"
                                                : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-900 hover:bg-primary hover:text-primary-foreground"
                                        )}
                                    >
                                        <a href={plan.buttonLink || "/support"}>
                                            {plan.buttonText} <ArrowRight className="ml-2 w-4 h-4" />
                                        </a>
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    {customPlan && (
                        <div className="mt-16 w-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[3rem] p-10 md:p-16 flex flex-col xl:flex-row items-center justify-between gap-10 shadow-xl overflow-hidden relative group border border-border/50">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-125 transition-transform duration-1000">
                                <Sparkles className="w-64 h-64" />
                            </div>
                            <div className="flex-1 space-y-4 relative z-10 text-center xl:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 dark:bg-black/10 border border-white/20 dark:border-black/20 backdrop-blur-md mb-4">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Enterprise Only</span>
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black tracking-tighter">
                                    {customPlan.name}
                                </h3>
                                <p className="text-base opacity-80 max-w-2xl font-medium italic">
                                    {customPlan.description}
                                </p>
                                <ul className="flex flex-wrap items-center justify-center xl:justify-start gap-3 pt-6">
                                    {customPlan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 bg-white/5 dark:bg-black/5 px-4 py-2 rounded-full border border-white/10 dark:border-black/10">
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-bold uppercase tracking-widest">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="relative z-10 w-full xl:w-auto flex shrink-0 justify-center">
                                <Button asChild className="h-16 px-12 rounded-full text-sm font-black tracking-widest uppercase bg-primary text-primary-foreground hover:bg-white hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white transition-all shadow-xl hover:scale-105">
                                    <a href={customPlan.buttonLink || "/support"}>
                                        {customPlan.buttonText} <ArrowRight className="ml-3 w-5 h-5" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* AI Plan Recommender */}
            <section className="py-32 px-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="bg-zinc-100 dark:bg-zinc-900/80 rounded-[4rem] p-12 md:p-20 border border-border/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-125 transition-transform duration-1000">
                            <Bot size={200} />
                        </div>

                        <div className="relative z-10 space-y-12">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 text-primary">
                                    <Sparkles className="w-5 h-5" />
                                    <span className="text-xs font-bold">AI Consultant Beta</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                                    Unsure which mission <br />
                                    <span className="text-primary">fits your goals?</span>
                                </h2>
                                <p className="text-muted-foreground italic font-medium">Describe your institution or project needs, and our AI will recommend the optimal resource tier.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <input
                                    suppressHydrationWarning
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    type="text"
                                    placeholder="e.g. 'I run a school with 200 students...'"
                                    className="w-full bg-white dark:bg-zinc-950 border border-border/70 rounded-3xl h-16 px-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                                <Button
                                    onClick={getAiRecommendation}
                                    disabled={!aiQuery}
                                    suppressHydrationWarning
                                    className="w-full sm:w-auto h-16 px-10 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-black uppercase tracking-widest text-[10px] rounded-3xl group"
                                >
                                    Ask AI Consultant <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>

                            {recommendation && (
                                <div className="p-8 rounded-3xl bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-primary rounded-xl text-primary-foreground">
                                            <Zap size={20} />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-black uppercase tracking-tight">Recommendation: {recommendation.plan}</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed italic">{recommendation.reason}</p>
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
