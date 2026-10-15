"use client";

import { useState, useMemo } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
    HelpCircle, 
    ChevronRight, 
    BookOpen, 
    MessageCircle, 
    Search, 
    X, 
    ShieldCheck, 
    Copy, 
    Check, 
    Sparkles, 
    Layers, 
    Compass, 
    ExternalLink,
    ChevronDown,
    CheckCircle2,
    Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { toast } from "sonner";

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
    role?: string;
}

export const IconLoader = ({ name, className }: { name?: string; className?: string }) => {
    const Icon = (name && Icons[name as keyof typeof Icons] ? Icons[name as keyof typeof Icons] : Icons.BookOpen) as any;
    return <Icon className={className} />;
};

export function GuidePage({ title, description, items, whatsapp, role }: GuidePageProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => a.order - b.order);
    }, [items]);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return sortedItems;
        const q = searchQuery.toLowerCase();
        return sortedItems.filter(item => 
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
        );
    }, [sortedItems, searchQuery]);

    const handleWhatsAppClick = () => {
        if (!whatsapp) return;
        const cleanNumber = whatsapp.replace(/\D/g, "");
        window.open(`https://wa.me/${cleanNumber}`, "_blank");
    };

    const handleCopyContent = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        toast.success("Protocol details copied to clipboard");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const toggleAll = () => {
        if (openIndex !== null) {
            setOpenIndex(null);
        } else {
            setOpenIndex(0);
        }
    };

    // Calculate real numeric statistics from documentation items
    const totalWords = useMemo(() => {
        return items.reduce((acc, it) => {
            const text = `${it.title || ""} ${it.description || ""}`;
            return acc + text.trim().split(/\s+/).filter(Boolean).length;
        }, 0);
    }, [items]);

    const estimatedReadingMinutes = useMemo(() => {
        return Math.max(1, Math.ceil(totalWords / 140));
    }, [totalWords]);

    const totalKeyProcedures = useMemo(() => {
        return items.reduce((acc, it) => {
            const sentences = (it.description || "").split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 15);
            return acc + Math.max(1, sentences.length);
        }, 0);
    }, [items]);

    const supportChannelsCount = whatsapp ? 2 : 1;

    // Format title for header without duplicating "Super Admin" if already present
    const displayTitle = useMemo(() => {
        if (!title) return "User Guide";
        if (title.toLowerCase().includes("super admin") || title.toLowerCase().includes("super_admin")) {
            return "Documentation & User Guide";
        }
        return title;
    }, [title]);

    const titleParts = displayTitle.split(" ");
    const lastWord = titleParts.pop() || "Guide";
    const firstPart = titleParts.join(" ") || "User";

    return (
        <DashboardPage>
            {/* Standardized Dashboard Header */}
            <DashboardHeader
                title={<>{firstPart} <span className="text-primary font-black">{lastWord}</span></>}
                subtitle={description || "Comprehensive operating protocols, step-by-step workflow procedures, and platform guidelines."}
                actions={
                    <div className="flex items-center gap-2">
                        {whatsapp && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleWhatsAppClick}
                                className="h-9 px-3 text-xs font-bold rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer shadow-2xs"
                            >
                                <MessageCircle className="w-3.5 h-3.5 mr-1.5 fill-current" />
                                <span>WhatsApp Support</span>
                            </Button>
                        )}
                    </div>
                }
            />

            {/* HIGH-DENSITY ANALYTICAL METRICS - ALL NUMERIC-DRIVEN */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Documentation Chapters"
                    value={items.length}
                    subtitle={`${filteredItems.length} active in current view`}
                    icon={<BookOpen className="size-4 text-primary" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {items.length} Modules
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Key Procedures"
                    value={totalKeyProcedures}
                    subtitle="Verified operational checkpoints"
                    icon={<Layers className="size-4 text-blue-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {totalKeyProcedures} Checkpoints
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Est. Reading Time"
                    value={estimatedReadingMinutes}
                    subtitle={`Calculated across ${totalWords} total words`}
                    icon={<Clock className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {estimatedReadingMinutes} Min
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Support Channels"
                    value={supportChannelsCount}
                    subtitle={whatsapp ? "WhatsApp & Platform Help Desk" : "Platform Ticket System"}
                    icon={<HelpCircle className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {supportChannelsCount} Active
                        </span>
                    }
                />
            </div>

            {/* SEARCH & ACCORDION ACTION TOOLBAR */}
            <div className="p-3 sm:p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search operating procedures & features..."
                        className="h-9.5 pl-9 pr-8 text-xs font-medium rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-xs font-semibold text-muted-foreground">
                        Showing {filteredItems.length} of {items.length} chapters
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleAll}
                        className="h-8.5 px-3 text-xs font-bold rounded-xl border-border/60 hover:bg-muted/50 cursor-pointer"
                    >
                        {openIndex !== null ? "Collapse All" : "Expand First"}
                    </Button>
                </div>
            </div>

            {/* ACCORDION CHAPTERS */}
            <div className="space-y-3 sm:space-y-3.5">
                {filteredItems.length === 0 ? (
                    <div className="py-16 text-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                            <Search className="w-6 h-6 opacity-40" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">No matching guide topics found</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Try searching for different keywords or clear your query.</p>
                        </div>
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchQuery("")}
                                className="text-xs font-bold text-primary mt-1"
                            >
                                Clear search query
                            </Button>
                        )}
                    </div>
                ) : (
                    filteredItems.map((item, idx) => {
                        const isOpen = openIndex === idx;
                        const stepNum = (idx + 1).toString().padStart(2, "0");

                        return (
                            <div
                                key={item.id || idx}
                                className={cn(
                                    "rounded-2xl border transition-all duration-200 overflow-hidden",
                                    isOpen 
                                        ? "bg-card border-primary/40 shadow-sm ring-1 ring-primary/20" 
                                        : "bg-card/60 border-border/60 hover:border-border hover:bg-card"
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3.5 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all border",
                                            isOpen
                                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                : "bg-muted/80 text-muted-foreground border-border/40"
                                        )}>
                                            {stepNum}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className={cn(
                                                "text-sm sm:text-base font-bold tracking-tight truncate",
                                                isOpen ? "text-foreground" : "text-foreground/80"
                                            )}>
                                                {item.title}
                                            </h3>
                                            {!isOpen && (
                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-normal">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 border border-border/40",
                                            isOpen ? "bg-primary/10 text-primary rotate-180" : "bg-muted text-muted-foreground"
                                        )}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                        >
                                            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 border-t border-border/40">
                                                <div className="p-4 sm:p-5 rounded-xl bg-muted/20 border border-border/50 space-y-4">
                                                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap">
                                                        {item.description}
                                                    </p>

                                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <Badge variant="outline" className="text-[9.5px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Standard
                                                            </Badge>
                                                            <Badge variant="outline" className="text-[9.5px] font-semibold border-border/60 text-muted-foreground">
                                                                Protocol #{stepNum}
                                                            </Badge>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyContent(`${item.title}\n\n${item.description}`, idx);
                                                            }}
                                                            className="h-7 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                                                        >
                                                            {copiedIndex === idx ? (
                                                                <>
                                                                    <Check className="w-3 h-3 mr-1 text-emerald-500" />
                                                                    <span className="text-emerald-500 font-bold">Copied</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="w-3 h-3 mr-1" />
                                                                    <span>Copy Steps</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ADVANCED SUPPORT DESK BANNER */}
            <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/70 shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-center lg:text-left">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-inner">
                        <HelpCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-base sm:text-lg font-black text-foreground tracking-tight">Need Advanced Institutional Support?</h4>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5 max-w-xl leading-relaxed">
                            Our technical support architects are available to assist with workspace setup, proctoring calibration, and custom enterprise deployments.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-center">
                    {whatsapp && (
                        <button
                            type="button"
                            onClick={handleWhatsAppClick}
                            className="px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs tracking-wide hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <MessageCircle className="w-4 h-4 fill-current" />
                            <span>Direct WhatsApp</span>
                        </button>
                    )}
                    <a
                        href={role === "SUPER_ADMIN" ? "/super-admin/inquiries" : `/${(role || "admin").toLowerCase().replace("_", "-")}/notices`}
                        className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs tracking-wide hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>{role === "SUPER_ADMIN" ? "Support Inquiries" : "Notice Board"}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        </DashboardPage>
    );
}
