"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MoveLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundContent() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleGoBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    if (!mounted) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center select-none relative z-10 px-4">
            
            {/* Top Status Capsule */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-6 shadow-sm"
            >
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="font-mono tracking-wider uppercase text-[11px] font-bold">
                    HTTP 404 • Resource Not Located
                </span>
            </motion.div>

            {/* BIG ROUND ANIMATION CIRCLE WITH BIG 404 */}
            <div className="relative flex items-center justify-center my-2 sm:my-4">
                
                {/* --- Big Circular Animation System --- */}

                {/* 1. Sonar Wave Ripple 1 */}
                <motion.div
                    animate={{
                        scale: [0.85, 1.35, 1.65],
                        opacity: [0.6, 0.25, 0],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 4,
                        ease: "easeOut",
                    }}
                    className="absolute w-72 h-72 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] rounded-full border-2 border-amber-500/40 pointer-events-none"
                />

                {/* 2. Sonar Wave Ripple 2 (Staggered) */}
                <motion.div
                    animate={{
                        scale: [0.85, 1.35, 1.65],
                        opacity: [0.6, 0.25, 0],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 4,
                        delay: 2,
                        ease: "easeOut",
                    }}
                    className="absolute w-72 h-72 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] rounded-full border-2 border-amber-500/30 pointer-events-none"
                />

                {/* 3. Outer Rotating Dashed Orbital Ring with Glowing Cardinal Nodes */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
                    className="absolute w-80 h-80 sm:w-[26rem] sm:h-[26rem] md:w-[31rem] md:h-[31rem] rounded-full border-2 border-dashed border-amber-500/35 dark:border-amber-400/30 pointer-events-none"
                >
                    {/* Cardinal Nodes */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.9)] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.9)] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.9)] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.9)] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                </motion.div>

                {/* 4. Counter-Rotating Inner Tech Circle with Satellites */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                    className="absolute w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border border-amber-500/25 dark:border-amber-400/20 pointer-events-none"
                >
                    <div className="absolute top-4 right-8 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                    <div className="absolute bottom-4 left-8 w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                </motion.div>

                {/* 5. Glowing Center Radial Aura */}
                <div 
                    className="absolute w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-transparent blur-3xl pointer-events-none"
                    aria-hidden="true" 
                />

                {/* 6. The Big Central Frosted Circle Dish Framing the Big 404 */}
                <motion.div
                    animate={{ y: [-6, 6, -6] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full bg-card/85 dark:bg-card/50 backdrop-blur-xl border-2 border-amber-500/30 dark:border-amber-500/20 shadow-2xl shadow-amber-500/10 flex flex-col items-center justify-center p-6 will-change-transform z-10"
                >
                    {/* Rotating Radar Sweep Cone inside the Dish */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        className="absolute inset-0 rounded-full pointer-events-none opacity-40 dark:opacity-30 [background:conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(245,158,11,0.35)_360deg)]"
                    />

                    {/* Concentric subtle target lines */}
                    <div className="absolute inset-6 rounded-full border border-dashed border-border/70 pointer-events-none" />
                    <div className="absolute inset-14 rounded-full border border-border/40 pointer-events-none" />

                    {/* --- THE BIG 404 --- */}
                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <motion.h1
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="font-black text-7xl sm:text-8xl md:text-9xl tracking-tighter leading-none select-none bg-gradient-to-b from-foreground via-foreground to-amber-500 bg-clip-text text-transparent drop-shadow-sm"
                        >
                            404
                        </motion.h1>

                        {/* Status Chip Inside the Big Circle */}
                        <div className="mt-2 sm:mt-3 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase">
                            PAGE NOT FOUND
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Headline and Universal Explanatory Text */}
            <div className="space-y-2.5 max-w-lg mx-auto mt-4 sm:mt-6">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-[900] tracking-tight text-foreground">
                    Lost in the <span className="text-amber-500 dark:text-amber-400">Exam Hub</span>
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                    The page or resource you are looking for has been moved, expired, or doesn&apos;t exist.
                </p>
            </div>

            {/* Action Buttons: Dashboard and Previous */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-6 sm:mt-8 w-full max-w-sm mx-auto">
                <Link href="/dashboard" className="w-full sm:w-1/2">
                    <Button 
                        size="lg"
                        className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Button>
                </Link>

                <Button 
                    variant="outline" 
                    size="lg"
                    onClick={handleGoBack}
                    className="w-full sm:w-1/2 h-11 rounded-xl border-border/80 hover:bg-muted font-bold text-xs uppercase tracking-wider gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                    <MoveLeft className="w-4 h-4 text-muted-foreground" />
                    Previous
                </Button>
            </div>
        </div>
    );
}
