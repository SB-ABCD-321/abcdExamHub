"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, RefreshCw, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const setupSteps = [
    { id: 1, label: "Verifying secure credentials", delay: 0 },
    { id: 2, label: "Configuring institutional permissions", delay: 1800 },
    { id: 3, label: "Preparing personalized dashboard", delay: 3600 },
];

export default function AccountSetupLoader() {
    const router = useRouter();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [progress, setProgress] = useState(25);
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);

    // Dynamic step progression for lively feedback
    useEffect(() => {
        const t1 = setTimeout(() => {
            setCurrentStepIndex(1);
            setProgress(65);
        }, 1800);

        const t2 = setTimeout(() => {
            setCurrentStepIndex(2);
            setProgress(90);
        }, 3600);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    // Automatic polling refresh every 2.5s to seamlessly transition once user DB record is ready
    useEffect(() => {
        const pollInterval = setInterval(() => {
            router.refresh();
        }, 2500);

        return () => clearInterval(pollInterval);
    }, [router]);

    const handleManualRefresh = () => {
        setIsManualRefreshing(true);
        router.refresh();
        setTimeout(() => setIsManualRefreshing(false), 1200);
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 select-none relative">
            {/* Background ambient lighting */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-primary/15 dark:bg-primary/10 rounded-full blur-3xl animate-pulse" />
            </div>

            {/* Main Center Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl bg-card/90 dark:bg-card/70 backdrop-blur-xl border border-border/80 shadow-2xl flex flex-col items-center text-center space-y-6"
            >
                {/* Dual-ring glowing animation icon */}
                <div className="relative size-20 sm:size-24 flex items-center justify-center my-1">
                    {/* Outer smooth rotating ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-2 border-dashed border-primary/40 dark:border-primary/50"
                    />

                    {/* Fast pulsing accent ring */}
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="absolute inset-1.5 rounded-full border-2 border-t-primary border-r-transparent border-b-primary/30 border-l-transparent"
                    />

                    {/* Center Glowing Hub */}
                    <div className="size-12 sm:size-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
                        <Sparkles className="size-6 sm:size-7 text-primary animate-pulse" />
                    </div>
                </div>

                {/* Typography */}
                <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                        Setting up your account...
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                        Please hold on a moment while we configure your workspace profile and access rights.
                    </p>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden relative border border-border/50">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary/80 via-primary to-amber-400 rounded-full"
                            initial={{ width: "20%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono px-1">
                        <span>INITIALIZING</span>
                        <span>{progress}%</span>
                    </div>
                </div>

                {/* Step List Tracker */}
                <div className="w-full space-y-2 text-left pt-1 border-t border-border/40">
                    {setupSteps.map((step, idx) => {
                        const isDone = currentStepIndex > idx;
                        const isCurrent = currentStepIndex === idx;

                        return (
                            <div
                                key={step.id}
                                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                                    isCurrent
                                        ? "bg-primary/10 border border-primary/25"
                                        : isDone
                                        ? "bg-muted/30 border border-transparent"
                                        : "opacity-40 border border-transparent"
                                }`}
                            >
                                <div className="shrink-0">
                                    {isDone ? (
                                        <CheckCircle2 className="size-4 text-emerald-500" />
                                    ) : isCurrent ? (
                                        <Loader2 className="size-4 text-primary animate-spin" />
                                    ) : (
                                        <div className="size-4 rounded-full border border-border flex items-center justify-center text-[9px] font-mono text-muted-foreground">
                                            {step.id}
                                        </div>
                                    )}
                                </div>
                                <span
                                    className={`text-xs ${
                                        isCurrent
                                            ? "font-bold text-foreground"
                                            : isDone
                                            ? "font-medium text-muted-foreground line-through decoration-muted-foreground/40"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Action Controls */}
                <div className="w-full pt-1 flex flex-col sm:flex-row items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManualRefresh}
                        disabled={isManualRefreshing}
                        className="w-full h-10 rounded-xl text-xs font-semibold border-border gap-2 cursor-pointer transition-all active:scale-98"
                    >
                        <RefreshCw className={`size-3.5 ${isManualRefreshing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
                        <span>{isManualRefreshing ? "Checking Status..." : "Refresh Status"}</span>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
