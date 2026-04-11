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
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    return (
        <div className="flex flex-col gap-4 w-full relative z-20">
            <div className="flex flex-col lg:flex-row gap-4 w-full items-start lg:items-center bg-white/40 dark:bg-zinc-900/40 p-3 rounded-[2rem] border border-slate-200/50 dark:border-zinc-800/50 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
                
                {/* Search Input - Hero Style */}
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-all duration-300" />
                    <Input
                        placeholder="Search repository..."
                        defaultValue={currentSearch}
                        onChange={(e) => updateFilters("search", e.target.value)}
                        className="pl-11 h-12 rounded-2xl border-none bg-white/80 dark:bg-zinc-800/80 focus-visible:ring-2 focus-visible:ring-indigo-500/50 shadow-sm text-sm font-bold w-full transition-all placeholder:text-slate-400 placeholder:font-medium"
                    />
                    {isPending && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                    )}
                </div>
                
                {/* Filters Row - High Fidelity Selects */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:flex items-center gap-3 w-full lg:w-auto">
                    <div className="w-full lg:w-[160px]">
                        <Select 
                            value={selectedTopic} 
                            onValueChange={(val) => updateFilters("topicId", val)}
                            {...({ modal: false } as any)}
                        >
                            <SelectTrigger className="h-12 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border-none font-bold text-[10px] uppercase tracking-wider focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-zinc-800">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                        <Filter className="w-3 h-3 text-indigo-500" />
                                    </div>
                                    <SelectValue placeholder="Topic" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100 dark:border-zinc-800 overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
                                <SelectItem value="all" className="font-bold text-xs uppercase tracking-tight py-3">All Topics</SelectItem>
                                {topics.map(t => (
                                    <SelectItem key={t.id} value={t.id} className="font-bold text-xs uppercase tracking-tight py-3">{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full lg:w-[170px]">
                        <Select 
                            value={selectedWorkspace} 
                            onValueChange={(val) => updateFilters("workspaceId", val)}
                            {...({ modal: false } as any)}
                        >
                            <SelectTrigger className="h-12 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border-none font-bold text-[10px] uppercase tracking-wider focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition-all text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-zinc-800">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                        <Warehouse className="w-3 h-3 text-emerald-500" />
                                    </div>
                                    <SelectValue placeholder="Workspace" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100 dark:border-zinc-800 overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
                                <SelectItem value="all" className="font-bold text-xs uppercase tracking-tight py-3">All Clusters</SelectItem>
                                <SelectItem value="global" className="font-bold text-xs text-amber-600 uppercase tracking-tight py-3">Global Vault</SelectItem>
                                {workspaces.map(w => (
                                    <SelectItem key={w.id} value={w.id} className="font-bold text-xs uppercase tracking-tight py-3">{w.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full lg:w-[160px] col-span-2 md:col-span-1">
                        <Select 
                            value={currentSort} 
                            onValueChange={(val) => updateFilters("sort", val)}
                            {...({ modal: false } as any)}
                        >
                            <SelectTrigger className="h-12 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border-none font-bold text-[10px] uppercase tracking-wider focus:ring-2 focus:ring-rose-500/50 shadow-sm transition-all text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-zinc-800">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                                        <Clock className="w-3 h-3 text-rose-500" />
                                    </div>
                                    <SelectValue placeholder="Chronology" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100 dark:border-zinc-800 overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
                                <SelectItem value="newest" className="font-bold text-xs uppercase tracking-tight py-3">Most Recent</SelectItem>
                                <SelectItem value="oldest" className="font-bold text-xs uppercase tracking-tight py-3">Legacy First</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Badge Container */}
                <div className="hidden lg:flex shrink-0 ml-auto pl-4 border-l border-slate-200 dark:border-zinc-800">
                    <div className="h-12 px-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center shadow-lg transition-transform hover:scale-[1.02]">
                        {totalCount} Units
                    </div>
                </div>
            </div>

            {/* Mobile Summary Badge */}
            <div className="flex lg:hidden w-full items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Database Inventory</p>
                <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[10px] rounded-lg px-2 py-0.5">
                    {totalCount} Questions
                </Badge>
            </div>
        </div>
    );
}
