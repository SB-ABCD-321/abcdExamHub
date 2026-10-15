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
import { Search, SortAsc, LayoutGrid, Trophy, BookOpen, Table, Clock, Target, Calendar, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    const [viewMode, setViewMode] = useState<"card" | "table">("card");
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const filterAndSort = (list: any[]) => {
        if (!Array.isArray(list)) return [];
        let result = list.filter(item => {
            if (!item) return false;
            const exam = item.exam || item;
            if (!exam) return false;
            const title = exam.title || "";
            const workspaceName = exam.workspace?.name || "";

            return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                workspaceName.toLowerCase().includes(searchQuery.toLowerCase());
        });

        result.sort((itemA, itemB) => {
            const a = itemA?.exam || itemA;
            const b = itemB?.exam || itemB;
            if (!a || !b) return 0;

            if (sortBy === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            if (sortBy === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
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

    const activeList = activeTab === "available" ? filteredAvailable : filteredHistory;
    const totalPages = Math.ceil(activeList.length / pageSize) || 1;
    const paginatedList = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return activeList.slice(start, start + pageSize);
    }, [activeList, currentPage, pageSize]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        setCurrentPage(1);
    };

    const renderTableView = (items: any[], variant: "available" | "history") => {
        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-border/60 bg-muted/20">
                    <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-3" />
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">No matching examinations found</p>
                </div>
            );
        }

        return (
            <div className="border border-border/50 rounded-2xl overflow-hidden bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[750px]">
                        <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border/40 text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3">Examination Details</th>
                                <th className="px-5 py-3 text-center">Duration</th>
                                <th className="px-5 py-3 text-center">Questions & Marks</th>
                                <th className="px-5 py-3 text-center">Pass Target</th>
                                {variant === "history" && <th className="px-5 py-3 text-center">Your Score</th>}
                                <th className="px-5 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-foreground">
                            {items.map((item) => {
                                if (!item) return null;
                                const exam = variant === 'history' ? item.exam : item;
                                if (!exam) return null;
                                const isPassed = item.score !== undefined && item.score >= (exam.passMarks || 0);
                                const totalMarks = (exam._count?.questions || 0) * (exam.marksPerQuestion || 1);

                                return (
                                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-5 py-3.5 max-w-[320px]">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20 px-1.5 py-0 h-4">
                                                        {exam.workspace?.name || "General"}
                                                    </Badge>
                                                    {variant === "history" && item.createdAt && (
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short' }).format(new Date(item.createdAt))}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug" title={exam.title}>
                                                    {exam.title}
                                                </h4>
                                                {exam.description && (
                                                    <p className="text-[11px] text-muted-foreground line-clamp-1 truncate">
                                                        {exam.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-center font-mono font-medium">
                                            <div className="inline-flex items-center gap-1 bg-muted/40 px-2.5 py-1 rounded-lg">
                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                {exam.duration}m
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="font-bold text-foreground">{exam._count?.questions || 0} Qs</span>
                                                <span className="text-[10px] text-muted-foreground">{totalMarks} Total Pts</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="font-bold text-xs bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-foreground">
                                                {exam.passMarks} Pts
                                            </span>
                                        </td>
                                        {variant === "history" && (
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="font-extrabold text-sm text-foreground">{item.score} Pts</span>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5",
                                                        isPassed 
                                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" 
                                                            : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                                    )}>
                                                        {isPassed ? "Passed" : "Failed"}
                                                    </span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-5 py-3.5 text-right">
                                            {variant === "history" ? (
                                                <Link href={`/student/results/${item.id}`}>
                                                    <Button variant="outline" className="h-8 px-3 rounded-lg font-bold text-xs gap-1 hover:bg-primary/10 hover:text-primary transition-all">
                                                        Report
                                                        <ArrowRight className="w-3 h-3" />
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Link href={`/student/exams/${exam.id}/start`}>
                                                    <Button className="h-8 px-3.5 rounded-lg font-bold text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all">
                                                        Start Exam
                                                        <ArrowRight className="w-3 h-3" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderCardGrid = (items: any[], variant: "available" | "history") => {
        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-20 rounded-2xl border border-dashed border-border/60 bg-muted/20">
                    <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">No matching examinations found</p>
                </div>
            );
        }

        return (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {items.map(item => {
                    if (!item) return null;
                    const exam = variant === 'history' ? item.exam : item;
                    if (!exam) return null;
                    return (
                        <ModernExamCard
                            key={item.id}
                            exam={exam}
                            variant={variant}
                            attemptDate={variant === 'history' ? item.createdAt : undefined}
                            score={variant === 'history' ? item.score : undefined}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-5">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search assessments by title or workspace..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 h-10 rounded-xl border border-border/60 bg-card focus-visible:ring-primary shadow-xs text-xs"
                    />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setCurrentPage(1); }}>
                        <SelectTrigger className="h-9 w-[150px] rounded-xl border border-border/60 bg-card font-bold text-xs gap-1.5 px-3">
                            <SortAsc className="w-3.5 h-3.5 text-primary shrink-0" />
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-border/60 shadow-lg">
                            <SelectItem value="newest" className="font-semibold text-xs">Latest First</SelectItem>
                            <SelectItem value="oldest" className="font-semibold text-xs">Oldest First</SelectItem>
                            <SelectItem value="marks" className="font-semibold text-xs">Highest Marks</SelectItem>
                            <SelectItem value="duration" className="font-semibold text-xs">Shortest Time</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center border border-border/60 rounded-xl p-0.5 bg-card">
                        <Button
                            variant={viewMode === "card" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("card")}
                            className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Cards</span>
                        </Button>
                        <Button
                            variant={viewMode === "table" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("table")}
                            className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1"
                        >
                            <Table className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Table</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <Tabs defaultValue="available" value={activeTab} className="w-full" onValueChange={handleTabChange}>
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <TabsList className="h-10 bg-muted/40 p-1 rounded-xl gap-1">
                        <TabsTrigger
                            value="available"
                            className="rounded-lg h-8 px-4 data-[state=active]:bg-card data-[state=active]:text-foreground font-bold text-xs transition-all shadow-xs"
                        >
                            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                            Available Tests ({filteredAvailable.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="rounded-lg h-8 px-4 data-[state=active]:bg-card data-[state=active]:text-foreground font-bold text-xs transition-all shadow-xs"
                        >
                            <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                            Completed History ({filteredHistory.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Pagination Selector */}
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-medium">Show:</span>
                        <Select value={pageSize.toString()} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
                            <SelectTrigger className="h-8 w-[75px] rounded-lg border border-border/60 text-xs font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border border-border/60">
                                <SelectItem value="10" className="text-xs font-semibold">10</SelectItem>
                                <SelectItem value="20" className="text-xs font-semibold">20</SelectItem>
                                <SelectItem value="50" className="text-xs font-semibold">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="mt-5">
                    <TabsContent value="available" className="m-0 focus-visible:outline-none">
                        {viewMode === "card" 
                            ? renderCardGrid(paginatedList, "available") 
                            : renderTableView(paginatedList, "available")}
                    </TabsContent>
                    <TabsContent value="history" className="m-0 focus-visible:outline-none">
                        {viewMode === "card" 
                            ? renderCardGrid(paginatedList, "history") 
                            : renderTableView(paginatedList, "history")}
                    </TabsContent>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-6">
                        <p className="text-xs text-muted-foreground font-medium">
                            Showing page <span className="font-bold text-foreground">{currentPage}</span> of <span className="font-bold text-foreground">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="h-8 w-8 p-0 rounded-lg border-border/60"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 w-8 p-0 rounded-lg border-border/60"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Tabs>
        </div>
    );
}
