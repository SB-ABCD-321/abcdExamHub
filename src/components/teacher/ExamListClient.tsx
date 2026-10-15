"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    ClipboardList,
    Search,
    X,
    LayoutGrid,
    Table as TableIcon,
    Clock,
    CheckCircle2,
    Trophy,
    Eye,
    Edit3,
    CalendarClock,
    PlusCircle,
    Bot,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Filter,
    Users,
    Sparkles,
    Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UniversalDeleteAction } from "@/components/shared/UniversalDeleteAction";
import { ExamQuickActions } from "@/app/(dashboard)/teacher/exams/ExamQuickActions";
import { cn } from "@/lib/utils";

export interface ExamRecord {
    id: string;
    title: string;
    description: string | null;
    workspaceId: string;
    isPublic: boolean;
    status: "ACTIVE" | "PAUSED" | "INACTIVE";
    passMarks: number;
    duration: number;
    marksPerQuestion: number;
    negativeMarksEnabled: boolean;
    negativeMarksValue: number;
    startTime: Date | string | null;
    endTime: Date | string | null;
    updatedAt: Date | string;
    createdAt: Date | string;
    accessType?: string;
    workspace: { name: string };
    author?: { firstName: string | null; lastName: string | null; email: string } | null;
    _count: {
        questions: number;
        results: number;
    };
}

interface ExamListClientProps {
    exams: ExamRecord[];
    isTeacher?: boolean;
}

