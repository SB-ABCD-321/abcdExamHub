"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAsRead, markAllAsRead, deleteNotice } from "../../actions/notice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    Mail, 
    Inbox, 
    History, 
    Search, 
    CheckCheck, 
    Trash2, 
    Copy, 
    Check, 
    Clock, 
    Building2, 
    Sparkles, 
    Filter,
    X,
    Radio
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function timeAgo(date: Date | string): string {
    const d = new Date(date);
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function getRoleText(role?: string) {
    switch (role) {
        case "ADMIN":
            return { label: "Workspace Admin", color: "text-emerald-600 dark:text-emerald-400" };
        case "SUPER_ADMIN":
            return { label: "Super Admin", color: "text-purple-600 dark:text-purple-400" };
        case "TEACHER":
            return { label: "Instructor", color: "text-blue-600 dark:text-blue-400" };
        case "STUDENT":
            return { label: "Student", color: "text-amber-600 dark:text-amber-400" };
        default:
            return { label: "System", color: "text-zinc-500" };
    }
}

export interface Notice {
    id: string;
    title: string;
    content: string;
    createdAt: Date | string;
    isRead: boolean;
    sender?: { firstName?: string; lastName?: string; email?: string; role?: string };
    senderId?: string;
    targetType?: string;
    targetWorkspace?: { id?: string; name: string };
    targetUser?: { firstName?: string; lastName?: string; email: string };
    readCount?: number;
    expectedTargetText?: string;
}

interface Props {
    inbox: Notice[];
    sentBox: Notice[];
}

export function NoticeBoardTerminal({ inbox, sentBox }: Props) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
    const [searchQuery, setSearchQuery] = useState("");
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);
    const [isMarkingAll, startMarkAllTransition] = useTransition();
    const [isDeleting, startDeleteTransition] = useTransition();
    const [copied, setCopied] = useState(false);

    // List of notices based on active tab
    const currentList = activeTab === "inbox" ? inbox : sentBox;

    // Filtered notices
    const filteredNotices = useMemo(() => {
        return currentList.filter((n) => {
            if (activeTab === "inbox" && unreadOnly && n.isRead && n.id !== activeNoticeId) return false;
            if (!searchQuery.trim()) return true;

            const q = searchQuery.toLowerCase();
            const titleMatch = n.title.toLowerCase().includes(q);
            const contentMatch = n.content.toLowerCase().includes(q);
            const senderMatch = `${n.sender?.firstName || ""} ${n.sender?.lastName || ""}`.toLowerCase().includes(q);
            const targetMatch = (n.expectedTargetText || n.targetWorkspace?.name || "").toLowerCase().includes(q);
            return titleMatch || contentMatch || senderMatch || targetMatch;
        });
    }, [currentList, activeTab, unreadOnly, searchQuery, activeNoticeId]);

    // Active notice lookup
    const activeNotice = useMemo(() => {
        return currentList.find(n => n.id === activeNoticeId) || null;
    }, [currentList, activeNoticeId]);

    // Auto-select first notice on desktop if none selected
    useEffect(() => {
        if (!activeNoticeId && filteredNotices.length > 0) {
            if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                setActiveNoticeId(filteredNotices[0].id);
            }
        }
    }, [filteredNotices, activeNoticeId]);

    const unreadInboxCount = useMemo(() => {
        return inbox.filter(n => !n.isRead).length;
    }, [inbox]);

    const handleSelectNotice = (notice: Notice) => {
        setActiveNoticeId(notice.id);
        if (activeTab === "inbox" && !notice.isRead) {
            notice.isRead = true;
            markAsRead(notice.id)
                .then(() => {
                    router.refresh();
                })
                .catch((err) => {
                    console.error("Failed to mark notice as read", err);
                });
        }
    };

    const handleMarkAllRead = () => {
        startMarkAllTransition(async () => {
            try {
                const res = await markAllAsRead();
                toast.success(`Marked ${res.count || "all"} notices as read`);
                inbox.forEach(n => { n.isRead = true; });
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Failed to mark all as read");
            }
        });
    };

    const handleDeleteNotice = (id: string) => {
        if (!confirm("Are you sure you want to permanently delete this notice?")) return;
        startDeleteTransition(async () => {
            try {
                await deleteNotice(id);
                toast.success("Notice deleted successfully");
                if (activeNoticeId === id) {
                    const remaining = filteredNotices.filter(n => n.id !== id);
                    setActiveNoticeId(remaining.length > 0 ? remaining[0].id : null);
                }
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Failed to delete notice");
            }
        });
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Notice content copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="border border-border/70 bg-card/80 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden flex flex-col h-[700px] transition-all">
            {/* SPLIT SCREEN BODY */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border/60">
                {/* COMPACT LEFT LIST PANE */}
                <div className={cn(
                    "w-full lg:w-[290px] xl:w-[320px] shrink-0 flex flex-col h-full overflow-hidden bg-muted/10",
                    activeNotice ? "hidden lg:flex" : "flex"
                )}>
                    {/* LEFT HEADER: INBOX / SENT TABS (HEIGHT MATCHES RIGHT HEADER h-[58px]) */}
                    <div className="h-[58px] px-3 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-2 shrink-0">
                        {/* TABS */}
                        <div className="flex items-center gap-1 p-0.5 bg-muted/60 dark:bg-muted/30 rounded-lg border border-border/50">
                            <button
                                type="button"
                                onClick={() => { setActiveTab("inbox"); setActiveNoticeId(null); }}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all",
                                    activeTab === "inbox"
                                        ? "bg-background text-foreground shadow-xs border border-border/40"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Inbox className="w-3.5 h-3.5 text-primary" />
                                <span>Inbox</span>
                                {unreadInboxCount > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-primary text-primary-foreground animate-pulse">
                                        {unreadInboxCount}
                                    </span>
                                )}
                            </button>

                            {sentBox.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab("sent"); setActiveNoticeId(null); }}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all",
                                        activeTab === "sent"
                                            ? "bg-background text-foreground shadow-xs border border-border/40"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <History className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Sent</span>
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-muted text-muted-foreground">
                                        {sentBox.length}
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* MARK ALL READ ACTION */}
                        {activeTab === "inbox" && unreadInboxCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                disabled={isMarkingAll}
                                className="h-7 px-2 text-[10.5px] font-bold text-primary hover:bg-primary/10 rounded-md border border-primary/20 flex items-center gap-1 transition-colors shrink-0"
                                title="Mark all notices as read"
                            >
                                <CheckCheck className="w-3 h-3 text-emerald-500" />
                                <span>{isMarkingAll ? "..." : "Mark Read"}</span>
                            </button>
                        )}
                    </div>

                    {/* SEARCH BOX AT TOP OF TITLE LIST */}
                    <div className="p-2.5 border-b border-border/40 bg-background/50 flex items-center gap-1.5 shrink-0">
                        <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search notices..."
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

                        {activeTab === "inbox" && (
                            <button
                                type="button"
                                onClick={() => setUnreadOnly(!unreadOnly)}
                                className={cn(
                                    "h-8 px-2 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-all shrink-0",
                                    unreadOnly
                                        ? "bg-primary/10 text-primary border-primary/30"
                                        : "bg-background text-muted-foreground border-border/50 hover:text-foreground"
                                )}
                                title="Filter unread only"
                            >
                                <Filter className="w-3 h-3" />
                                <span className="hidden sm:inline text-[10px]">Unread</span>
                            </button>
                        )}
                    </div>

                    {/* NOTICES LIST */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                        {filteredNotices.length === 0 ? (
                            <div className="h-full min-h-[250px] flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                                <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center mb-2">
                                    <Mail className="w-5 h-5 opacity-30 text-primary" />
                                </div>
                                <p className="text-xs font-bold text-foreground">No notices found</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px]">
                                    {searchQuery ? "Try refining your search terms." : (activeTab === "inbox" ? "Your inbox is clear!" : "No dispatches recorded.")}
                                </p>
                            </div>
                        ) : (
                            filteredNotices.map((n) => {
                                const isSelected = activeNotice?.id === n.id;
                                const isUnread = !n.isRead && activeTab === "inbox";
                                const roleInfo = getRoleText(n.sender?.role);
                                const senderName = activeTab === "sent" 
                                    ? `To: ${n.expectedTargetText || "Recipients"}`
                                    : `${n.sender?.firstName || "System"} ${n.sender?.lastName || ""}`.trim();

                                return (
                                    <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => handleSelectNotice(n)}
                                        className={cn(
                                            "w-full text-left p-2.5 rounded-xl border transition-all duration-150 relative group cursor-pointer",
                                            isSelected
                                                ? "bg-primary/10 border-primary/40 shadow-xs ring-1 ring-primary/20"
                                                : isUnread
                                                    ? "bg-card border-border hover:border-primary/30 shadow-2xs"
                                                    : "bg-background/60 border-border/30 hover:bg-muted/40 hover:border-border/60"
                                        )}
                                    >
                                        {/* UNREAD GLOW DOT */}
                                        {isUnread && (
                                            <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                            </span>
                                        )}

                                        <div className="flex items-center gap-2.5">
                                            {/* SENDER AVATAR */}
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors border",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : isUnread
                                                        ? "bg-primary/10 text-primary border-primary/20"
                                                        : "bg-muted text-muted-foreground border-border/40"
                                            )}>
                                                {activeTab === "sent" 
                                                    ? <History className="w-3.5 h-3.5" /> 
                                                    : (senderName ? senderName[0].toUpperCase() : "S")
                                                }
                                            </div>

                                            <div className="flex-1 min-w-0 pr-1">
                                                {/* LINE 1: FULL SENDER NAME + TIMESTAMP */}
                                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                                    <span className={cn(
                                                        "text-xs truncate",
                                                        isUnread ? "font-black text-foreground" : "font-bold text-foreground/90"
                                                    )}>
                                                        {senderName}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                                                        {timeAgo(n.createdAt)}
                                                    </span>
                                                </div>

                                                {/* LINE 2: ROLE IN GREEN (NO BOX) + SINGLE LINE DESCRIPTION */}
                                                <div className="flex items-center gap-1 min-w-0">
                                                    {activeTab === "inbox" && (
                                                        <span className={cn("text-[10px] font-bold uppercase tracking-wider shrink-0", roleInfo.color)}>
                                                            • {roleInfo.label}
                                                        </span>
                                                    )}
                                                    <span className={cn(
                                                        "text-[11px] truncate",
                                                        isUnread ? "font-semibold text-foreground/90" : "font-normal text-muted-foreground"
                                                    )}>
                                                        {activeTab === "inbox" ? "• " : ""}{n.title || n.content}
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
                    activeNotice ? "flex" : "hidden lg:flex"
                )}>
                    {activeNotice ? (
                        <div className="flex flex-col h-full animate-in fade-in duration-150">
                            {/* RIGHT HEADER: OFFICIAL BROADCAST TAB & ACTIONS (HEIGHT MATCHES LEFT HEADER h-[58px]) */}
                            <div className="h-[58px] px-4 sm:px-5 border-b border-border/60 bg-muted/10 flex items-center justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveNoticeId(null)}
                                        className="lg:hidden h-8 px-2 text-xs font-semibold"
                                    >
                                        ← Back
                                    </Button>
                                    <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                        {activeTab === "sent" ? "Dispatched Notice" : "Official Broadcast"}
                                    </Badge>
                                    {activeNotice.targetWorkspace?.name && (
                                        <Badge variant="outline" className="text-[10px] font-semibold border-border/60 truncate">
                                            <Building2 className="w-3 h-3 mr-1 text-muted-foreground shrink-0" />
                                            {activeNotice.targetWorkspace.name}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopy(`${activeNotice.title}\n\n${activeNotice.content}`)}
                                        className="h-8 px-2.5 text-xs font-semibold border-border/60"
                                        title="Copy notice content"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline ml-1.5">{copied ? "Copied" : "Copy"}</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteNotice(activeNotice.id)}
                                        disabled={isDeleting}
                                        className="h-8 px-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-border/60"
                                        title="Delete notice"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline ml-1.5">Delete</span>
                                    </Button>
                                </div>
                            </div>

                            {/* DETAIL CONTENT SCROLL */}
                            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                                {/* SENDER PROFILE CARD */}
                                <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-sm">
                                            {activeNotice.sender?.firstName ? activeNotice.sender.firstName[0].toUpperCase() : "S"}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-foreground">
                                                    {activeNotice.sender?.firstName || "System"} {activeNotice.sender?.lastName || ""}
                                                </h3>
                                                {activeNotice.sender?.role && (
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", getRoleText(activeNotice.sender.role).color)}>
                                                        • {getRoleText(activeNotice.sender.role).label}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {activeNotice.sender?.email || "Platform System Channel"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{new Date(activeNotice.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                                    </div>
                                </div>

                                {/* AUDIENCE / DISPATCH SUMMARY */}
                                {activeNotice.expectedTargetText && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-xs text-foreground">
                                        <Radio className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span className="text-muted-foreground">Target Audience:</span>
                                        <span className="font-bold">{activeNotice.expectedTargetText}</span>
                                        {activeNotice.readCount !== undefined && (
                                            <span className="ml-auto font-bold text-emerald-600 dark:text-emerald-400">
                                                {activeNotice.readCount} Opened
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* SUBJECT */}
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-snug">
                                        {activeNotice.title}
                                    </h2>
                                </div>

                                {/* BODY */}
                                <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans shadow-2xs">
                                    {activeNotice.content}
                                </div>
                            </div>

                            {/* DETAIL FOOTER */}
                            <div className="p-3.5 border-t border-border/60 bg-muted/10 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                                <span>Ref: #{activeNotice.id.slice(0, 12)}</span>
                                <span className="font-sans font-medium">ABCD Exam Hub Communications Shard</span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-3 text-primary">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">No Notice Selected</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                Select any broadcast or notice from the left pane to view its contents, recipient targeting, and delivery telemetry.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
