"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function WorkspaceSearch({ defaultValue }: { defaultValue?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleChange = useCallback((value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set("search", value);
            params.set("page", "1");
        } else {
            params.delete("search");
            params.delete("page");
        }
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }, [router, pathname, searchParams]);

    return (
        <div className="relative w-full sm:w-72">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${isPending ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
            <Input
                defaultValue={defaultValue}
                onChange={e => handleChange(e.target.value)}
                placeholder="Search workspaces..."
                className="pl-9 pr-9 h-10 rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium"
            />
            {defaultValue && (
                <button
                    onClick={() => handleChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
