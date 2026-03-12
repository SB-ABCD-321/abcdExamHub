"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ModernExamCard } from "./ModernExamCard";
import { Search, SortAsc, LayoutGrid, Trophy, BookOpen } from "lucide-react";

interface ExamClientSectionProps {
    availableExams: any[];
    historyExams: any[];
}

export function ExamClientSection({
    availableExams,
    historyExams
}: ExamClientSectionProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [activeTab, setActiveTab] = useState("available");

    const filterAndSort = (list: any[]) => {
        let result = list.filter(item => {
            const exam = item.exam || item; // Handle history (nested) vs others (direct)
            const title = exam.title || "";
            const workspaceName = exam.workspace?.name || "";

            return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                workspaceName.toLowerCase().includes(searchQuery.toLowerCase());
        });


        result.sort((itemA, itemB) => {
            const a = itemA.exam || itemA;
            const b = itemB.exam || itemB;

            if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortBy === "marks") {
                const totalA = (a._count?.questions || 0) * (a.marksPerQuestion || 1);
                const totalB = (b._count?.questions || 0) * (b.marksPerQuestion || 1);
                return totalB - totalA;
            }
            if (sortBy === "duration") return (a.duration || 0) - (b.duration || 0);
            return 0;
        });


        return result;
    };

    const filteredAvailable = useMemo(() => filterAndSort(availableExams), [availableExams, searchQuery, sortBy]);
    const filteredHistory = useMemo(() => filterAndSort(historyExams), [historyExams, searchQuery, sortBy]);

    const renderGrid = (exams: any[], variant: "available" | "history") => {
        if (exams.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                    <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">No matching missions found</p>
                </div>
            );
        }

        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {exams.map(exam => (
                    <ModernExamCard
                        key={exam.id}
                        exam={variant === 'history' ? exam.exam : exam}
                        variant={variant}
                        attemptDate={variant === 'history' ? exam.createdAt : undefined}
                        score={variant === 'history' ? exam.score : undefined}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
                <div className="relative w-full lg:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by title or hub name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus-visible:ring-primary shadow-sm text-sm"
                    />
                </div>

                <div className="flex w-full lg:w-auto gap-3">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="!h-14 w-full lg:w-[200px] rounded-full border-none bg-slate-50 dark:bg-zinc-800/50 font-black text-[10px] sm:text-xs uppercase tracking-widest px-5">
                            <div className="flex items-center gap-2">
                                <SortAsc className="w-4 h-4 text-indigo-600" />
                                <SelectValue placeholder="Sort" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="newest" className="font-bold">Latest First</SelectItem>
                            <SelectItem value="oldest" className="font-bold">Oldest First</SelectItem>
                            <SelectItem value="marks" className="font-bold">Highest Marks</SelectItem>
                            <SelectItem value="duration" className="font-bold">Shortest Tasks</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabs & Content */}
            <Tabs defaultValue="available" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="h-14 w-full lg:w-fit bg-slate-100/50 dark:bg-zinc-900/50 p-1 rounded-full gap-2 flex justify-start lg:justify-center overflow-x-auto no-scrollbar shadow-inner border border-slate-200/50 dark:border-zinc-800/50 backdrop-blur-md">
                    <TabsTrigger
                        value="available"
                        className="shrink-0 rounded-full h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_8px_16px_rgba(var(--primary-rgb),0.3)] bg-transparent text-slate-600 dark:text-slate-400 font-bold text-sm transition-all hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 duration-300"
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Available ({filteredAvailable.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="shrink-0 rounded-full h-full px-6 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-[0_8px_16px_rgba(16,185,129,0.3)] bg-transparent text-slate-600 dark:text-slate-400 font-bold text-sm transition-all hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 duration-300"
                    >
                        <Trophy className="w-4 h-4 mr-2" />
                        History ({filteredHistory.length})
                    </TabsTrigger>
                </TabsList>

                <div className="mt-10">
                    <TabsContent value="available" className="m-0 focus-visible:outline-none">
                        {renderGrid(filteredAvailable, "available")}
                    </TabsContent>
                    <TabsContent value="history" className="m-0 focus-visible:outline-none">
                        {renderGrid(filteredHistory, "history")}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
