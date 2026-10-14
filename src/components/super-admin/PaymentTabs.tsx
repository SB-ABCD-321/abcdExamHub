"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { History, ShieldCheck, BarChart3, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PaymentTabsProps {
    pendingCount: number;
    workspacesCount: number;
    activeTab: "ledger" | "verification" | "analytics";
    onTabChange: (tab: "ledger" | "verification" | "analytics") => void;
}

export function PaymentTabs({
    pendingCount,
    workspacesCount,
    activeTab,
    onTabChange
}: PaymentTabsProps) {
    return (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full">
            <div className="h-10 bg-muted/60 p-1 rounded-xl border border-border/60 flex items-center gap-1">
                {/* Unified Ledger Tab */}
                <button
                    type="button"
                    onClick={() => onTabChange("ledger")}
                    className={cn(
                        "h-8 px-3.5 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer select-none",
                        activeTab === "ledger"
                            ? "bg-card text-foreground shadow-2xs font-bold ring-1 ring-border/50 scale-[1.01]"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                    )}
                >
                    <History className="size-3.5 text-primary" />
                    <span>Unified Ledger</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-semibold text-[10px] tabular-nums">
                        {workspacesCount}
                    </span>
                </button>

                {/* Verification Queue Tab */}
                <button
                    type="button"
                    onClick={() => onTabChange("verification")}
                    className={cn(
                        "h-8 px-3.5 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer select-none",
                        activeTab === "verification"
                            ? "bg-card text-foreground shadow-2xs font-bold ring-1 ring-border/50 scale-[1.01]"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                    )}
                >
                    <ShieldCheck className={cn("size-3.5", pendingCount > 0 ? "text-amber-500" : "text-muted-foreground")} />
                    <span>Verification Queue</span>
                    {pendingCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] tabular-nums animate-pulse">
                            {pendingCount}
                        </span>
                    )}
                </button>

                {/* Revenue Analytics Tab */}
                <button
                    type="button"
                    onClick={() => onTabChange("analytics")}
                    className={cn(
                        "h-8 px-3.5 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer select-none",
                        activeTab === "analytics"
                            ? "bg-card text-foreground shadow-2xs font-bold ring-1 ring-border/50 scale-[1.01]"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                    )}
                >
                    <BarChart3 className="size-3.5 text-indigo-500" />
                    <span>Revenue Analytics</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[9.5px]">
                        Charts
                    </span>
                </button>
            </div>
        </div>
    );
}
