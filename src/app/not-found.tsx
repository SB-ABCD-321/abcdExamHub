"use client";

import Link from "next/link";
import { MoveLeft, HelpCircle, Home, LayoutDashboard, LifeBuoy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function NotFound() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6 md:p-12 overflow-hidden relative selection:bg-primary/30">
            {/* Advanced Background System */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 dark:bg-zinc-800/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
                
                {/* Modern Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="relative z-10 max-w-4xl w-full flex flex-col items-center">
                {/* Large Background 404 Text */}
                <div className="absolute -top-32 md:-top-48 left-1/2 -translate-x-1/2 select-none pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
                    <h1 className="text-[20rem] md:text-[35rem] font-black tracking-tighter leading-none animate-pulse">
                        404
                    </h1>
                </div>

                <div className="w-full text-center space-y-12 backdrop-blur-sm p-8 rounded-[3rem]">
                    {/* Error Badge */}
                    <div className="mx-auto w-fit px-5 py-2 rounded-full bg-white dark:bg-zinc-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-zinc-800 flex items-center gap-3 animate-bounce">
                        <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-zinc-400">Error Discovery</span>
                    </div>

                    <div className="space-y-4 relative">
                        <h2 className="text-4xl md:text-7xl font-[950] tracking-tighter text-slate-900 dark:text-white leading-[0.9]">
                            Lost in <span className="text-primary italic">Intelligence.</span>
                        </h2>
                        <p className="text-lg md:text-2xl text-slate-500 dark:text-zinc-400 font-medium max-w-xl mx-auto leading-relaxed">
                            The requested page has been disconnected from the assessment core. Let's get you back on track.
                        </p>
                    </div>

                    {/* Three-Button Navigation Suite */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mx-auto mt-12">
                        {/* Dashboard - Primary */}
                        <Link href="/dashboard" className="w-full">
                            <Button className="w-full h-20 md:h-24 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-[2rem] shadow-2xl flex flex-col items-center justify-center gap-1 group overflow-hidden relative">
                                <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                                <LayoutDashboard className="w-6 h-6 mb-1 group-hover:rotate-12 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
                                <span className="text-[10px] opacity-60 font-medium lowercase">Resume Work</span>
                            </Button>
                        </Link>

                        {/* Home - Secondary */}
                        <Link href="/" className="w-full">
                            <Button variant="outline" className="w-full h-20 md:h-24 px-6 bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-900 dark:text-white hover:scale-[1.02] active:scale-[0.98] transition-all rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-1 group">
                                <Home className="w-6 h-6 mb-1 group-hover:-translate-y-1 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-widest">Return Home</span>
                                <span className="text-[10px] opacity-60 font-medium lowercase">Back to Landing</span>
                            </Button>
                        </Link>

                        {/* Support - Specialized */}
                        <Link href="/guide" className="w-full">
                            <Button variant="ghost" className="w-full h-20 md:h-24 px-6 border-2 border-dashed border-primary/20 hover:border-primary text-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-[2rem] flex flex-col items-center justify-center gap-1 group">
                                <LifeBuoy className="w-6 h-6 mb-1 group-hover:rotate-90 transition-transform duration-700" />
                                <span className="text-xs font-black uppercase tracking-widest tracking-widest">Get Support</span>
                                <span className="text-[10px] opacity-60 font-medium lowercase">Official Guides</span>
                            </Button>
                        </Link>
                    </div>

                    {/* Minimal Branding Footer */}
                    <div className="pt-12 flex items-center justify-center gap-4 text-slate-400 dark:text-zinc-600">
                        <div className="h-[1px] w-8 bg-current opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                            System Secured • ABCD Intelligence
                        </p>
                        <div className="h-[1px] w-8 bg-current opacity-20" />
                    </div>
                </div>
            </div>
        </div>
    );
}
