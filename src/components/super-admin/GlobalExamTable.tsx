"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
    ClipboardList,
    Building2,
    User,
    Mail,
    Clock,
    HelpCircle,
    FileCheck,
    Target,
    Trash2,
    ExternalLink,
    Eye,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    Download,
    CheckCircle2,
    PauseCircle,
    XCircle,
    AlertTriangle,
    Loader2,
    Check,
    Layers,
    Lock,
    Globe,
    Calendar,
    Sparkles,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from "@/components/ui/alert-dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteGlobalExamAction, updateGlobalExamStatusAction } from "@/actions/super-admin-crud";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface GlobalExamTableProps {
    exams: any[];
}

const ITEMS_PER_PAGE = 10;

export default function GlobalExamTable({ exams: initialExams }: GlobalExamTableProps) {
    const [exams, setExams] = useState(initialExams);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [workspaceFilter, setWorkspaceFilter] = useState("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "questions" | "results" | "alpha">("newest");
    const [currentPage, setCurrentPage] = useState(1);

    // Modal / Drawer states
    const [inspectExam, setInspectExam] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

    // Extract unique workspaces for filtering
    const workspaces = useMemo(() => {
        const map = new Map<string, string>();
        exams.forEach((e) => {
            if (e.workspace?.id && e.workspace?.name) {
                map.set(e.workspace.id, e.workspace.name);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [exams]);

    // Filter and sort exams
    const filteredExams = useMemo(() => {
        return exams
            .filter((exam) => {
                const query = search.trim().toLowerCase();
                const matchesSearch =
                    !query ||
                    exam.title.toLowerCase().includes(query) ||
                    (exam.description && exam.description.toLowerCase().includes(query)) ||
                    (exam.workspace?.name && exam.workspace.name.toLowerCase().includes(query)) ||
                    (exam.author?.firstName && exam.author.firstName.toLowerCase().includes(query)) ||
                    (exam.author?.lastName && exam.author.lastName.toLowerCase().includes(query)) ||
                    (exam.author?.email && exam.author.email.toLowerCase().includes(query)) ||
                    exam.id.toLowerCase().includes(query);

                const matchesStatus =
                    statusFilter === "all" || exam.status === statusFilter;

                const matchesWorkspace =
                    workspaceFilter === "all" || exam.workspace?.id === workspaceFilter;

                return matchesSearch && matchesStatus && matchesWorkspace;
            })
            .sort((a, b) => {
                if (sortBy === "newest") {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
                if (sortBy === "oldest") {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                }
                if (sortBy === "questions") {
                    return (b._count?.questions || 0) - (a._count?.questions || 0);
                }
                if (sortBy === "results") {
                    return (b._count?.results || 0) - (a._count?.results || 0);
                }
                if (sortBy === "alpha") {
                    return a.title.localeCompare(b.title);
                }
                return 0;
            });
    }, [exams, search, statusFilter, workspaceFilter, sortBy]);

    // Status tab counts
    const statusCounts = useMemo(() => {
        return {
            all: exams.length,
            ACTIVE: exams.filter((e) => e.status === "ACTIVE").length,
            PAUSED: exams.filter((e) => e.status === "PAUSED").length,
            INACTIVE: exams.filter((e) => e.status === "INACTIVE").length,
        };
    }, [exams]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredExams.length / ITEMS_PER_PAGE);
    const paginatedExams = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredExams.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredExams, currentPage]);

    // Handle delete action
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await deleteGlobalExamAction(deleteTarget.id);
            if (res.success) {
                setExams((prev) => prev.filter((e) => e.id !== deleteTarget.id));
                toast.success(`Exam "${deleteTarget.title}" deleted permanently.`);
                setDeleteTarget(null);
                if (inspectExam?.id === deleteTarget.id) setInspectExam(null);
            } else {
                toast.error(res.error || "Failed to delete exam record.");
            }
        } catch {
            toast.error("An unexpected error occurred while deleting the assessment.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle status toggle
    const handleStatusChange = async (examId: string, newStatus: "ACTIVE" | "PAUSED" | "INACTIVE") => {
        setStatusUpdatingId(examId);
        try {
            const res = await updateGlobalExamStatusAction(examId, newStatus);
            if (res.success) {
                setExams((prev) =>
                    prev.map((e) => (e.id === examId ? { ...e, status: newStatus } : e))
                );
                if (inspectExam?.id === examId) {
                    setInspectExam((prev: any) => ({ ...prev, status: newStatus }));
                }
                toast.success(`Exam status updated to ${newStatus}`);
            } else {
                toast.error(res.error || "Failed to update exam status");
            }
        } catch {
            toast.error("An error occurred while updating status.");
        } finally {
            setStatusUpdatingId(null);
        }
    };

    // Export manifest as CSV
    const handleExportCSV = () => {
        if (filteredExams.length === 0) {
            toast.error("No exams available to export.");
            return;
        }

        const headers = ["ID", "Title", "Workspace", "Workspace ID", "Author Name", "Author Email", "Status", "Duration (mins)", "Questions", "Results", "Pass Marks", "Created At"];
        const rows = filteredExams.map((e) => [
            `"${e.id}"`,
            `"${e.title.replace(/"/g, '""')}"`,
            `"${(e.workspace?.name || "").replace(/"/g, '""')}"`,
            `"${e.workspace?.id || ""}"`,
            `"${([e.author?.firstName, e.author?.lastName].filter(Boolean).join(" ") || "Unknown").replace(/"/g, '""')}"`,
            `"${e.author?.email || ""}"`,
            `"${e.status}"`,
            e.duration || 0,
            e._count?.questions || 0,
            e._count?.results || 0,
            e.passMarks || 0,
            `"${format(new Date(e.createdAt), 'yyyy-MM-dd HH:mm')}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `global_exams_manifest_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Exported ${filteredExams.length} assessment records to CSV.`);
    };

    return (
        <div className="space-y-4">
            {/* SEARCH, STATUS TABS, AND FILTER TOOLBAR (TWO-LINE RESPONSIVE ON MOBILE) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 bg-card p-3 rounded-2xl border border-border/60 shadow-2xs">
                {/* Line 1: Search Bar (w-full on mobile, compact lg:w-64 xl:w-72 on desktop) */}
                <div className="relative w-full lg:w-64 xl:w-72 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search exams, workspaces, authors..."
                        className="w-full pl-8.5 pr-8 h-8.5 text-xs rounded-xl bg-background border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setCurrentPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Line 2 on Mobile: Horizontally Scrollable Tabs, Workspaces, Sort & Export */}
                <div className="w-full lg:w-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
                    {/* Status Tabs */}
                    <div className="h-8.5 bg-muted/60 p-0.5 rounded-xl border border-border/60 flex items-center shrink-0 gap-0.5">
                        {[
                            { id: "all", label: "All", count: statusCounts.all },
                            { id: "ACTIVE", label: "Active", count: statusCounts.ACTIVE, dot: "bg-emerald-500" },
                            { id: "PAUSED", label: "Paused", count: statusCounts.PAUSED, dot: "bg-amber-500" },
                            { id: "INACTIVE", label: "Inactive", count: statusCounts.INACTIVE, dot: "bg-rose-500" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(tab.id);
                                    setCurrentPage(1);
                                }}
                                className={cn(
                                    "px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap select-none",
                                    statusFilter === tab.id
                                        ? "bg-card text-foreground shadow-2xs font-bold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab.dot && <span className={cn("size-1.5 rounded-full", tab.dot)} />}
                                <span>{tab.label}</span>
                                <span className="font-mono text-[10px] opacity-70 tabular-nums">({tab.count})</span>
                            </button>
                        ))}
                    </div>

                    {/* Workspace Selector Dropdown */}
                    {workspaces.length > 1 && (
                        <select
                            value={workspaceFilter}
                            onChange={(e) => {
                                setWorkspaceFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-8.5 px-2.5 text-[11px] font-semibold rounded-xl bg-card border border-border/60 text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer shrink-0 whitespace-nowrap"
                        >
                            <option value="all">All Workspaces ({workspaces.length})</option>
                            {workspaces.map((ws) => (
                                <option key={ws.id} value={ws.id}>
                                    {ws.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Sort Selector Dropdown */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="h-8.5 px-2.5 text-[11px] font-semibold rounded-xl bg-card border border-border/60 text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                        <option value="newest">Newest Created</option>
                        <option value="oldest">Oldest Created</option>
                        <option value="questions">Most Questions</option>
                        <option value="results">Most Submissions</option>
                        <option value="alpha">Alphabetical (A-Z)</option>
                    </select>

                    {/* Export CSV Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="h-8.5 px-3 rounded-xl border-border/60 hover:bg-muted font-semibold text-xs gap-1.5 shadow-2xs cursor-pointer select-none shrink-0 whitespace-nowrap"
                        title="Export filtered manifest to CSV"
                    >
                        <Download className="size-3.5 text-primary" />
                        <span>Export CSV</span>
                    </Button>
                </div>
            </div>

            {/* EXAM LIST */}
            {paginatedExams.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-border/60 p-6 shadow-2xs">
                    <div className="size-11 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
                        <ClipboardList className="size-5.5" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">No Assessments Found</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                        {search || statusFilter !== "all" || workspaceFilter !== "all"
                            ? "No exam manifest records match your search terms or active filters."
                            : "There are currently no examination models recorded in the platform database."}
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {paginatedExams.map((exam) => {
                        const isActive = exam.status === "ACTIVE";
                        const isPaused = exam.status === "PAUSED";
                        const isInactive = exam.status === "INACTIVE";

                        const authorName = [exam.author?.firstName, exam.author?.lastName].filter(Boolean).join(" ") || "System / Unassigned";

                        return (
                            <div
                                key={exam.id}
                                className="group relative overflow-hidden border border-border/60 bg-card rounded-xl shadow-2xs hover:border-primary/40 transition-all duration-150"
                            >
                                {/* Left Status Accent Bar */}
                                <div
                                    className={cn(
                                        "absolute left-0 top-0 bottom-0 w-1",
                                        isActive ? "bg-emerald-500" : isPaused ? "bg-amber-500" : "bg-rose-500"
                                    )}
                                />

                                {/* DESKTOP & TABLET ROW (md:flex) - Balanced 3-Section Architecture */}
                                <div className="hidden md:flex items-center justify-between py-3 px-4 pl-4.5 gap-4">
                                    {/* Left: Exam Identity & Workspace Origin */}
                                    <div className="flex items-center gap-3.5 min-w-[240px] max-w-[280px] shrink-0">
                                        <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs shrink-0">
                                            <ClipboardList className="size-5" />
                                        </div>

                                        <div className="min-w-0 space-y-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <h3
                                                    className="text-xs sm:text-sm font-bold text-foreground truncate block max-w-[190px]"
                                                    title={exam.title}
                                                >
                                                    {exam.title}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                <Building2 className="size-3 text-indigo-500 shrink-0" />
                                                <span
                                                    className="font-semibold text-foreground/90 truncate max-w-[130px]"
                                                    title={exam.workspace?.name}
                                                >
                                                    {exam.workspace?.name}
                                                </span>
                                                <span>•</span>
                                                <span className="text-[10px] font-mono opacity-70">
                                                    #{exam.id.slice(0, 6)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center: Author & Assessment Telemetry (Centered & Spanning Middle) */}
                                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-4 px-4 border-x border-border/40">
                                        {/* Column 1: Author Contact */}
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                <User className="size-3.5 text-muted-foreground shrink-0" />
                                                <span className="truncate max-w-[150px]" title={authorName}>
                                                    {authorName}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                <Mail className="size-3 text-muted-foreground/70 shrink-0" />
                                                <span className="truncate max-w-[160px]" title={exam.author?.email}>
                                                    {exam.author?.email || "No email"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Column 2: Assessment Metrics (Duration, Questions, Submissions) */}
                                        <div className="min-w-0 flex items-center gap-3 text-[11px] text-muted-foreground">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1 font-semibold text-foreground">
                                                    <Clock className="size-3 text-primary" />
                                                    <span>{exam.duration}m</span>
                                                </div>
                                                <span className="text-[9.5px] uppercase font-bold text-muted-foreground block">
                                                    Duration
                                                </span>
                                            </div>

                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1 font-semibold text-foreground">
                                                    <HelpCircle className="size-3 text-blue-500" />
                                                    <span className="tabular-nums">{exam._count?.questions || 0}</span>
                                                </div>
                                                <span className="text-[9.5px] uppercase font-bold text-muted-foreground block">
                                                    Questions
                                                </span>
                                            </div>

                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1 font-semibold text-foreground">
                                                    <FileCheck className="size-3 text-emerald-500" />
                                                    <span className="tabular-nums">{exam._count?.results || 0}</span>
                                                </div>
                                                <span className="text-[9.5px] uppercase font-bold text-muted-foreground block">
                                                    Results
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Status Dropdown & Action Icons */}
                                    <div className="flex items-center justify-end gap-2.5 min-w-[210px] shrink-0">
                                        {/* Status Toggle Menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    disabled={statusUpdatingId === exam.id}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer select-none",
                                                        isActive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20",
                                                        isPaused && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/20",
                                                        isInactive && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/20"
                                                    )}
                                                >
                                                    {statusUpdatingId === exam.id ? (
                                                        <Loader2 className="size-2.5 animate-spin" />
                                                    ) : (
                                                        <span
                                                            className={cn(
                                                                "size-1.5 rounded-full",
                                                                isActive ? "bg-emerald-500 animate-pulse" : isPaused ? "bg-amber-500" : "bg-rose-500"
                                                            )}
                                                        />
                                                    )}
                                                    <span>{exam.status}</span>
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-border/60 text-xs w-36">
                                                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                    Update Status
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusChange(exam.id, "ACTIVE")}
                                                    className="gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400 font-semibold"
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    <span>Set Active</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusChange(exam.id, "PAUSED")}
                                                    className="gap-2 cursor-pointer text-amber-600 dark:text-amber-400 font-semibold"
                                                >
                                                    <PauseCircle className="size-3.5" />
                                                    <span>Set Paused</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusChange(exam.id, "INACTIVE")}
                                                    className="gap-2 cursor-pointer text-rose-600 dark:text-rose-400 font-semibold"
                                                >
                                                    <XCircle className="size-3.5" />
                                                    <span>Set Inactive</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* Action Buttons: Inspect, Edit/Direct, Delete */}
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => setInspectExam(exam)}
                                                className="size-8 rounded-lg text-primary hover:bg-primary/10 border-border/60 cursor-pointer"
                                                title="Inspect Assessment Dossier"
                                            >
                                                <Eye className="size-3.5" />
                                            </Button>

                                            <Button
                                                asChild
                                                size="icon"
                                                variant="outline"
                                                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border-border/60 cursor-pointer"
                                                title="Open Exam Editor"
                                            >
                                                <Link href={`/teacher/exams/${exam.id}/edit`}>
                                                    <ExternalLink className="size-3.5" />
                                                </Link>
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => setDeleteTarget(exam)}
                                                className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border-border/60 cursor-pointer"
                                                title="Delete Assessment Record"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* MOBILE DEDICATED CARD (md:hidden) */}
                                <div className="md:hidden p-3.5 space-y-3 pl-4">
                                    {/* Mobile Header: Title + Workspace + Status */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="size-8.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                                <ClipboardList className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-foreground truncate max-w-[170px]" title={exam.title}>
                                                    {exam.title}
                                                </h4>
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Building2 className="size-2.5 text-indigo-500" />
                                                    <span className="truncate max-w-[120px] font-semibold">{exam.workspace?.name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                                                isActive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
                                                isPaused && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
                                                isInactive && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                                            )}
                                        >
                                            {exam.status}
                                        </Badge>
                                    </div>

                                    {/* Mobile Telemetry Metrics Badges */}
                                    <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-muted/30 border border-border/40 text-center text-xs">
                                        <div>
                                            <span className="text-[9px] text-muted-foreground uppercase font-bold block">Duration</span>
                                            <span className="font-bold text-foreground">{exam.duration}m</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-muted-foreground uppercase font-bold block">Questions</span>
                                            <span className="font-bold text-foreground">{exam._count?.questions || 0}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-muted-foreground uppercase font-bold block">Attempts</span>
                                            <span className="font-bold text-foreground">{exam._count?.results || 0}</span>
                                        </div>
                                    </div>

                                    {/* Mobile Footer Toolbar */}
                                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            {format(new Date(exam.createdAt), 'dd MMM yyyy')}
                                        </span>

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setInspectExam(exam)}
                                                className="h-7 px-2 text-[10px] rounded-lg text-primary gap-1"
                                            >
                                                <Eye className="size-3" />
                                                <span>Inspect</span>
                                            </Button>

                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2 text-[10px] rounded-lg text-muted-foreground"
                                            >
                                                <Link href={`/teacher/exams/${exam.id}/edit`}>
                                                    <ExternalLink className="size-3" />
                                                </Link>
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => setDeleteTarget(exam)}
                                                className="size-7 rounded-lg text-rose-500 hover:bg-rose-500/10 border-border/60"
                                                title="Delete record"
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* PAGINATION CONTROLS */}
            {filteredExams.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 px-1 text-xs text-muted-foreground border-t border-border/40">
                    <div>
                        Showing <span className="font-semibold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-semibold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredExams.length)}</span> of <span className="font-semibold text-foreground">{filteredExams.length}</span> recorded assessments
                    </div>

                    <div className="flex items-center gap-1 self-center sm:self-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            aria-label="Previous Page"
                        >
                            <ChevronLeft className="size-3.5" />
                        </Button>

                        {/* Page Numbers with Elision */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => {
                                const page = i + 1;
                                if (totalPages > 7) {
                                    if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                                        if (page === 2 || page === totalPages - 1) {
                                            return <span key={page} className="px-1 text-xs text-muted-foreground">...</span>;
                                        }
                                        return null;
                                    }
                                }

                                const isSelected = currentPage === page;
                                return (
                                    <Button
                                        key={page}
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        disabled={isSelected}
                                        className={cn(
                                            "size-8 p-0 rounded-lg text-xs cursor-pointer transition-all",
                                            isSelected ? "font-bold shadow-2xs opacity-100" : "hover:bg-muted/50"
                                        )}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            aria-label="Next Page"
                        >
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* INSPECTION SLIDE-OVER DRAWER */}
            <Sheet open={!!inspectExam} onOpenChange={(open) => !open && setInspectExam(null)}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-lg p-0 flex flex-col justify-between border-l border-border/60 bg-card text-card-foreground shadow-2xl"
                >
                    {/* Drawer Header */}
                    <div className="p-5 sm:p-6 border-b border-border/50 space-y-1.5">
                        <div className="flex items-center gap-2.5">
                            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <ClipboardList className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <SheetTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                                    {inspectExam?.title}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground truncate">
                                    Assessment Telemetry & Blueprint Dossier
                                </SheetDescription>
                            </div>
                        </div>
                    </div>

                    {/* Drawer Scrollable Content */}
                    <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 no-scrollbar">
                        {/* Status & Identity Card */}
                        <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Status & Access Architecture
                                </span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider",
                                        inspectExam?.status === "ACTIVE" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
                                        inspectExam?.status === "PAUSED" && "bg-amber-500/10 text-amber-600 border-amber-500/25",
                                        inspectExam?.status === "INACTIVE" && "bg-rose-500/10 text-rose-600 border-rose-500/25"
                                    )}
                                >
                                    {inspectExam?.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-[10px] text-muted-foreground font-semibold block">Origin Workspace</span>
                                    <span className="font-bold text-foreground">{inspectExam?.workspace?.name}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground font-semibold block">Access Visibility</span>
                                    <span className="font-bold text-foreground">
                                        {inspectExam?.isPublic ? "Public Assessment" : "Workspace Private"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Assessment Configuration Blueprint */}
                        <div className="space-y-2.5">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <SlidersHorizontal className="size-3.5 text-primary" />
                                <span>Examination Parameters</span>
                            </h4>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="p-3 rounded-xl border border-border/50 bg-card text-center space-y-0.5">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">Duration</span>
                                    <span className="text-sm font-black text-foreground">{inspectExam?.duration} min</span>
                                </div>
                                <div className="p-3 rounded-xl border border-border/50 bg-card text-center space-y-0.5">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">Pass Marks</span>
                                    <span className="text-sm font-black text-foreground">{inspectExam?.passMarks}</span>
                                </div>
                                <div className="p-3 rounded-xl border border-border/50 bg-card text-center space-y-0.5">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">Per Question</span>
                                    <span className="text-sm font-black text-foreground">{inspectExam?.marksPerQuestion || 1} pt</span>
                                </div>
                                <div className="p-3 rounded-xl border border-border/50 bg-card text-center space-y-0.5">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">Negative Mark</span>
                                    <span className="text-sm font-black text-foreground">
                                        {inspectExam?.negativeMarksEnabled ? `-${inspectExam.negativeMarksValue}` : "None"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Question Pool & Result Submissions */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                    <HelpCircle className="size-3.5 text-blue-500" />
                                    <span>Questions Pool</span>
                                </div>
                                <p className="text-2xl font-black text-foreground tabular-nums">
                                    {inspectExam?._count?.questions || 0}
                                </p>
                                <span className="text-[10px] text-muted-foreground">Banked questions attached</span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                    <FileCheck className="size-3.5 text-emerald-500" />
                                    <span>Candidate Submissions</span>
                                </div>
                                <p className="text-2xl font-black text-foreground tabular-nums">
                                    {inspectExam?._count?.results || 0}
                                </p>
                                <span className="text-[10px] text-muted-foreground">Completed exam attempts</span>
                            </div>
                        </div>

                        {/* Author & Creator Information */}
                        <div className="p-4 rounded-xl border border-border/50 bg-card space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                Author & Proctor Credentials
                            </span>
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                    <User className="size-4" />
                                </div>
                                <div className="text-xs">
                                    <span className="font-bold text-foreground block">
                                        {[inspectExam?.author?.firstName, inspectExam?.author?.lastName].filter(Boolean).join(" ") || "System Lead"}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        {inspectExam?.author?.email || "No direct email"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Timestamps & Registry Hash */}
                        <div className="p-3 rounded-xl border border-border/40 bg-muted/20 text-[11px] space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">System Exam ID:</span>
                                <span className="font-mono text-foreground">{inspectExam?.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created On:</span>
                                <span className="text-foreground">
                                    {inspectExam?.createdAt ? format(new Date(inspectExam.createdAt), "PPP 'at' p") : "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Drawer Footer Actions */}
                    <div className="p-4 sm:p-5 border-t border-border/50 bg-card flex items-center gap-2">
                        <Button
                            asChild
                            size="sm"
                            className="flex-1 h-9 rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-2xs"
                        >
                            <Link href={`/teacher/exams/${inspectExam?.id}/edit`}>
                                <ExternalLink className="size-3.5" />
                                <span>Open Examination Studio</span>
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectExam(null)}
                            className="h-9 px-4 rounded-xl text-xs"
                        >
                            Close
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* CUSTOM ALERT DIALOG FOR PERMANENT DELETION */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="rounded-2xl border-border/60 bg-card p-5 sm:p-6 shadow-2xl max-w-[420px]">
                    <AlertDialogHeader className="space-y-2 text-left">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-base font-bold text-foreground">
                                    Delete Assessment Record
                                </AlertDialogTitle>
                                <span className="text-[11px] text-muted-foreground font-medium">Permanent Action</span>
                            </div>
                        </div>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                            Are you sure you want to permanently delete the exam{" "}
                            <strong className="text-foreground">&ldquo;{deleteTarget?.title}&rdquo;</strong> belonging to workspace{" "}
                            <strong className="text-foreground">{deleteTarget?.workspace?.name}</strong>? All attached question mappings and result logs will be purged. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex sm:flex-row items-center gap-2 pt-3">
                        <AlertDialogCancel
                            disabled={isDeleting}
                            className="h-9 px-4 rounded-xl text-xs font-semibold flex-1 border-border/60 cursor-pointer"
                        >
                            Keep Exam
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirmDelete();
                            }}
                            disabled={isDeleting}
                            className="h-9 px-4 rounded-xl text-xs font-bold flex-1 bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs cursor-pointer"
                        >
                            {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            <span>Delete Permanently</span>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