export function ExamListClient({ exams, isTeacher = false }: ExamListClientProps) {
    const [viewMode, setViewMode] = useState<"table" | "card">("table");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [scopeFilter, setScopeFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("newest");

    // Pagination state
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Format dates cleanly
    const formatDate = (date: Date | string | null) => {
        if (!date) return "No limit";
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        }).format(new Date(date));
    };

    // Status Badge Component
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                    </span>
                );
            case "PAUSED":
                return (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Paused
                    </span>
                );
            case "INACTIVE":
                return (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                        Disabled
                    </span>
                );
            default:
                return null;
        }
    };

    // Filter and sort exams
    const filteredExams = useMemo(() => {
        let result = [...exams];

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(
                (e) =>
                    e.title.toLowerCase().includes(q) ||
                    (e.description && e.description.toLowerCase().includes(q)) ||
                    e.workspace.name.toLowerCase().includes(q) ||
                    (e.author?.firstName && e.author.firstName.toLowerCase().includes(q)) ||
                    (e.author?.email && e.author.email.toLowerCase().includes(q))
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter((e) => e.status === statusFilter);
        }

        // Scope filter
        if (scopeFilter === "public") {
            result = result.filter((e) => e.isPublic);
        } else if (scopeFilter === "private") {
            result = result.filter((e) => !e.isPublic);
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === "title") return a.title.localeCompare(b.title);
            if (sortBy === "questions") return b._count.questions - a._count.questions;
            if (sortBy === "participants") return b._count.results - a._count.results;
            if (sortBy === "duration") return b.duration - a.duration;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return result;
    }, [exams, searchQuery, statusFilter, scopeFilter, sortBy]);

    // Paginated subset
    const totalPages = Math.ceil(filteredExams.length / pageSize) || 1;
    const paginatedExams = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredExams.slice(start, start + pageSize);
    }, [filteredExams, currentPage, pageSize]);

    return (
        <div className="space-y-4">
            {/* TOOLBAR CONTROLS: SEARCH, FILTERS, VIEW SWITCHER & PAGE SIZE */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search examination title, workspace or author..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-9.5 pl-9 pr-8 text-xs font-medium rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setCurrentPage(1);
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Right Toolbar Controls */}
                    <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                        {/* Status Filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={(val) => {
                                setStatusFilter(val);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="h-9 w-28 rounded-xl text-xs font-semibold border-border/60 bg-background/50">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="PAUSED">Paused</SelectItem>
                                <SelectItem value="INACTIVE">Disabled</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Scope Filter */}
                        <Select
                            value={scopeFilter}
                            onValueChange={(val) => {
                                setScopeFilter(val);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="h-9 w-28 rounded-xl text-xs font-semibold border-border/60 bg-background/50">
                                <SelectValue placeholder="Scope" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Scope</SelectItem>
                                <SelectItem value="public">Global</SelectItem>
                                <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Page Size Selector */}
                        <Select
                            value={String(pageSize)}
                            onValueChange={(val) => {
                                setPageSize(Number(val));
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="h-9 w-24 rounded-xl text-xs font-semibold border-border/60 bg-background/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="10">10 / Page</SelectItem>
                                <SelectItem value="20">20 / Page</SelectItem>
                                <SelectItem value="50">50 / Page</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* View Switcher: Table vs Cards */}
                        <div className="flex items-center p-0.5 rounded-xl border border-border/60 bg-muted/30">
                            <button
                                type="button"
                                onClick={() => setViewMode("table")}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                                    viewMode === "table"
                                        ? "bg-card text-foreground shadow-2xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="Table View"
                            >
                                <TableIcon className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Table</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("card")}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                                    viewMode === "card"
                                        ? "bg-card text-foreground shadow-2xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="Card View"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Cards</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-bar: Item Count & Active Filters Indicator */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <span className="font-semibold">
                        Showing {filteredExams.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, filteredExams.length)} of {filteredExams.length} examinations
                    </span>

                    {(searchQuery || statusFilter !== "all" || scopeFilter !== "all") && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                                setScopeFilter("all");
                                setCurrentPage(1);
                            }}
                            className="text-primary hover:underline font-bold cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* EMPTY STATE */}
            {filteredExams.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border-2 border-dashed border-border/60 bg-card/60 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                        <ClipboardList className="w-6 h-6 opacity-40" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">No Examinations Found</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                            {exams.length === 0
                                ? "No exams have been architected in this workspace yet. Get started by launching a quick setup."
                                : "No examinations match your current query or filter criteria."}
                        </p>
                    </div>
                    {exams.length === 0 ? (
                        <div className="flex items-center gap-2 pt-2">
                            <Link href="/teacher/exams/new?mode=auto">
                                <Button size="sm" className="h-9 px-3.5 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5">
                                    <Bot className="w-3.5 h-3.5" />
                                    <span>Quick Setup</span>
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                                setScopeFilter("all");
                            }}
                            className="text-xs font-bold text-primary cursor-pointer"
                        >
                            Clear all filters
                        </Button>
                    )}
                </div>
            ) : viewMode === "table" ? (
                /* ================= TABLE VIEW ================= */
                <Card className="border border-border/70 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-bold uppercase tracking-wider text-[10.5px]">
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[240px]">Examination Title</th>
                                    <th className="py-3 px-3 text-center">Status</th>
                                    <th className="py-3 px-3 text-center">Scope</th>
                                    <th className="py-3 px-3 text-center">Questions</th>
                                    <th className="py-3 px-3 text-center">Total Marks</th>
                                    <th className="py-3 px-3 text-center">Duration</th>
                                    <th className="py-3 px-3 text-center">Candidates</th>
                                    <th className="py-3 px-4 text-right min-w-[150px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {paginatedExams.map((exam, idx) => {
                                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                                    const totalMarks = exam._count.questions * (exam.marksPerQuestion ?? 1);

                                    return (
                                        <tr
                                            key={exam.id}
                                            className="hover:bg-muted/30 transition-colors group"
                                        >
                                            {/* Row Number */}
                                            <td className="py-3 px-4 text-center font-bold text-muted-foreground/80 tabular-nums">
                                                {rowNumber}
                                            </td>

                                            {/* Title & Metadata (2-line clamped) */}
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <Link
                                                        href={`/teacher/exams/${exam.id}/edit`}
                                                        className="font-bold text-foreground text-xs sm:text-sm hover:text-primary transition-colors line-clamp-2 leading-snug"
                                                        title={exam.title}
                                                    >
                                                        {exam.title}
                                                    </Link>
                                                    <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground mt-0.5">
                                                        <span className="font-medium text-foreground/80">
                                                            {exam.workspace.name}
                                                        </span>
                                                        <span>•</span>
                                                        <span>Pass: {exam.passMarks} pts</span>
                                                        {exam.negativeMarksEnabled && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-rose-500 font-semibold">
                                                                    -{exam.negativeMarksValue} neg
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-3 text-center">
                                                {renderStatusBadge(exam.status)}
                                            </td>

                                            {/* Scope */}
                                            <td className="py-3 px-3 text-center">
                                                {exam.isPublic ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                    >
                                                        Global
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 border-border/70 text-muted-foreground"
                                                    >
                                                        Private
                                                    </Badge>
                                                )}
                                            </td>

                                            {/* Questions Count */}
                                            <td className="py-3 px-3 text-center font-bold text-foreground tabular-nums">
                                                {exam._count.questions} Qs
                                            </td>

                                            {/* Total Marks */}
                                            <td className="py-3 px-3 text-center font-bold text-foreground tabular-nums">
                                                {totalMarks} pts
                                            </td>

                                            {/* Duration */}
                                            <td className="py-3 px-3 text-center text-muted-foreground font-semibold tabular-nums">
                                                {exam.duration} mins
                                            </td>

                                            {/* Candidates / Results */}
                                            <td className="py-3 px-3 text-center">
                                                <Link
                                                    href={`/teacher/exams/${exam.id}/results`}
                                                    className="inline-flex items-center gap-1 font-bold text-foreground hover:text-primary transition-colors text-xs"
                                                >
                                                    <Users className="w-3 h-3 text-muted-foreground" />
                                                    <span>{exam._count.results}</span>
                                                </Link>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Test Paper preview */}
                                                    <Link
                                                        href={`/exam/${exam.id}?test=true`}
                                                        target="_blank"
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                                        title="Candidate Test Paper Simulation"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Link>

                                                    {/* Results / Leaderboard */}
                                                    <Link
                                                        href={`/teacher/exams/${exam.id}/results`}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                        title="Student Performance & Results"
                                                    >
                                                        <Trophy className="w-3.5 h-3.5" />
                                                    </Link>

                                                    {/* Edit */}
                                                    <Link
                                                        href={`/teacher/exams/${exam.id}/edit`}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                        title="Edit Exam"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </Link>

                                                    {/* Quick Actions Dropdown (Share, Status Switcher, History) */}
                                                    <ExamQuickActions
                                                        examId={exam.id}
                                                        examTitle={exam.title}
                                                        examStatus={exam.status}
                                                        accessType={exam.accessType}
                                                    />

                                                    {/* Delete */}
                                                    <UniversalDeleteAction
                                                        type="EXAM"
                                                        id={exam.id}
                                                        name={exam.title}
                                                        variant="icon"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                /* ================= CARD VIEW ================= */
                <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedExams.map((exam) => {
                        const totalMarks = exam._count.questions * (exam.marksPerQuestion ?? 1);

                        return (
                            <Card
                                key={exam.id}
                                className="group border border-border/70 bg-card/90 backdrop-blur-xl rounded-2xl shadow-2xs hover:shadow-md hover:border-primary/40 transition-all overflow-hidden flex flex-col justify-between"
                            >
                                <CardHeader className="p-4 sm:p-5 pb-3 space-y-3">
                                    {/* Top Metadata Row */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Badge
                                                variant="secondary"
                                                className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-muted text-foreground/80 border border-border/60"
                                            >
                                                {exam.workspace.name}
                                            </Badge>
                                            {renderStatusBadge(exam.status)}
                                            {exam.isPublic && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                >
                                                    Global
                                                </Badge>
                                            )}
                                        </div>

                                        <ExamQuickActions
                                            examId={exam.id}
                                            examTitle={exam.title}
                                            examStatus={exam.status}
                                            accessType={exam.accessType}
                                        />
                                    </div>

                                    {/* Title (2-line clamped) */}
                                    <div>
                                        <Link
                                            href={`/teacher/exams/${exam.id}/edit`}
                                            className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug"
                                            title={exam.title}
                                        >
                                            {exam.title}
                                        </Link>
                                        <p className="text-[10.5px] text-muted-foreground font-medium mt-1">
                                            By {exam.author?.firstName || exam.author?.lastName ? `${exam.author.firstName || ""} ${exam.author.lastName || ""}`.trim() : exam.author?.email || "Faculty"} • Edited {formatDate(exam.updatedAt)}
                                        </p>
                                    </div>

                                    {/* Quick Info Grid */}
                                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                        <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-border/50">
                                            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <div>
                                                <span className="text-[9.5px] uppercase font-bold text-muted-foreground block leading-none">Duration</span>
                                                <span className="font-bold text-foreground text-xs">{exam.duration} mins</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-border/50">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            <div>
                                                <span className="text-[9.5px] uppercase font-bold text-muted-foreground block leading-none">Pass Marks</span>
                                                <span className="font-bold text-foreground text-xs">{exam.passMarks} pts</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
                                    {/* 3-Cell Metrics Strip */}
                                    <div className="grid grid-cols-3 gap-1 p-1 bg-muted/20 rounded-xl border border-border/50 text-center">
                                        <div className="p-1.5">
                                            <span className="text-base font-black text-foreground block tabular-nums">{exam._count.questions}</span>
                                            <span className="text-[9.5px] font-bold uppercase text-muted-foreground tracking-wider">Questions</span>
                                        </div>
                                        <div className="p-1.5 border-x border-border/50">
                                            <span className="text-base font-black text-foreground block tabular-nums">{totalMarks}</span>
                                            <span className="text-[9.5px] font-bold uppercase text-muted-foreground tracking-wider">Total Pts</span>
                                        </div>
                                        <div className="p-1.5">
                                            <span className="text-base font-black text-foreground block tabular-nums">{exam._count.results}</span>
                                            <span className="text-[9.5px] font-bold uppercase text-muted-foreground tracking-wider">Attempts</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                                        <Link href={`/teacher/exams/${exam.id}/edit`} className="flex-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-8.5 rounded-xl font-bold text-xs border-border/70 text-foreground hover:bg-muted/50"
                                            >
                                                <Edit3 className="w-3.5 h-3.5 mr-1" />
                                                <span>Edit</span>
                                            </Button>
                                        </Link>

                                        <Link href={`/teacher/exams/${exam.id}/results`} className="flex-1">
                                            <Button
                                                size="sm"
                                                className="w-full h-8.5 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs gap-1"
                                            >
                                                <Trophy className="w-3.5 h-3.5" />
                                                <span>Results</span>
                                            </Button>
                                        </Link>

                                        <Link href={`/exam/${exam.id}?test=true`} target="_blank">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8.5 w-8.5 rounded-xl border-border/70 text-muted-foreground hover:text-foreground"
                                                title="Preview Exam"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                        </Link>

                                        <UniversalDeleteAction
                                            type="EXAM"
                                            id={exam.id}
                                            name={exam.title}
                                            variant="icon"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs">
                    <span className="text-xs font-semibold text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>

                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="h-8 px-2.5 rounded-xl text-xs font-bold border-border/70"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                            <span>Prev</span>
                        </Button>

                        <div className="hidden sm:flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, idx, arr) => {
                                    const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                                    return (
                                        <div key={p} className="flex items-center">
                                            {showEllipsis && (
                                                <span className="px-1.5 text-xs text-muted-foreground">...</span>
                                            )}
                                            <Button
                                                type="button"
                                                variant={p === currentPage ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(p)}
                                                className={cn(
                                                    "h-8 w-8 p-0 rounded-xl text-xs font-bold",
                                                    p === currentPage ? "bg-primary text-primary-foreground shadow-2xs" : "border-border/70"
                                                )}
                                            >
                                                {p}
                                            </Button>
                                        </div>
                                    );
                                })}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="h-8 px-2.5 rounded-xl text-xs font-bold border-border/70"
                        >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
