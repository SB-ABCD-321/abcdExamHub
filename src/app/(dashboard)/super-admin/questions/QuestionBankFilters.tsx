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
        <div className="flex flex-col gap-3 w-full relative z-20">
            <div className="flex flex-col md:flex-row gap-3 w-full items-center bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-[1.25rem] border border-slate-200/60 dark:border-zinc-800/60 backdrop-blur-xl shadow-sm">
                
                {/* Search Input */}
                <div className="relative flex-1 w-full min-w-[200px] group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search through all questions..."
                        defaultValue={currentSearch}
                        onChange={(e) => updateFilters("search", e.target.value)}
                        className="pl-10 h-10 rounded-xl border-none bg-white dark:bg-zinc-800 focus-visible:ring-1 focus-visible:ring-indigo-500 shadow-sm text-sm font-semibold w-full transition-all"
                    />
                </div>
                
                {/* Filters Row */}
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide py-1 md:py-0 shrink-0 -mx-1 px-1 md:mx-0 md:px-0">
                    <div className="w-[130px] shrink-0">
                        <Select 
                            value={selectedTopic} 
                            onValueChange={(val) => updateFilters("topicId", val)}
                            {...({ modal: false } as any)}
                        >
                            <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-zinc-800 border-none font-bold text-[10px] uppercase tracking-tight focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <SelectValue placeholder="Topic" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl border-slate-100 dark:border-zinc-800">
                                <SelectItem value="all" className="font-bold text-xs uppercase tracking-tighter">All Topics</SelectItem>
                                {topics.map(t => (
                                    <SelectItem key={t.id} value={t.id} className="font-bold text-xs uppercase tracking-tighter">{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[140px] shrink-0">
                        <Select 
                            value={selectedWorkspace} 
                            onValueChange={(val) => updateFilters("workspaceId", val)}
                            {...({ modal: false } as any)}
                        >
                            <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-zinc-800 border-none font-bold text-[10px] uppercase tracking-tight focus:ring-1 focus:ring-emerald-500 shadow-sm transition-all text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Warehouse className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <SelectValue placeholder="Workspace" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl border-slate-100 dark:border-zinc-800">
                                <SelectItem value="all" className="font-bold text-xs uppercase tracking-tighter">All Workspaces</SelectItem>
                                <SelectItem value="global" className="font-bold text-xs text-amber-600 uppercase tracking-tighter">Global Only</SelectItem>
                                {workspaces.map(w => (
                                    <SelectItem key={w.id} value={w.id} className="font-bold text-xs uppercase tracking-tighter">{w.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[125px] shrink-0">
                        <Select 
                            value={currentSort} 
                            onValueChange={(val) => updateFilters("sort", val)}
                            {...({ modal: false } as any)}
                        >
                            <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-zinc-800 border-none font-bold text-[10px] uppercase tracking-tight focus:ring-1 focus:ring-rose-500 shadow-sm transition-all text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <SelectValue placeholder="Sort" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl border-slate-100 dark:border-zinc-800">
                                <SelectItem value="newest" className="font-bold text-xs uppercase tracking-tighter">Newest First</SelectItem>
                                <SelectItem value="oldest" className="font-bold text-xs uppercase tracking-tighter">Oldest First</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Badge Row (Desktop) */}
                <div className="hidden md:flex shrink-0 border-l border-slate-200 dark:border-zinc-700 pl-3">
                    <Badge className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider px-4 border-none shadow-md rounded-xl flex items-center justify-center whitespace-nowrap transition-colors">
                        Total {totalCount}
                    </Badge>
                </div>
            </div>

            {/* Mobile Badge */}
            <div className="flex md:hidden w-full">
                <Badge className="w-full h-10 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-4 border-none shadow-md rounded-xl flex items-center justify-center whitespace-nowrap">
                    Total {totalCount} Questions
                </Badge>
            </div>
        </div>
    );
}
