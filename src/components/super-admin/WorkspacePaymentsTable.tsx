"use client";

import { useState, Fragment } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    ChevronDown, 
    ChevronUp, 
    History, 
    Calendar, 
    FileText, 
    Zap, 
    ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface WorkspacePaymentsTableProps {
    workspaces: any[];
}

const STATUS_CONFIG: any = {
    ACTIVE: { label: "Active", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400" },
    TRIAL: { label: "Trial", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400" },
    EXPIRED: { label: "Expired", bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400" },
};

export function WorkspacePaymentsTable({ workspaces }: WorkspacePaymentsTableProps) {
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

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

        // Custom LTV sorting
        if (key === 'ltr') {
            valA = a.payments.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
            valB = b.payments.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
        }

        // Custom Expiry sorting
        if (key === 'expiry') {
            valA = a.payments[0]?.expiryDate ? new Date(a.payments[0].expiryDate).getTime() : 0;
            valB = b.payments[0]?.expiryDate ? new Date(b.payments[0].expiryDate).getTime() : 0;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.06)]">
            <div className="overflow-x-auto selection:bg-primary/10">
                <div className="inline-block min-w-full align-middle">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-zinc-950/30">
                            <TableRow className="border-none h-16 md:h-20">
                                <TableHead className="w-[60px] md:w-[80px]"></TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest pl-2 md:pl-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">
                                        Target Node <ArrowUpDown className="w-3 h-3 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-primary" onClick={() => handleSort('ltr')}>
                                    <div className="flex items-center gap-2">
                                        LTV <ArrowUpDown className="w-3 h-3 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-primary" onClick={() => handleSort('expiry')}>
                                    <div className="flex items-center gap-2">
                                        Due <ArrowUpDown className="w-3 h-3 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-6 md:pr-12">Control</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedWorkspaces.map((ws) => {
                                const isExpanded = expandedIds.includes(ws.id);
                                const totalSpent = ws.payments.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
                                const lastPayment = ws.payments[0] || null;
                                const isExpired = lastPayment ? new Date(lastPayment.expiryDate) < new Date() : (ws.trialExpiresAt ? new Date(ws.trialExpiresAt) < new Date() : true);
                                const status = isExpired ? "EXPIRED" : (ws.trialExpiresAt && new Date(ws.trialExpiresAt) > new Date() ? "TRIAL" : "ACTIVE");
                                const cfg = STATUS_CONFIG[status];

                                return (
                                    <Fragment key={ws.id}>
                                        <TableRow className={cn(
                                            "border-slate-50 dark:border-zinc-800 transition-all group",
                                            isExpanded ? "bg-slate-50/50 dark:bg-zinc-800/40" : "hover:bg-slate-50/20 dark:hover:bg-zinc-800/10"
                                        )}>
                                            <TableCell className="w-[60px] md:w-[80px] pl-4 md:pl-8">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-transform"
                                                    onClick={() => toggleExpand(ws.id)}
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-4 h-4 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-black text-slate-950 dark:text-white uppercase tracking-tight text-sm md:text-base group-hover:text-primary transition-colors truncate max-w-[120px] md:max-w-none">{ws.name}</span>
                                                    <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[180px]">
                                                        {ws.contactEmail || "ledger_pending@hub.io"}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center px-2">
                                                <Badge className={cn("text-[7px] md:text-[8px] font-black uppercase border-none px-2 md:px-3 py-1 rounded-lg shadow-sm whitespace-nowrap", cfg.bg, cfg.text)}>
                                                    {cfg.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs md:text-sm font-black text-indigo-600 tabular-nums italic">₹{totalSpent.toLocaleString()}</span>
                                                    <span className="hidden sm:block text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic opacity-60">Deposits: {ws._count.payments}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 md:gap-2">
                                                    <Calendar className="w-3 md:w-3.5 h-3 md:h-3.5 text-slate-300" />
                                                    <span className="text-[10px] md:text-xs font-black text-slate-600 dark:text-slate-400 tabular-nums">
                                                        {lastPayment ? format(new Date(lastPayment.expiryDate), "dd/MM") : (ws.trialExpiresAt ? format(new Date(ws.trialExpiresAt), "dd/MM") : "IDLE")}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-4 md:pr-12 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button asChild size="sm" variant="ghost" className="h-8 md:h-9 px-2 md:px-3 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-zinc-800">
                                                        <Link href={`/super-admin/workspaces?id=${ws.id}`}>Access</Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        
                                        {/* Expandable History Area */}
                                        {isExpanded && (
                                            <TableRow className="bg-slate-50/50 dark:bg-zinc-950/20 border-none">
                                                <TableCell colSpan={6} className="p-0">
                                                    <div className="px-4 md:px-12 py-6 md:py-10 space-y-4 md:space-y-6 animate-in slide-in-from-top-4 duration-300 overflow-x-auto">
                                                        <div className="flex items-center justify-between min-w-[300px]">
                                                            <div className="flex items-center gap-2 md:gap-3">
                                                                <div className="w-8 md:w-10 h-8 md:h-10 rounded-lg md:rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                                    <History className="w-4 md:w-5 h-4 md:h-5" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xs md:text-sm font-black uppercase tracking-tight">Ledger Records</h4>
                                                                    <p className="hidden md:block text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Verified institutional shard audit (v1.1)</p>
                                                                </div>
                                                            </div>
                                                            <Badge variant="outline" className="border-slate-200 dark:border-zinc-800 px-3 md:px-4 py-1 rounded-full font-bold text-[8px] md:text-[9px] uppercase tracking-widest text-slate-500">
                                                                {ws.payments.length} Items
                                                            </Badge>
                                                        </div>

                                                        {ws.payments.length === 0 ? (
                                                            <div className="py-8 md:py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-[1.5rem] md:rounded-[2rem]">
                                                                <Zap className="w-6 md:w-8 h-6 md:h-8 text-slate-200 mb-3" />
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Zero financial artifacts detected</p>
                                                            </div>
                                                        ) : (
                                                            <div className="rounded-xl md:rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm bg-white dark:bg-zinc-900 -mx-4 md:mx-0 overflow-x-auto">
                                                                <div className="inline-block min-w-full align-middle">
                                                                    <Table>
                                                                        <TableHeader className="bg-slate-50/50 dark:bg-zinc-950/50">
                                                                            <TableRow className="border-none h-10 md:h-12 text-slate-400 opacity-60">
                                                                                <TableHead className="text-[8px] md:text-[9px] font-black uppercase tracking-widest pl-4 md:pl-6">REF</TableHead>
                                                                                <TableHead className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Plan Artifact</TableHead>
                                                                                <TableHead className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Post</TableHead>
                                                                                <TableHead className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-right">Value</TableHead>
                                                                                <TableHead className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-right pr-4 md:pr-6 whitespace-nowrap">Proof</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {ws.payments.map((p: any) => (
                                                                                <TableRow key={p.id} className="border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-all group/sub">
                                                                                    <TableCell className="pl-4 md:pl-6 py-3 md:py-4 font-mono text-[9px] md:text-[10px] font-bold text-slate-400">
                                                                                        TX_{p.id.slice(0, 4)}...
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <div className="flex flex-col gap-0.5">
                                                                                            <span className="text-[10px] md:text-xs font-black uppercase text-indigo-600 italic tracking-tighter truncate max-w-[80px] md:max-w-none">{p.planName}</span>
                                                                                            <span className="text-[8px] font-bold text-slate-300 opacity-60">{p.duration}</span>
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell className="text-[10px] md:text-xs font-black text-slate-600 dark:text-slate-400 tabular-nums">
                                                                                        {format(new Date(p.paymentDate), "dd/MM")}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-right">
                                                                                        <div className="text-[11px] md:text-xs font-black text-slate-900 dark:text-white tabular-nums italic">
                                                                                            ₹{p.totalAmount.toLocaleString()}
                                                                                        </div>
                                                                                        <p className="text-[7px] font-black text-emerald-500 uppercase italic leading-none mt-0.5">Settled</p>
                                                                                    </TableCell>
                                                                                    <TableCell className="pr-4 md:pr-6 text-right">
                                                                                        <Button asChild size="icon" variant="ghost" className="h-7 md:h-8 w-7 md:w-8 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 group/btn transition-all">
                                                                                            <Link href={`/admin/billing/receipt/${p.id}`} title="Verify Proof">
                                                                                                <FileText className="w-3.5 md:w-4 h-3.5 md:h-4 text-slate-400 group-hover/btn:text-indigo-600 transition-colors" />
                                                                                            </Link>
                                                                                        </Button>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
