"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Bot, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { getPricingPlans, getPricingSettings } from "@/actions/pricing";

interface PricingPlan {
    id: string;
    name: string;
    description: string | null;
    priceMonthly: number;
    priceYearly: number;
    offerMonthly: string | null;
    offerYearly: string | null;
    features: string[];
    isPopular: boolean;
    buttonText: string;
    buttonLink: string | null;
}

export default function PricingContent() {
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [settings, setSettings] = useState({ pricingTitle: "", pricingSubtitle: "" });
    const [loading, setLoading] = useState(true);
    const [isYearly, setIsYearly] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [recommendation, setRecommendation] = useState<{ plan: string, reason: string } | null>(null);

    const defaultPlans: PricingPlan[] = [
        {
            id: "default-individual",
            name: "Individual Plan",
            description: "Perfect for solo learners and independent researchers.",
            priceMonthly: 999,
            priceYearly: 9990,
            offerMonthly: null,
            offerYearly: "2 Months Free",
            features: [
                "10 Exams per Month",
                "Basic AI Support",
                "Detailed Performance Reports",
                "Mobile App Access"
            ],
            isPopular: false,
            buttonText: "Start Learning",
            buttonLink: "/support"
        },
        {
            id: "default-team",
            name: "Team Plan",
            description: "Collaborative tools for small groups and departments.",
            priceMonthly: 4999,
            priceYearly: 49990,
            offerMonthly: "Save 15% on Setup",
            offerYearly: "Best Value",
            features: [
                "Up to 10 Users",
                "Unlimited Exams",
                "Team Collaboration Tools",
                "Advanced AI Proctoring",
                "Priority Email Support"
            ],
            isPopular: true,
            buttonText: "Get Started Now",
            buttonLink: "/support"
        },
        {
            id: "default-institute",
            name: "Institute Plan",
            description: "Complete digital ecosystem for large institutions.",
            priceMonthly: 14999,
            priceYearly: 149990,
            offerMonthly: "Custom Implementation",
            offerYearly: "Enterprise Grade",
            features: [
                "Unlimited Users",
                "Custom Whitelabeling",
                "Full API Access",
                "Dedicated Account Manager",
                "24/7 Phone Support"
            ],
            isPopular: false,
            buttonText: "Contact Sales",
            buttonLink: "/support"
        }
    ];

    const displayPlans = plans.length > 0 ? plans : defaultPlans;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedPlans, fetchedSettings] = await Promise.all([
                    getPricingPlans(),
                    getPricingSettings()
                ]);
                setPlans(fetchedPlans as any);
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

                    <div className="flex items-center justify-center gap-4 pt-10">
                        <span className={cn("text-sm font-bold transition-colors", !isYearly ? "text-primary" : "text-muted-foreground")}>Monthly</span>
                        <Switch
                            checked={isYearly}
                            onCheckedChange={setIsYearly}
                            className="data-[state=checked]:bg-primary"
                        />
                        <span className={cn("text-sm font-bold transition-colors", isYearly ? "text-primary" : "text-muted-foreground")}>Yearly</span>
                        <span className="ml-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm animate-bounce">
                            Save up to 20%
                        </span>
                    </div>
                </div>
            </section>

            {/* Pricing Grid */}
            <section className="py-20 px-6">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className={cn(
                        "grid gap-8",
                        displayPlans.length === 4 ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
                    )}>
                        {displayPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={cn(
                                    "p-12 rounded-[3rem] border transition-all duration-500 relative flex flex-col items-start group",
                                    plan.isPopular
                                        ? "bg-zinc-900 border-primary shadow-2xl shadow-primary/10 text-white scale-105 z-10"
                                        : "bg-white dark:bg-zinc-900/50 border-border/50 hover:border-primary/50"
                                )}
                            >
                                {plan.isPopular && (
                                    <div className="absolute top-0 right-12 -translate-y-1/2 bg-primary text-primary-foreground px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                        Most Popular Choice
                                    </div>
                                )}

                                <h3 className={cn("text-xs font-black uppercase tracking-[0.3em] mb-4", plan.isPopular ? "text-primary" : "text-muted-foreground")}>
                                    {plan.name}
                                </h3>

                                <div className="flex flex-col items-start gap-1 mb-10">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black italic tracking-tighter">
                                            ₹{isYearly ? plan.priceYearly : plan.priceMonthly}
                                        </span>
                                        <span className="text-xs font-bold opacity-50 uppercase tracking-widest">
                                            / {isYearly ? "Year" : "Month"}
                                        </span>
                                    </div>
                                    {(isYearly ? plan.offerYearly : plan.offerMonthly) && (
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                                            {isYearly ? plan.offerYearly : plan.offerMonthly}
                                        </span>
                                    )}
                                </div>

                                <ul className="space-y-4 mb-12 flex-1 w-full">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <CheckCircle2 className={cn("w-4 h-4", plan.isPopular ? "text-primary" : "text-primary/50")} />
                                            <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    suppressHydrationWarning
                                    asChild
                                    className={cn(
                                        "w-full h-16 rounded-2xl text-sm font-bold transition-all active:scale-95 cursor-pointer",
                                        plan.isPopular
                                            ? "bg-primary text-primary-foreground hover:bg-white hover:text-zinc-900"
                                            : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-900 hover:bg-primary hover:text-primary-foreground"
                                    )}
                                >
                                    <a href={plan.buttonLink || "/support"}>
                                        {plan.buttonText} <ArrowRight className="ml-2 w-4 h-4" />
                                    </a>
                                </Button>
                            </div>
                        ))}
                    </div>
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
