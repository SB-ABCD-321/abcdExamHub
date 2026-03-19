"use client";

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpCircle, Info, ChevronRight, BookOpen, MessageCircle } from "lucide-react";

interface GuideItem {
    id: string;
    title: string;
    description: string;
    order: number;
}

interface GuidePageProps {
    title: string;
    description: string;
    icon?: string;
    items: GuideItem[];
    whatsapp?: string; // Dynamic WhatsApp contact
}

export const IconLoader = ({ name, className }: { name?: string; className?: string }) => {
    // @ts-ignore
    const Icon = name && Icons[name as keyof typeof Icons] ? Icons[name as keyof typeof Icons] : Icons.BookOpen;
    // @ts-ignore
    return <Icon className={className} />;
};

export function GuidePage({ title, description, items, whatsapp }: GuidePageProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="h-[600px] w-full bg-slate-100/50 dark:bg-zinc-800/20 animate-pulse rounded-3xl" />;
    }

    const handleWhatsAppClick = () => {
        if (!whatsapp) return;
        const cleanNumber = whatsapp.replace(/\D/g, "");
        window.open(`https://wa.me/${cleanNumber}`, "_blank");
    };

    return (
        <div className="space-y-8 pb-24 max-w-6xl mx-auto">
            {/* Standard Dashboard Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {(() => {
                        const words = title.split(" ");
                        const lastWord = words.pop();
                        return (
                            <>
                                {words.join(" ")} <span className="text-primary">{lastWord}</span>
                            </>
                        );
                    })()}
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    {description}
                </p>
            </div>

            {/* Advanced Accordion Items */}
            <div className="space-y-6">
                {items.sort((a,b) => a.order - b.order).map((item, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <div 
                            key={item.id || idx}
                            className={cn(
                                "group rounded-[2rem] transition-all duration-500 relative",
                                isOpen 
                                    ? "bg-white dark:bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-slate-200/50 dark:ring-zinc-800" 
                                    : "bg-slate-50/40 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900/60 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800"
                            )}
                        >
                            {/* Accent Glow */}
                            {isOpen && (
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-[2rem] pointer-events-none" />
                            )}

                            <button
                                onClick={() => setOpenIndex(isOpen ? null : idx)}
                                className="w-full text-left px-8 py-7 flex items-center justify-between z-10 relative"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500",
                                        isOpen 
                                            ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30 rotate-3" 
                                            : "bg-white dark:bg-zinc-800 text-slate-400 shadow-sm group-hover:bg-primary/10 group-hover:text-primary group-hover:rotate-0"
                                    )}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className={cn(
                                            "text-xl md:text-2xl font-bold tracking-tight transition-all duration-500",
                                            isOpen ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                                        )}>
                                            {item.title}
                                        </h3>
                                        {!isOpen && (
                                            <span className="text-xs font-bold text-slate-400/60 mt-0.5 tracking-wide">Click to expand details</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                                    isOpen 
                                        ? "bg-primary/10 text-primary rotate-90" 
                                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400 rotate-0"
                                )}>
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </button>

                            <div className={cn(
                                "grid transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                            )}>
                                <div className="overflow-hidden">
                                    <div className="px-8 pb-10 pt-2 ml-[4.5rem] border-l-2 border-primary/10 relative">
                                        <div className="absolute top-0 -left-[5px] w-2 h-2 rounded-full bg-primary" />
                                        
                                        <div className="prose prose-slate dark:prose-invert max-w-none">
                                            <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed text-lg whitespace-pre-wrap">
                                                {item.description}
                                            </p>
                                        </div>

                                        <div className="mt-8 flex items-center gap-4 py-3 px-4 rounded-xl bg-primary/5 border border-primary/10 w-fit">
                                            <BookOpen className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-bold text-primary tracking-wide">Official Institution Guide</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {items.length === 0 && (
                    <div className="py-32 text-center rounded-[3rem] bg-slate-50/50 dark:bg-zinc-900/20 border-2 border-dashed border-slate-200/60 flex flex-col items-center justify-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center animate-bounce">
                            <Info className="w-10 h-10 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-500 font-black text-2xl tracking-tight italic">Knowledge Base Empty</p>
                            <p className="text-slate-400 font-medium">No documentation items have been published yet.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Glassmorphic Support Box */}
            <div className="mt-24 relative overflow-hidden p-10 md:p-14 rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl flex flex-col lg:flex-row items-center gap-10">
                {/* Visual Flair */}
                <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/20 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/10 blur-[100px] rounded-full" />

                <div className="w-20 h-20 rounded-[2rem] bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 ring-8 ring-primary/5">
                    <HelpCircle className="w-10 h-10" />
                </div>
                
                <div className="text-center md:text-left flex-1 relative z-10">
                    <h4 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">Need Advanced Support?</h4>
                    <p className="text-slate-400 font-medium text-base leading-relaxed max-w-2xl">
                        Our technical team and workspace administrators are here to ensure your institution has a seamless experience. 
                        Reach out via WhatsApp or contact your administrator for immediate guidance.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto relative z-10">
                    {whatsapp && (
                        <button 
                            onClick={handleWhatsAppClick}
                            className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-[#25D366] text-white font-black text-sm tracking-widest uppercase hover:opacity-90 transition-all shadow-xl shadow-green-500/10 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-5 h-5 fill-current" />
                            WhatsApp
                        </button>
                    )}
                    <button className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-white text-slate-900 font-black text-sm tracking-widest uppercase hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95">
                        Contact Admin
                    </button>
                </div>
            </div>
        </div>
    );
}
