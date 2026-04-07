"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export function TransactionTable({ transactions }: { transactions: any[] }) {
    if (transactions.length === 0) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center bg-white dark:bg-zinc-900 rounded-[3rem] border border-dashed text-slate-400 font-medium italic">
                No financial records found in the current filter.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border-none shadow-[0_12px_44px_-12px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[800px]">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-zinc-950/50">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-slate-400 pl-8 h-14">Type</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Category/Note</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Workspace</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Date</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 pr-8 h-14">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((t) => (
                                <TableRow key={t.id} className="border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                                    <TableCell className="pl-8 py-4">
                                        <div className="flex items-center gap-2">
                                            {t.type === 'INCOME' ? (
                                                <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                t.type === 'INCOME' ? "text-emerald-600" : "text-red-500"
                                            )}>
                                                {t.type}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">{t.category}</p>
                                            <p className="text-[10px] font-medium text-slate-500 italic truncate max-w-[200px]">{t.description}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        {t.workspace ? (
                                            <Badge variant="outline" className="rounded-full text-[9px] font-bold uppercase border-slate-200 bg-slate-50 dark:bg-zinc-800 dark:border-zinc-700">
                                                {t.workspace.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Platform Global</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                                        {new Date(t.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="pr-8 py-4 text-right">
                                        <span className={cn(
                                            "text-sm font-black italic tracking-tighter",
                                            t.type === 'INCOME' ? "text-emerald-600" : "text-red-500"
                                        )}>
                                            {t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
