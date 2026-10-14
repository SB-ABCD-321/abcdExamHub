"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    ChevronDown, 
    History, 
    Calendar, 
    FileText, 
    Zap, 
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Trash2,
    Search,
    X,
    Building2,
    ShieldCheck,
    Receipt,
    ExternalLink,
    Plus,
    RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { deleteManualPayment } from "@/actions/financial-actions";
import { toast } from "sonner";

interface WorkspacePaymentsTableProps {
    workspaces: any[];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    ACTIVE: { label: "Active", bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
    TRIAL: { label: "Trial", bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
    EXPIRED: { label: "Expired", bg: "bg-rose-500/10 border-rose-500/20", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
};

const ITEMS_PER_PAGE = 10;

export function WorkspacePaymentsTable({ workspaces }: WorkspacePaymentsTableProps) {
    // Single expanded workspace ID so opening one automatically closes any other
    const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "TRIAL" | "EXPIRED">("ALL");

    const toggleExpand = (id: string) => {
        setExpandedWorkspaceId((current) => (current === id ? null : id));
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    // Filter by search query and status filter
    const filteredWorkspaces = useMemo(() => {
        return workspaces.filter((ws) => {
            const lastPayment = ws.payments[0] || null;
            const isExpired = lastPayment
                ? new Date(lastPayment.expiryDate) < new Date()
                : (ws.trialExpiresAt ? new Date(ws.trialExpiresAt) < new Date() : true);
            const status = isExpired
                ? "EXPIRED"
                : (ws.trialExpiresAt && new Date(ws.trialExpiresAt) > new Date() ? "TRIAL" : "ACTIVE");

            if (statusFilter !== "ALL" && status !== statusFilter) {
                return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const nameMatch = ws.name.toLowerCase().includes(q);
                const emailMatch = ws.contactEmail?.toLowerCase().includes(q);
                const gstMatch = ws.gstNumber?.toLowerCase().includes(q);
                const txMatch = ws.payments?.some((p: any) => 
                    p.id.toLowerCase().includes(q) || 
                    (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
                );
                return nameMatch || emailMatch || gstMatch || txMatch;
            }

            return true;
        });
    }, [workspaces, searchQuery, statusFilter]);

    // Dynamic sorting
    const sortedWorkspaces = useMemo(() => {
        return [...filteredWorkspaces].sort((a, b) => {
            if (!sortConfig) return 0;
            const { key, direction } = sortConfig;

            let valA: any = a[key];
            let valB: any = b[key];

            if (key === 'ltr') {
                valA = a.payments.reduce((sum: number, p: any) => sum + (p.totalAmount || p.amount || 0), 0);
                valB = b.payments.reduce((sum: number, p: any) => sum + (p.totalAmount || p.amount || 0), 0);
            }

            if (key === 'expiry') {
                valA = a.payments[0]?.expiryDate ? new Date(a.payments[0].expiryDate).getTime() : 0;
                valB = b.payments[0]?.expiryDate ? new Date(b.payments[0].expiryDate).getTime() : 0;
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredWorkspaces, sortConfig]);

    const totalPages = Math.ceil(sortedWorkspaces.length / ITEMS_PER_PAGE);
    const paginatedWorkspaces = sortedWorkspaces.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-4">
            {/* Search and Filter Controls Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60 shadow-2xs">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search workspace, contact, GSTIN, or transaction..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-8.5 pr-8 h-8 text-xs rounded-lg bg-background border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setCurrentPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Pills & Sort Matrix */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Status filter tabs */}
                    <div className="h-8 bg-muted/60 p-0.5 rounded-lg border border-border/60 flex items-center gap-0.5">
                        {(["ALL", "ACTIVE", "TRIAL", "EXPIRED"] as const).map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(s);
                                    setCurrentPage(1);
                                }}
                                className={cn(
                                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer select-none",
                                    statusFilter === s
                                        ? "bg-card text-foreground shadow-2xs font-bold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {/* Sort buttons */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSort('name')}
                            className={cn(
                                "h-8 px-2.5 text-xs rounded-lg transition-all",
                                sortConfig?.key === 'name' ? "bg-primary/10 text-primary border-primary/30 font-bold" : ""
                            )}
                        >
                            <span>Name</span>
                            <ArrowUpDown className="size-3 ml-1 opacity-60" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSort('ltr')}
                            className={cn(
                                "h-8 px-2.5 text-xs rounded-lg transition-all",
                                sortConfig?.key === 'ltr' ? "bg-primary/10 text-primary border-primary/30 font-bold" : ""
                            )}
                        >
                            <span>LTV</span>
                            <ArrowUpDown className="size-3 ml-1 opacity-60" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Workspaces Ledger List */}
            {paginatedWorkspaces.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-border/60 p-6 shadow-2xs">
                    <div className="size-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-2.5">
                        <Zap className="size-5" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">No Workspace Ledgers Found</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                        {searchQuery || statusFilter !== "ALL"
                            ? "No institutional nodes match the selected search or filter criteria."
                            : "No workspace accounts are currently registered in the financial settlement system."}
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {paginatedWorkspaces.map((ws) => {
                        const totalSpent = ws.payments.reduce((sum: number, p: any) => sum + (p.totalAmount || p.amount || 0), 0);
                        const lastPayment = ws.payments[0] || null;
                        const isExpired = lastPayment
                            ? new Date(lastPayment.expiryDate) < new Date()
                            : (ws.trialExpiresAt ? new Date(ws.trialExpiresAt) < new Date() : true);
                        const status = isExpired
                            ? "EXPIRED"
                            : (ws.trialExpiresAt && new Date(ws.trialExpiresAt) > new Date() ? "TRIAL" : "ACTIVE");
                        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;
                        const isExpanded = expandedWorkspaceId === ws.id;

                        return (
                            <div
                                key={ws.id}
                                className={cn(
                                    "group relative overflow-hidden border border-border/60 bg-card rounded-xl shadow-2xs hover:border-primary/40 transition-all duration-200",
                                    isExpanded && "ring-1 ring-primary/20 border-primary/40"
                                )}
                            >
                                {/* Left status accent bar */}
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1", cfg.dot)} />

                                {/* Row Core Information */}
                                <div className="p-3.5 sm:p-4 pl-3 sm:pl-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                                    {/* Workspace Identity */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="size-10 rounded-xl bg-muted/80 border border-border/60 flex items-center justify-center text-xs font-black text-muted-foreground uppercase shrink-0">
                                            {ws.name.substring(0, 2)}
                                        </div>
                                        <div className="min-w-0 space-y-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                                                    {ws.name}
                                                </h4>
                                                <span className={cn("text-[9.5px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1", cfg.bg, cfg.text)}>
                                                    <span className={cn("size-1 rounded-full", cfg.dot)} />
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                                                <span>{ws.contactEmail || "billing@node.org"}</span>
                                                {ws.gstNumber && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="font-mono text-[10px] text-muted-foreground/80">GSTIN: {ws.gstNumber}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* LTV & Maturity Metrics */}
                                    <div className="flex items-center gap-4 sm:gap-6 self-start md:self-auto pl-13 md:pl-0">
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">LTV Yield</span>
                                            <span className="text-xs sm:text-sm font-black text-foreground tabular-nums block">
                                                ₹{totalSpent.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Maturity</span>
                                            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                                <Calendar className="size-3 text-emerald-500" />
                                                <span className="tabular-nums">
                                                    {lastPayment 
                                                        ? format(new Date(lastPayment.expiryDate), "dd MMM yy") 
                                                        : (ws.trialExpiresAt ? format(new Date(ws.trialExpiresAt), "dd MMM yy") : "Idle")}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleExpand(ws.id)}
                                                className={cn(
                                                    "h-8 px-2.5 text-xs rounded-lg gap-1 border-border/60 hover:bg-muted/50 cursor-pointer transition-all",
                                                    isExpanded && "bg-primary/10 text-primary border-primary/30 font-bold"
                                                )}
                                            >
                                                <History className="size-3 text-primary" />
                                                <span className="hidden sm:inline">{isExpanded ? "Close" : "Ledger"}</span>
                                                <span className="text-[10px] font-mono opacity-80">({ws.payments.length})</span>
                                                <ChevronDown className={cn("size-3 transition-transform duration-200", isExpanded && "rotate-180")} />
                                            </Button>

                                            <Button
                                                asChild
                                                size="sm"
                                                variant="secondary"
                                                className="h-8 px-2.5 text-xs rounded-lg gap-1 font-semibold"
                                            >
                                                <Link href={`/super-admin/workspaces?id=${ws.id}`}>
                                                    <span>Node</span>
                                                    <ExternalLink className="size-3 opacity-60" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Animated Expandable Transaction History */}
                                <div className={cn(
                                    "grid transition-all duration-300 ease-in-out border-t border-border/40",
                                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                                )}>
                                    <div className="overflow-hidden">
                                        <div className="p-3.5 sm:p-4 bg-muted/20 space-y-3">
                                            <LedgerRecords ws={ws} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls for handling many workspaces */}
            {sortedWorkspaces.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 px-1 text-xs text-muted-foreground border-t border-border/40">
                    <div>
                        Showing <span className="font-semibold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-semibold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, sortedWorkspaces.length)}</span> of <span className="font-semibold text-foreground">{sortedWorkspaces.length}</span> institutional nodes
                    </div>
                    
                    <div className="flex items-center gap-1 self-center sm:self-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            aria-label="Previous Page"
                        >
                            <ChevronLeft className="size-3.5" />
                        </Button>

                        {/* Page Numbers with Elision */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => {
                                const page = i + 1;
                                if (totalPages > 7) {
                                    if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                                        if (page === 2 || page === totalPages - 1) {
                                            return <span key={page} className="px-1 text-xs text-muted-foreground">...</span>;
                                        }
                                        return null;
                                    }
                                }

                                const isSelected = currentPage === page;
                                return (
                                    <Button
                                        key={page}
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        disabled={isSelected}
                                        className={cn(
                                            "size-8 p-0 rounded-lg text-xs cursor-pointer transition-all",
                                            isSelected ? "font-bold shadow-2xs opacity-100" : "hover:bg-muted/50"
                                        )}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            aria-label="Next Page"
                        >
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Smart Ledger Records component with "Load More 10" pagination
function LedgerRecords({ ws }: { ws: any }) {
    // Smart ledger handling: load initial 10, then load more 10 on click
    const [visibleCount, setVisibleCount] = useState(10);

    if (!ws.payments || ws.payments.length === 0) {
        return (
            <div className="py-6 flex flex-col items-center justify-center text-center rounded-xl bg-card border border-border/50 p-4">
                <Receipt className="size-6 text-muted-foreground/60 mb-1.5" />
                <p className="text-xs font-bold text-foreground">No Historical Payments</p>
                <p className="text-[11px] text-muted-foreground">This workspace has not recorded any verified financial transactions yet.</p>
            </div>
        );
    }

    const totalRecords = ws.payments.length;
    const displayedPayments = ws.payments.slice(0, visibleCount);
    const hasMore = visibleCount < totalRecords;

    const handleLoadMore = () => {
        setVisibleCount((prev) => Math.min(prev + 10, totalRecords));
    };

    const handleReset = () => {
        setVisibleCount(10);
    };

    return (
        <div className="space-y-2.5">
            {/* Header info with counter */}
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                    <Receipt className="size-3 text-primary" />
                    <span>Verified Audit Ledger</span>
                </span>
                <span className="font-mono text-[10px]">
                    Showing {displayedPayments.length} of {totalRecords} records
                </span>
            </div>

            {/* List of displayed payments */}
            <div className="space-y-1.5">
                {displayedPayments.map((p: any) => (
                    <div
                        key={p.id}
                        className="bg-card border border-border/60 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-primary/30 transition-colors"
                    >
                        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap min-w-0">
                            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Receipt className="size-3.5" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-foreground">
                                        TX_{p.id.slice(0, 8).toUpperCase()}
                                    </span>
                                    <Badge variant="outline" className="text-[9.5px] px-1.5 py-0 rounded font-semibold text-primary border-primary/20 bg-primary/5">
                                        {p.planName} • {p.duration}
                                    </Badge>
                                </div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                    <span>Cleared: {format(new Date(p.paymentDate), "dd MMM yyyy")}</span>
                                    <span>•</span>
                                    <span>Method: {p.paymentMethod || "Direct"}</span>
                                    {p.referenceNumber && (
                                        <>
                                            <span>•</span>
                                            <span className="font-mono text-muted-foreground/80">Ref: {p.referenceNumber}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto shrink-0 pl-10 sm:pl-0">
                            <div className="text-right">
                                <div className="text-xs sm:text-sm font-black text-foreground tabular-nums">
                                    ₹{(p.totalAmount || p.amount || 0).toLocaleString()}
                                </div>
                                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                    Verified Paid
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    asChild
                                    size="icon"
                                    variant="outline"
                                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                                    title="View & Print Official Receipt"
                                >
                                    <Link href={`/admin/billing/receipt/${p.id}`} target="_blank">
                                        <FileText className="size-3.5" />
                                    </Link>
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to delete this payment record from the ledger?")) {
                                            const res = await deleteManualPayment(p.id);
                                            if (res?.success) {
                                                toast.success("Payment record deleted");
                                            } else {
                                                toast.error("Failed to delete record");
                                            }
                                        }
                                    }}
                                    className="size-7 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-border/60"
                                    title="Delete Entry"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Smart Load More Controls */}
            {hasMore ? (
                <div className="pt-2 flex items-center justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleLoadMore}
                        className="h-8 px-4 text-xs font-semibold rounded-xl gap-2 border-border/60 hover:bg-card cursor-pointer shadow-2xs"
                    >
                        <Plus className="size-3.5 text-primary" />
                        <span>Load 10 More Documents</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                            (+{Math.min(10, totalRecords - visibleCount)} of {totalRecords - visibleCount} remaining)
                        </span>
                    </Button>
                </div>
            ) : totalRecords > 10 ? (
                <div className="pt-2 flex items-center justify-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="h-7 px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded-lg gap-1.5"
                    >
                        <RotateCcw className="size-3" />
                        <span>Collapse to initial 10 records</span>
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
