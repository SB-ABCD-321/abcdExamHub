"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface RequestTabsProps {
    activeTab: "pending" | "approved" | "rejected";
    counts: {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    };
    q?: string;
}

export function RequestTabs({ activeTab, counts, q = "" }: RequestTabsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Optimistic tab selection for instant visual response (< 1ms)
    const [optimisticTab, setOptimisticTab] = useState(activeTab);

    // Sync state when URL updates
    useEffect(() => {
        setOptimisticTab(activeTab);
    }, [activeTab]);

    const handleTabChange = (targetTab: "pending" | "approved" | "rejected") => {
        if (targetTab === optimisticTab) return;
        setOptimisticTab(targetTab);

        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", targetTab);
        params.set("page", "1");
        if (q) params.set("q", q);
        else params.delete("q");

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="flex items-center gap-1.5">
            <div className="h-10 bg-muted/60 p-1 rounded-xl border border-border/60 flex items-center overflow-x-auto overflow-y-hidden no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden self-start sm:self-auto gap-1 max-w-full">
                {/* Waitlist Tab */}
                <button
                    type="button"
                    onClick={() => handleTabChange("pending")}
                    className={cn(
                        "h-8 px-3.5 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer select-none",
                        optimisticTab === "pending"
                            ? "bg-card text-foreground shadow-2xs font-bold ring-1 ring-border/50 scale-[1.01]"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                    )}
                >
                    {isPending && optimisticTab === "pending" ? (
                        <Loader2 className="size-3 animate-spin text-amber-500" />
                    ) : (
                        <span className="size-1.5 rounded-full bg-amber-500" />
                    )}
                    <span>Waitlist</span>
                    {counts.pending > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] tabular-nums">
                            {counts.pending}
                        </span>
                    )}
                </button>

                {/* Authorized Tab */}
                <button
                    type="button"
                    onClick={() => handleTabChange("approved")}
                    className={cn(
                        "h-8 px-3.5 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer select-none",
                        optimisticTab === "approved"
                            ? "bg-card text-foreground shadow-2xs font-bold ring-1 ring-border/50 scale-[1.01]"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                    )}
                >
                    {isPending && optimisticTab === "approved" ? (
                        <Loader2 className="size-3 animate-spin text-emerald-500" />
                    ) : (
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                    )}
                    <span>Authorized</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-semibold text-[10px] tabular-nums">
                        {counts.approved}
                    </span>
                </button>

                {/* Rejected Tab */}
                <button
                    type="button"
                    onClick={() => handleTabChange("rejected")}
                    className={cn(
                        "h-8 px-3.5 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer select-none",
                        optimisticTab === "rejected"
                            ? "bg-card text-foreground shadow-2xs font-bold ring-1 ring-border/50 scale-[1.01]"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                    )}
                >
                    {isPending && optimisticTab === "rejected" ? (
                        <Loader2 className="size-3 animate-spin text-rose-500" />
                    ) : (
                        <span className="size-1.5 rounded-full bg-rose-500" />
                    )}
                    <span>Rejected</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-semibold text-[10px] tabular-nums">
                        {counts.rejected}
                    </span>
                </button>
            </div>

            {/* Subtle loading pulse when any tab transition is in flight */}
            {isPending && (
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium animate-pulse pl-2">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span>Loading...</span>
                </div>
            )}
        </div>
    );
}
