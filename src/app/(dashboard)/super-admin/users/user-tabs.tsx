"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface UserTabsProps {
    activeRole: string;
    counts: {
        total: number;
        superAdmin: number;
        admin: number;
        teacher: number;
        student: number;
    };
    q?: string;
    sort?: string;
}

export function UserTabs({ activeRole, counts, q = "", sort = "newest" }: UserTabsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Instant optimistic role state for immediate visual response (< 1ms)
    const [optimisticRole, setOptimisticRole] = useState(activeRole || "ALL");

    useEffect(() => {
        setOptimisticRole(activeRole || "ALL");
    }, [activeRole]);

    const handleRoleChange = (role: string) => {
        if (role === optimisticRole) return;
        setOptimisticRole(role);

        const params = new URLSearchParams(searchParams.toString());
        if (role !== "ALL") params.set("role", role);
        else params.delete("role");

        if (q) params.set("q", q);
        else params.delete("q");

        if (sort && sort !== "newest") params.set("sort", sort);
        else params.delete("sort");

        params.set("page", "1");

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const roles = [
        { id: "ALL", label: "All Accounts", count: counts.total, dotColor: "bg-primary" },
        { id: "SUPER_ADMIN", label: "Super Admins", count: counts.superAdmin, dotColor: "bg-purple-500" },
        { id: "ADMIN", label: "Workspace Admins", count: counts.admin, dotColor: "bg-blue-500" },
        { id: "TEACHER", label: "Faculty / Teachers", count: counts.teacher, dotColor: "bg-emerald-500" },
        { id: "STUDENT", label: "Students", count: counts.student, dotColor: "bg-amber-500" },
    ];

    return (
        <div className="flex items-center gap-2">
            <div className="h-10 bg-muted/60 p-1 rounded-xl border border-border/60 flex items-center overflow-x-auto overflow-y-hidden no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden self-start sm:self-auto gap-1 max-w-full">
                {roles.map((tab) => {
                    const isActive = optimisticRole === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleRoleChange(tab.id)}
                            className={cn(
                                "h-8 px-3.5 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer select-none",
                                isActive
                                    ? "bg-card text-foreground shadow-2xs font-bold ring-1 ring-border/50 scale-[1.01]"
                                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                            )}
                        >
                            {isPending && isActive ? (
                                <Loader2 className="size-3 animate-spin text-primary" />
                            ) : (
                                <span className={cn("size-1.5 rounded-full", tab.dotColor)} />
                            )}
                            <span>{tab.label}</span>
                            <span className={cn(
                                "px-1.5 py-0.2 rounded-full font-semibold text-[10px] tabular-nums",
                                isActive ? "bg-muted text-foreground" : "bg-muted/80 text-muted-foreground"
                            )}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {isPending && (
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium animate-pulse pl-1">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span>Loading...</span>
                </div>
            )}
        </div>
    );
}
