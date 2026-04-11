"use client";

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { HelpCircle, Info, ChevronRight, BookOpen, MessageCircle, Search, X, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";

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
    whatsapp?: string;
}

export const IconLoader = ({ name, className }: { name?: string; className?: string }) => {
    const Icon = (name && Icons[name as keyof typeof Icons] ? Icons[name as keyof typeof Icons] : Icons.BookOpen) as any;
    return <Icon className={className} />;
};

export function GuidePage({ title, description, items, whatsapp }: GuidePageProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="h-[600px] w-full bg-slate-100/50 dark:bg-zinc-800/20 animate-pulse rounded-3xl" />;
    }

    const filteredItems = items
        .sort((a, b) => a.order - b.order)
        .filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const handleWhatsAppClick = () => {
        if (!whatsapp) return;
        const cleanNumber = whatsapp.replace(/\D/g, "");
        window.open(`https://wa.me/${cleanNumber}`, "_blank");
    };

    return (
        <div className="space-y-10 md:space-y-16 pb-24 max-w-6xl mx-auto px-4 sm:px-0">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
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
                    <p className="text-muted-foreground font-medium text-sm md:text-lg max-w-2xl leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Search Interface */}
                <div className="relative group max-w-md">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative flex items-center">
                        <Search className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Find features or help topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-14 pl-12 pr-12 rounded-2xl border-none bg-white dark:bg-zinc-900 shadow-xl shadow-black/5 dark:shadow-none ring-1 ring-slate-100 dark:ring-zinc-800 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all text-base"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Content List */}
            <div className="space-y-4 md:space-y-6">
                <AnimatePresence mode="popLayout">
                    {filteredItems.map((item, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <motion.div
                                key={item.id || idx}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                                className={cn(
                                    "overflow-hidden rounded-3xl md:rounded-[2.5rem] transition-all duration-500",
                                    isOpen 
                                        ? "bg-white dark:bg-zinc-900 shadow-2xl shadow-indigo-500/10 border border-indigo-100/50 dark:border-indigo-900/50" 
                                        : "bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800/10 hover:border-primary/20"
                                )}
                            >
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                                    className="w-full text-left p-5 md:p-8 flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4 md:gap-7">
                                        <div className={cn(
                                            "w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-bold text-base md:text-xl transition-all duration-500 shrink-0",
                                            isOpen 
                                                ? "bg-primary text-white shadow-xl shadow-primary/20 rotate-3" 
                                                : "bg-white dark:bg-zinc-800 text-slate-400"
                                        )}>
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className={cn(
                                                "text-lg md:text-2xl font-bold tracking-tight transition-colors duration-500",
                                                isOpen ? "text-slate-950 dark:text-white" : "text-slate-600 dark:text-slate-400"
                                            )}>
                                                {item.title}
                                            </h3>
                                            {!isOpen && searchQuery && (
                                                <p className="text-xs font-medium text-primary line-clamp-1 mt-1">Match found in detailed guide</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className={cn(
                                        "w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 shrink-0",
                                        isOpen 
                                            ? "bg-primary/10 text-primary rotate-180" 
                                            : "bg-slate-100 dark:bg-zinc-800 text-slate-400 rotate-0"
                                    )}>
                                        <ChevronRight className={cn("w-5 h-5 transition-transform", isOpen ? "rotate-90" : "")} />
                                    </div>
                                </motion.button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                        >
                                            <div className="px-6 md:px-10 pb-8 md:pb-12 pt-2 md:pt-4">
                                                <div className="pl-6 md:pl-10 border-l-2 border-primary/20 space-y-8 relative">
                                                    <div className="absolute top-0 -left-[5px] w-2 h-2 rounded-full bg-primary" />
                                                    
                                                    <p className="text-slate-600 dark:text-slate-400 font-medium leading-[1.8] text-base md:text-xl whitespace-pre-wrap">
                                                        {item.description}
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-primary/5 border border-primary/10">
                                                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                                                            <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Institutional Protocol</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-indigo-50 dark:bg-zinc-800 border border-indigo-100 dark:border-zinc-700">
                                                            < ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                                                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">Verified Access</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filteredItems.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-24 text-center rounded-[3rem] bg-slate-50/30 dark:bg-zinc-900/10 border-2 border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-900 dark:text-white font-bold text-2xl tracking-tight">No Results Found</p>
                            <p className="text-slate-500 font-medium">We couldn't find any guide items matching "{searchQuery}"</p>
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="text-primary font-bold hover:underline mt-4 block mx-auto"
                            >
                                Clear search query
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Premium Support Section */}
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative overflow-hidden p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] bg-slate-950 border border-white/5 shadow-2xl flex flex-col lg:flex-row items-center gap-8 md:gap-12 group"
            >
                {/* Glowing Orbs */}
                <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-colors duration-1000" />
                <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/10 blur-[100px] rounded-full" />

                <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-white/5 border border-white/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                    <HelpCircle className="w-10 h-10 md:w-14 md:h-14" />
                </div>
                
                <div className="text-center lg:text-left flex-1 relative z-10">
                    <h4 className="text-2xl md:text-4xl font-black text-white mb-4 tracking-tight leading-tight">Need Advanced Support?</h4>
                    <p className="text-slate-400 font-medium text-sm md:text-lg leading-relaxed max-w-2xl">
                        Our technical architects are available to ensure your institution has a seamless experience. 
                        Reach out for dedicated guidance or implementation support.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 w-full lg:w-auto relative z-10">
                    {whatsapp && (
                        <button 
                            onClick={handleWhatsAppClick}
                            className="flex-1 px-8 py-5 rounded-2xl bg-[#25D366] text-white font-bold text-base tracking-wide hover:shadow-[0_20px_40px_rgba(37,211,102,0.2)] transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <MessageCircle className="w-6 h-6 fill-current" />
                            Direct WhatsApp
                        </button>
                    )}
                    <button className="flex-1 px-8 py-5 rounded-2xl bg-white text-slate-950 font-bold text-base tracking-wide hover:bg-primary hover:text-white transition-all active:scale-95">
                        Contact Admin
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
