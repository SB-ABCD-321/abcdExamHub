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

            {/* Floating 404 Text */}
            <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex flex-col items-center justify-center my-4 sm:my-8 will-change-transform"
            >
                {/* Soft ambient aura for contrast */}
                <div
                    className="absolute w-80 sm:w-[30rem] h-36 sm:h-52 bg-amber-500/20 dark:bg-amber-500/15 blur-3xl pointer-events-none -z-10"
                    aria-hidden="true"
                />

                <motion.h1
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="font-black text-8xl sm:text-9xl md:text-[11rem] lg:text-[13rem] xl:text-[14rem] tracking-tighter leading-none select-none bg-gradient-to-b from-foreground via-foreground to-amber-500 bg-clip-text text-transparent drop-shadow-md"
                >
                    404
                </motion.h1>

                <div className="mt-1 sm:mt-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-mono font-bold tracking-widest uppercase shadow-sm">
                    PAGE NOT FOUND
                </div>
            </motion.div>

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
