"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    ChevronDown, 
    ChevronUp, 
    History, 
    Calendar, 
    FileText, 
    Zap, 
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Trash2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { deleteManualPayment } from "@/actions/financial-actions";

interface WorkspacePaymentsTableProps {
    workspaces: any[];
}

const STATUS_CONFIG: any = {
    ACTIVE: { label: "Active", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400" },
    TRIAL: { label: "Trial", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400" },
    EXPIRED: { label: "Expired", bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400" },
};

const ITEMS_PER_PAGE = 10;

export function WorkspacePaymentsTable({ workspaces }: WorkspacePaymentsTableProps) {
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedWorkspaces = [...workspaces].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        
        let valA: any = a[key];
        let valB: any = b[key];

        if (key === 'ltr') {
            valA = a.payments.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
            valB = b.payments.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
        }

        if (key === 'expiry') {
            valA = a.payments[0]?.expiryDate ? new Date(a.payments[0].expiryDate).getTime() : 0;
            valB = b.payments[0]?.expiryDate ? new Date(b.payments[0].expiryDate).getTime() : 0;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedWorkspaces.length / ITEMS_PER_PAGE);
    const paginatedWorkspaces = sortedWorkspaces.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-6">
            {/* Sorting Controls */}
            <div className="flex flex-wrap items-center gap-2 md:gap-4 px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort Matrix:</span>
                <Button variant="outline" size="sm" onClick={() => handleSort('name')} className={cn("h-8 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all", sortConfig?.key === 'name' ? "bg-primary/10 text-primary border-primary/20" : "")}>
                    Node ID <ArrowUpDown className="w-3 h-3 ml-2 opacity-50" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSort('ltr')} className={cn("h-8 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all", sortConfig?.key === 'ltr' ? "bg-primary/10 text-primary border-primary/20" : "")}>
                    LTV Yield <ArrowUpDown className="w-3 h-3 ml-2 opacity-50" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSort('expiry')} className={cn("h-8 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all", sortConfig?.key === 'expiry' ? "bg-primary/10 text-primary border-primary/20" : "")}>
                    Maturity <ArrowUpDown className="w-3 h-3 ml-2 opacity-50" />
                </Button>
            </div>

            {/* Modern List View */}
            <div className="grid gap-4">
                {paginatedWorkspaces.map((ws) => {
                    const totalSpent = ws.payments.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
                    const lastPayment = ws.payments[0] || null;
                    const isExpired = lastPayment ? new Date(lastPayment.expiryDate) < new Date() : (ws.trialExpiresAt ? new Date(ws.trialExpiresAt) < new Date() : true);
                    const status = isExpired ? "EXPIRED" : (ws.trialExpiresAt && new Date(ws.trialExpiresAt) > new Date() ? "TRIAL" : "ACTIVE");
                    const cfg = STATUS_CONFIG[status];
                    const isExpanded = expandedIds.includes(ws.id);

                    return (
                        <div key={ws.id} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-[0_20px_40px_-12px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] transition-all duration-300">
                            
                            <div className="p-5 md:p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                {/* Core Info */}
                                <div className="flex items-start md:items-center gap-4 lg:gap-6 flex-1">
                                    <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 flex items-center justify-center text-xl font-black text-slate-400 capitalize overflow-hidden">
                                        {ws.name.substring(0,2)}
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-slate-950 dark:text-white uppercase tracking-tight text-lg md:text-xl leading-tight truncate">{ws.name}</span>
                                            <Badge className={cn("hidden lg:inline-flex text-[9px] font-black uppercase border-none px-3 py-1 rounded-lg shadow-sm whitespace-nowrap", cfg.bg, cfg.text)}>
                                                {cfg.label}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{ws.contactEmail || "ledger_pending@hub.io"}</p>
                                        <Badge className={cn("mt-2 lg:hidden w-fit text-[9px] font-black uppercase border-none px-3 py-1 rounded-lg shadow-sm whitespace-nowrap", cfg.bg, cfg.text)}>
                                            {cfg.label}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Metrics Area */}
                                <div className="grid grid-cols-2 md:flex items-center gap-4 lg:gap-12 md:pr-4">
                                    <div className="bg-slate-50 md:bg-transparent dark:bg-zinc-950/50 md:dark:bg-transparent p-4 md:p-0 rounded-2xl flex flex-col">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-0.5 opacity-70">LTV (Gross)</p>
                                        <span className="text-sm md:text-lg font-black text-indigo-600 md:text-slate-950 md:dark:text-white tabular-nums italic">₹{totalSpent.toLocaleString()}</span>
                                    </div>
                                    <div className="bg-slate-50 md:bg-transparent dark:bg-zinc-950/50 md:dark:bg-transparent p-4 md:p-0 rounded-2xl flex flex-col">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-0.5 opacity-70">Maturity</p>
                                        <div className="flex items-center gap-1.5 pt-1 md:pt-0">
                                            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                                            <span className="text-sm md:text-base font-black text-slate-600 dark:text-slate-300 tabular-nums">
                                                {lastPayment ? format(new Date(lastPayment.expiryDate), "dd/MM") : (ws.trialExpiresAt ? format(new Date(ws.trialExpiresAt), "dd/MM") : "IDLE")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-3 pt-2 md:pt-0 shrink-0">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 md:flex-none md:w-32 h-10 md:h-12 rounded-xl text-[10px] uppercase font-black tracking-widest border-slate-200 dark:border-zinc-800 md:hover:bg-slate-50 md:dark:hover:bg-zinc-800"
                                        onClick={() => toggleExpand(ws.id)}
                                    >
                                        {isExpanded ? (
                                            <>Hide Ledger <ChevronUp className="w-3 h-3 ml-2" /></>
                                        ) : (
                                            <>View Ledger <ChevronDown className="w-3 h-3 ml-2" /></>
                                        )}
                                    </Button>
                                    <Button asChild className="flex-1 md:flex-none h-10 md:h-12 px-6 rounded-xl text-[10px] uppercase font-black tracking-widest">
                                        <Link href={`/super-admin/workspaces?id=${ws.id}`}>Access Node</Link>
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Expandable Ledger Detail */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 px-4 md:px-8 py-6">
                                   <LedgerRecords ws={ws} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modern Pagination Section */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 md:py-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] shadow-sm">
                    <p className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest text-center sm:text-left">
                        Showing <span className="text-indigo-600 text-sm">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-indigo-600 text-sm">{Math.min(currentPage * ITEMS_PER_PAGE, sortedWorkspaces.length)}</span> of <span className="text-slate-700 dark:text-white text-sm">{sortedWorkspaces.length}</span> Nodes
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 md:h-12 md:w-12 rounded-xl border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                                if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                                    if (pageNum === 2 || pageNum === totalPages - 1) {
                                        return <span key={pageNum} className="text-slate-300 dark:text-zinc-600 px-2 font-black">...</span>;
                                    }
                                    return null;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "ghost"}
                                        className={cn(
                                            "h-10 w-10 md:h-12 md:w-12 rounded-xl font-black text-xs md:text-sm transition-all",
                                            currentPage !== pageNum && "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800"
                                        )}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 md:h-12 md:w-12 rounded-xl border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Extracted LedgerRecords component using grid layout instead of HTML table
function LedgerRecords({ ws }: { ws: any }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Transaction Logs</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-80 mt-0.5">Verified Audit Subsystem</p>
                    </div>
                </div>
                <Badge variant="outline" className="border-slate-200 dark:border-zinc-800 px-4 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-widest text-slate-500 bg-white dark:bg-zinc-900">
                    {ws.payments.length} Artifacts
                </Badge>
            </div>

            {ws.payments.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
                    <Zap className="w-8 h-8 text-slate-300 mb-3" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Zero financial artifacts detected</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {ws.payments.map((p: any) => (
                        <div key={p.id} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 flex-1">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Entry Ref</span>
                                    <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">TX_{p.id.slice(0, 4)}...</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plan Model</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black uppercase text-indigo-600 tracking-tighter">{p.planName}</span>
                                        <span className="text-[9px] font-bold py-0.5 px-2 bg-slate-100 dark:bg-zinc-800 rounded-md text-slate-500 opacity-80">{p.duration}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cleared On</span>
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 tabular-nums">
                                        {format(new Date(p.paymentDate), "dd MMM yyyy")}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 mt-4 md:mt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800/50">
                                <div className="flex flex-col text-left md:text-right">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Value</span>
                                    <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                        ₹{p.totalAmount.toLocaleString()}
                                    </div>
                                    <span className="text-[8px] font-black text-emerald-500 uppercase leading-none mt-1">Processed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button asChild size="icon" variant="outline" className="h-10 w-10 rounded-xl border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 hover:text-indigo-600 transition-colors shadow-sm">
                                        <Link href={`/admin/billing/receipt/${p.id}`} title="Download Receipt">
                                            <FileText className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="outline" 
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to delete this payment entry? This will permanently remove the record from the ledger.")) {
                                                await deleteManualPayment(p.id);
                                            }
                                        }}
                                        className="h-10 w-10 rounded-xl border-slate-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600 transition-colors shadow-sm" 
                                        title="Delete Entry"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
