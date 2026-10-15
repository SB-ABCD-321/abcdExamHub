"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    Mail, 
    ChevronRight, 
    Clock, 
    User as UserIcon, 
    MessageCircle, 
    Phone, 
    Trash2, 
    Search, 
    X, 
    CheckCheck, 
    Copy, 
    Check, 
    ExternalLink, 
    Sparkles, 
    Filter,
    ShieldAlert,
    PhoneCall
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateInquiryStatus, deleteInquiry, markAllInquiriesAsRead } from "@/actions/inquiry";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function timeAgo(date: Date | string): string {
    const d = new Date(date);
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export interface Inquiry {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    subject: string | null;
    message: string;
    status: string;
    createdAt: Date | string;
}

interface Props {
    inquiries: Inquiry[];
}

export function InquiryManager({ inquiries }: Props) {
    const router = useRouter();
    const [localInquiries, setLocalInquiries] = useState<Inquiry[]>(inquiries || []);
    const [activeInquiryId, setActiveInquiryId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"all" | "pending" | "phone">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isMarkingAll, startMarkAllTransition] = useTransition();
    const [isUpdatingStatus, startStatusTransition] = useTransition();
    const [isDeleting, startDeleteTransition] = useTransition();
    const [copied, setCopied] = useState(false);

    // Keep local inquiries synchronized with server props
    useEffect(() => {
        setLocalInquiries(inquiries || []);
    }, [inquiries]);

    const pendingCount = useMemo(() => {
        return localInquiries.filter(i => i.status === "PENDING").length;
    }, [localInquiries]);

    const filteredInquiries = useMemo(() => {
        return localInquiries.filter((item) => {
            if (activeTab === "pending" && item.status !== "PENDING" && item.id !== activeNoticeIdSafe(activeInquiryId)) return false;
            if (activeTab === "phone" && !item.phone) return false;

            if (!searchQuery.trim()) return true;

            const q = searchQuery.toLowerCase();
            const nameMatch = item.name.toLowerCase().includes(q);
            const emailMatch = item.email.toLowerCase().includes(q);
            const phoneMatch = (item.phone || "").toLowerCase().includes(q);
            const subjectMatch = (item.subject || "").toLowerCase().includes(q);
            const messageMatch = item.message.toLowerCase().includes(q);

            return nameMatch || emailMatch || phoneMatch || subjectMatch || messageMatch;
        });
    }, [localInquiries, activeTab, searchQuery, activeInquiryId]);

    function activeNoticeIdSafe(id: string | null) {
        return id;
    }

    const activeInquiry = useMemo(() => {
        return localInquiries.find(i => i.id === activeInquiryId) || null;
    }, [localInquiries, activeInquiryId]);

    // Auto-select first item on desktop
    useEffect(() => {
        if (!activeInquiryId && filteredInquiries.length > 0) {
            if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                setActiveInquiryId(filteredInquiries[0].id);
            }
        }
    }, [filteredInquiries, activeInquiryId]);

    const handleSelectInquiry = (inquiry: Inquiry) => {
        setActiveInquiryId(inquiry.id);

        // Optimistically mark as read
        if (inquiry.status === "PENDING") {
            setLocalInquiries(prev => prev.map(i => i.id === inquiry.id ? { ...i, status: "READ" } : i));
            updateInquiryStatus(inquiry.id, "READ")
                .then(() => {
                    router.refresh();
                })
                .catch((err) => {
                    console.error("Failed to update status", err);
                });
        }
    };

    const handleToggleStatus = (inquiry: Inquiry) => {
        const nextStatus = inquiry.status === "PENDING" ? "RESOLVED" : "PENDING";
        startStatusTransition(async () => {
            try {
                const res = await updateInquiryStatus(inquiry.id, nextStatus);
                if (res.success) {
                    toast.success(`Inquiry marked as ${nextStatus === "RESOLVED" ? "Resolved" : "Pending"}`);
                    setLocalInquiries(prev => prev.map(i => i.id === inquiry.id ? { ...i, status: nextStatus } : i));
                    router.refresh();
                } else {
                    toast.error(res.error || "Failed to update status");
                }
            } catch (err: any) {
                toast.error(err.message || "An error occurred");
            }
        });
    };

    const handleMarkAllRead = () => {
        startMarkAllTransition(async () => {
            try {
                const res = await markAllInquiriesAsRead();
                if (res.success) {
                    toast.success(`Marked ${res.count || "all"} inquiries as read`);
                    setLocalInquiries(prev => prev.map(i => ({ ...i, status: "READ" })));
                    router.refresh();
                } else {
                    toast.error(res.error || "Failed to mark all as read");
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to mark all as read");
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure you want to permanently delete this client inquiry? This action cannot be undone.")) return;

        startDeleteTransition(async () => {
            try {
                const res = await deleteInquiry(id);
                if (res.success) {
                    toast.success("Inquiry deleted successfully");
                    setLocalInquiries(prev => prev.filter(i => i.id !== id));
                    if (activeInquiryId === id) {
                        const remaining = filteredInquiries.filter(i => i.id !== id);
                        setActiveInquiryId(remaining.length > 0 ? remaining[0].id : null);
                    }
                    router.refresh();
                } else {
                    toast.error(res.error || "Failed to delete inquiry");
                }
            } catch (err: any) {
                toast.error("An error occurred during deletion");
            }
        });
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Details copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="border border-border/70 bg-card/80 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden flex flex-col h-[720px] transition-all">
            {/* SPLIT SCREEN BODY */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border/60">
                {/* COMPACT LEFT LIST PANE */}
                <div className={cn(
                    "w-full lg:w-[300px] xl:w-[340px] shrink-0 flex flex-col h-full overflow-hidden bg-muted/10",
                    activeInquiry ? "hidden lg:flex" : "flex"
                )}>
                    {/* LEFT HEADER: TABS (EXACT HEIGHT h-[58px] ALIGNED WITH RIGHT HEADER) */}
                    <div className="h-[58px] px-3 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-2 shrink-0">
                        {/* TABS */}
                        <div className="flex items-center gap-1 p-0.5 bg-muted/60 dark:bg-muted/30 rounded-lg border border-border/50">
                            <button
                                type="button"
                                onClick={() => { setActiveTab("all"); setActiveInquiryId(null); }}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all",
                                    activeTab === "all"
                                        ? "bg-background text-foreground shadow-xs border border-border/40"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span>All Leads</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-muted text-muted-foreground">
                                    {localInquiries.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => { setActiveTab("pending"); setActiveInquiryId(null); }}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all",
                                    activeTab === "pending"
                                        ? "bg-background text-foreground shadow-xs border border-border/40"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span>Pending</span>
                                {pendingCount > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white animate-pulse">
                                        {pendingCount}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setActiveTab("phone"); setActiveInquiryId(null); }}
                                className={cn(
                                    "hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all",
                                    activeTab === "phone"
                                        ? "bg-background text-foreground shadow-xs border border-border/40"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="Show leads with phone numbers"
                            >
                                <Phone className="w-3 h-3 text-emerald-500" />
                            </button>
                        </div>

                        {/* MARK ALL READ ACTION */}
                        {pendingCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                disabled={isMarkingAll}
                                className="h-7 px-2 text-[10.5px] font-bold text-primary hover:bg-primary/10 rounded-md border border-primary/20 flex items-center gap-1 transition-colors shrink-0"
                                title="Mark all inquiries as read"
                            >
                                <CheckCheck className="w-3 h-3 text-emerald-500" />
                                <span>{isMarkingAll ? "..." : "Audit All"}</span>
                            </button>
                        )}
                    </div>

                    {/* SEARCH BOX AT TOP OF INQUIRY TITLE LIST */}
                    <div className="p-2.5 border-b border-border/40 bg-background/50 flex items-center gap-1.5 shrink-0">
                        <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search leads, names, email..."
                                className="h-8 pl-8 pr-7 text-xs rounded-lg border-border/50 bg-background focus-visible:ring-primary/20"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* INQUIRIES LIST */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                        {filteredInquiries.length === 0 ? (
                            <div className="h-full min-h-[250px] flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                                <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center mb-2">
                                    <MessageCircle className="w-5 h-5 opacity-30 text-primary" />
                                </div>
                                <p className="text-xs font-bold text-foreground">No inquiries found</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px]">
                                    {searchQuery ? "Try refining your search terms." : "No inquiries match this filter."}
                                </p>
                            </div>
                        ) : (
                            filteredInquiries.map((item) => {
                                const isSelected = activeInquiry?.id === item.id;
                                const isPending = item.status === "PENDING";

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectInquiry(item)}
                                        className={cn(
                                            "w-full text-left p-2.5 rounded-xl border transition-all duration-150 relative group cursor-pointer",
                                            isSelected
                                                ? "bg-primary/10 border-primary/40 shadow-xs ring-1 ring-primary/20"
                                                : isPending
                                                    ? "bg-card border-amber-500/30 hover:border-amber-500/50 shadow-2xs"
                                                    : "bg-background/60 border-border/30 hover:bg-muted/40 hover:border-border/60"
                                        )}
                                    >
                                        {/* PENDING GLOW DOT */}
                                        {isPending && (
                                            <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                            </span>
                                        )}

                                        <div className="flex items-center gap-2.5">
                                            {/* CONTACT INITIAL AVATAR */}
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors border",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : isPending
                                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                                        : "bg-muted text-muted-foreground border-border/40"
                                            )}>
                                                {item.name ? item.name[0].toUpperCase() : "C"}
                                            </div>

                                            <div className="flex-1 min-w-0 pr-1">
                                                {/* LINE 1: FULL CONTACT NAME + RELATIVE DATE */}
                                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                                    <span className={cn(
                                                        "text-xs truncate",
                                                        isPending ? "font-black text-foreground" : "font-bold text-foreground/90"
                                                    )}>
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                                                        {timeAgo(item.createdAt)}
                                                    </span>
                                                </div>

                                                {/* LINE 2: STATUS TEXT IN COLOR (NO BOX) + SINGLE LINE DESCRIPTION */}
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <span className={cn(
                                                        "text-[10px] font-bold uppercase tracking-wider shrink-0",
                                                        isPending ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                                                    )}>
                                                        • {item.status}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[11px] truncate",
                                                        isPending ? "font-semibold text-foreground/90" : "font-normal text-muted-foreground"
                                                    )}>
                                                        • {item.subject || item.message}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* EXPANSIVE RIGHT DETAIL PANE */}
                <div className={cn(
                    "flex-1 min-w-0 flex flex-col h-full bg-background/50 overflow-hidden",
                    activeInquiry ? "flex" : "hidden lg:flex"
                )}>
                    {activeInquiry ? (
                        <div className="flex flex-col h-full animate-in fade-in duration-150">
                            {/* RIGHT HEADER: CLIENT INQUIRY BADGE & ACTIONS (EXACT HEIGHT h-[58px] ALIGNED WITH LEFT HEADER) */}
                            <div className="h-[58px] px-4 sm:px-5 border-b border-border/60 bg-muted/10 flex items-center justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveInquiryId(null)}
                                        className="lg:hidden h-8 px-2 text-xs font-semibold"
                                    >
                                        ← Back
                                    </Button>
                                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                        Client Inquiry
                                    </Badge>
                                    <Badge 
                                        variant="outline" 
                                        className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider border",
                                            activeInquiry.status === "PENDING"
                                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                        )}
                                    >
                                        {activeInquiry.status}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* STATUS TOGGLE */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleStatus(activeInquiry)}
                                        disabled={isUpdatingStatus}
                                        className="h-8 px-2.5 text-xs font-semibold border-border/60 hover:bg-primary/5 hover:text-primary transition-colors"
                                        title="Toggle lead status"
                                    >
                                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                                        <span>{activeInquiry.status === "PENDING" ? "Mark Resolved" : "Mark Pending"}</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopy(`Name: ${activeInquiry.name}\nEmail: ${activeInquiry.email}\nPhone: ${activeInquiry.phone || 'N/A'}\nSubject: ${activeInquiry.subject || 'N/A'}\nMessage: ${activeInquiry.message}`)}
                                        className="h-8 px-2.5 text-xs font-semibold border-border/60"
                                        title="Copy full inquiry details"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline ml-1.5">{copied ? "Copied" : "Copy"}</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(activeInquiry.id)}
                                        disabled={isDeleting}
                                        className="h-8 px-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-border/60"
                                        title="Delete inquiry"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline ml-1.5">Delete</span>
                                    </Button>
                                </div>
                            </div>

                            {/* DETAIL CONTENT SCROLL */}
                            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                                {/* CLIENT CONTACT CARD */}
                                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-black text-sm">
                                            {activeInquiry.name ? activeInquiry.name[0].toUpperCase() : "C"}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-foreground">
                                                    {activeInquiry.name}
                                                </h3>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider",
                                                    activeInquiry.status === "PENDING" ? "text-amber-600" : "text-emerald-600"
                                                )}>
                                                    • {activeInquiry.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                <a 
                                                    href={`mailto:${activeInquiry.email}`}
                                                    className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                                                >
                                                    <Mail className="w-3 h-3" />
                                                    <span>{activeInquiry.email}</span>
                                                </a>
                                                {activeInquiry.phone && (
                                                    <a 
                                                        href={`tel:${activeInquiry.phone}`}
                                                        className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline inline-flex items-center gap-1"
                                                    >
                                                        <Phone className="w-3 h-3" />
                                                        <span>{activeInquiry.phone}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{new Date(activeInquiry.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                                    </div>
                                </div>

                                {/* SUBJECT */}
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Inquiry Subject
                                    </span>
                                    <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-snug mt-0.5">
                                        {activeInquiry.subject || "Mission Inquiry / Prospective Institute Lead"}
                                    </h2>
                                </div>

                                {/* MESSAGE BODY */}
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Client Message
                                    </span>
                                    <div className="p-4 sm:p-5 mt-1 rounded-2xl bg-card border border-border/60 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans shadow-2xs">
                                        "{activeInquiry.message}"
                                    </div>
                                </div>

                                {/* DIRECT ACTION QUICK LINKS */}
                                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 flex items-center justify-between gap-3 flex-wrap">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        Direct Response Dispatch:
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={`mailto:${activeInquiry.email}?subject=Re: ${encodeURIComponent(activeInquiry.subject || 'ABCD Exam Hub Inquiry')}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors"
                                        >
                                            <Mail className="w-3.5 h-3.5" />
                                            <span>Reply via Email</span>
                                        </a>
                                        {activeInquiry.phone && (
                                            <a
                                                href={`tel:${activeInquiry.phone}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
                                            >
                                                <PhoneCall className="w-3.5 h-3.5" />
                                                <span>Call Lead</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* DETAIL FOOTER */}
                            <div className="p-3.5 border-t border-border/60 bg-muted/10 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                                <span>Lead ID: #{activeInquiry.id.slice(0, 12)}</span>
                                <span className="font-sans font-medium">ABCD Exam Hub Institutional Acquisition Telemetry</span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-500">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">No Lead Selected</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                Select any inbound prospective client inquiry from the left pane to audit details, review messages, and dispatch responses.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
