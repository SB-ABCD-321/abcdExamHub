"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Warehouse, Clock } from "lucide-react";
import { useTransition } from "react";

export function QuestionBankFilters({ 
    topics, 
    workspaces,
    selectedTopic, 
    selectedWorkspace,
    currentSort,
    currentSearch,
    totalCount
}: { 
    topics: any[], 
    workspaces: any[],
    selectedTopic: string, 
    selectedWorkspace: string,
    currentSort: string,
    currentSearch: string,
    totalCount: number
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete("page");
        
        startTransition(() => {
            // CRITICAL: Disable scroll to top on navigation to prevent the "jump"
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 w-full items-center">
            {/* Search Input - Flex 1 on desktop */}
            <div className="relative flex-1 group w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Search query..."
                    defaultValue={currentSearch}
                    onChange={(e) => updateFilters("search", e.target.value)}
                    className="pl-12 h-11 rounded-xl border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 focus-visible:ring-primary shadow-sm w-full"
                />
            </div>
            
            {/* Filters Row - Scrollable on mobile, in-line on desktop (md+) */}
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 w-full md:w-auto">
                <div className="flex-shrink-0 w-[130px] md:w-32 lg:w-40">
                    <Select 
                        value={selectedTopic} 
                        onValueChange={(val) => updateFilters("topicId", val)}
                        {...({ modal: false } as any)}
                    >
                        <SelectTrigger className="h-11 rounded-xl bg-white/50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 font-bold text-[10px] lg:text-xs uppercase tracking-tight focus:ring-primary shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                            <div className="flex items-center gap-2 overflow-hidden px-1">
                                <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <SelectValue placeholder="Topic" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl border-none">
                            <SelectItem value="all" className="font-bold text-xs uppercase tracking-tighter">All Topics</SelectItem>
                            {topics.map(t => (
                                <SelectItem key={t.id} value={t.id} className="font-bold text-xs uppercase tracking-tighter">{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-shrink-0 w-[130px] md:w-32 lg:w-40">
                    <Select 
                        value={selectedWorkspace} 
                        onValueChange={(val) => updateFilters("workspaceId", val)}
                        {...({ modal: false } as any)}
                    >
                        <SelectTrigger className="h-11 rounded-xl bg-white/50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 font-bold text-[10px] lg:text-xs uppercase tracking-tight focus:ring-primary shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                            <div className="flex items-center gap-2 overflow-hidden px-1">
                                <Warehouse className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <SelectValue placeholder="Workspace" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl border-none">
                            <SelectItem value="all" className="font-bold text-xs uppercase tracking-tighter">All Workspaces</SelectItem>
                            <SelectItem value="global" className="font-bold text-xs text-amber-600 uppercase tracking-tighter">Global Only</SelectItem>
                            {workspaces.map(w => (
                                <SelectItem key={w.id} value={w.id} className="font-bold text-xs uppercase tracking-tighter">{w.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-shrink-0 w-[130px] md:w-32 lg:w-40">
                    <Select 
                        value={currentSort} 
                        onValueChange={(val) => updateFilters("sort", val)}
                        {...({ modal: false } as any)}
                    >
                        <SelectTrigger className="h-11 rounded-xl bg-white/50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 font-bold text-[10px] lg:text-xs uppercase tracking-tight focus:ring-primary shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                            <div className="flex items-center gap-2 overflow-hidden px-1">
                                <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <SelectValue placeholder="Sort" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl border-none">
                            <SelectItem value="newest" className="font-bold text-xs uppercase tracking-tighter">Newest First</SelectItem>
                            <SelectItem value="oldest" className="font-bold text-xs uppercase tracking-tighter">Oldest First</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Total Questions Badge - Integrated in same row on desktop (md+) */}
            <div className="w-full md:w-auto flex-shrink-0">
                <Badge className="w-full md:w-fit h-11 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest px-6 border-none shadow-lg rounded-xl flex items-center justify-center whitespace-nowrap">
                    {totalCount} Questions
                </Badge>
            </div>
        </div>
    );
}
