"use client";

import { useState, useTransition, useEffect } from "react";
import { format } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import {
    Building2,
    User,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Download,
    CheckCircle2,
    PauseCircle,
    XCircle,
    Calendar,
    Zap,
    ExternalLink,
    Copy,
    Check,
    Loader2,
    SlidersHorizontal,
    Layers,
    GraduationCap,
    Users,
    ClipboardList,
    ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { WorkspaceControlPanel } from "@/components/workspace/WorkspaceControlPanel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface WorkspaceItem {
    id: string;
    name: string;
    status: "ACTIVE" | "PAUSED" | "SUSPENDED" | string;
    aiLimit: number;
    aiGenerationsCount: number;
    aiUnlimited: boolean;
    maxTeachers: number;
    maxStudents: number;
    maxExams: number;
    maxQuestions: number;
    maxConcurrentExams?: number;
    trialExpiresAt?: Date | string | null;
    createdAt: Date | string;
    admin: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
    };
    _count: {
        teachers: number;
        students: number;
        exams: number;
        questions: number;
    };
}

interface WorkspaceTableProps {
    workspaces: WorkspaceItem[];
    totalCount: number;
    globalTotal: number;
    activeCount: number;
    pausedCount: number;
    suspendedCount: number;
    currentPage: number;
    pageSize: number;
    currentFilters: {
        q: string;
        status: string;
        tier: string;
        sort: string;
        limit: number;
        page: number;
        id?: string;
    };
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string; Icon: any }> = {
    ACTIVE: {
        label: "Active",
        bg: "bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/30",
        dot: "bg-emerald-500",
        Icon: CheckCircle2
    },
    PAUSED: {
        label: "Paused",
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/30",
        dot: "bg-amber-500",
        Icon: PauseCircle
    },
    SUSPENDED: {
        label: "Suspended",
        bg: "bg-rose-500/10",
        text: "text-rose-600 dark:text-rose-400",
        border: "border-rose-500/30",
        dot: "bg-rose-500",
        Icon: XCircle
    },
};

function MicroUsageBar({ used, max, color }: { used: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
    const isCritical = pct >= 90;
    return (
        <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
            <div
                className={cn("h-full rounded-full transition-all duration-300", isCritical ? "bg-rose-500" : color)}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

export default function WorkspaceTable({
    workspaces,
    totalCount,
    globalTotal,
    activeCount,
    pausedCount,
    suspendedCount,
    currentPage,
    pageSize,
    currentFilters
}: WorkspaceTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const [searchQuery, setSearchQuery] = useState(currentFilters.q);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Sync search input if URL changes externally
    useEffect(() => {
        setSearchQuery(currentFilters.q);
    }, [currentFilters.q]);

    // Push URL query parameters without scroll jumps
    const updateUrl = (updates: Partial<typeof currentFilters>) => {
        const params = new URLSearchParams();
        const merged = { ...currentFilters, ...updates };

        if (merged.q?.trim()) params.set("q", merged.q.trim());
        if (merged.status && merged.status !== "ALL") params.set("status", merged.status);
        if (merged.tier && merged.tier !== "all") params.set("tier", merged.tier);
        if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
        if (merged.limit && merged.limit !== 10) params.set("limit", merged.limit.toString());
        if (merged.page && merged.page > 1) params.set("page", merged.page.toString());
        if (merged.id) params.set("id", merged.id);

        startTransition(() => {
            const queryStr = params.toString();
            router.push(`${pathname}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
        });
    };

    // Debounced search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== currentFilters.q) {
                updateUrl({ q: searchQuery, page: 1 });
            }
        }, 320);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Copy to clipboard helper
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Workspace ID copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Export current filtered workspaces to CSV
    const handleExportCSV = () => {
        if (workspaces.length === 0) {
            toast.error("No workspaces available to export.");
            return;
        }

        const headers = ["SL No", "ID", "Workspace Name", "Status", "Admin Name", "Admin Email", "Teachers Used", "Max Teachers", "Students Used", "Max Students", "Exams Used", "Max Exams", "AI Tier", "AI Usage", "AI Limit", "Created At"];
        const rows = workspaces.map((ws, idx) => {
            const slNo = (currentPage - 1) * pageSize + idx + 1;
            const adminName = [ws.admin?.firstName, ws.admin?.lastName].filter(Boolean).join(" ") || "Unassigned";
            return [
                slNo,
                `"${ws.id}"`,
                `"${ws.name.replace(/"/g, '""')}"`,
                ws.status,
                `"${adminName.replace(/"/g, '""')}"`,
                `"${ws.admin?.email || ""}"`,
                ws._count.teachers,
                ws.maxTeachers,
                ws._count.students,
                ws.maxStudents,
                ws._count.exams,
                ws.maxExams,
                ws.aiUnlimited ? "Unlimited" : "Standard",
                ws.aiGenerationsCount,
                ws.aiLimit,
                `"${format(new Date(ws.createdAt), 'yyyy-MM-dd HH:mm')}"`
            ];
        });

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `workspaces_directory_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Exported ${workspaces.length} workspaces to CSV.`);
    };

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startRange = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRange = Math.min(currentPage * pageSize, totalCount);

    return (
        <div className="space-y-3.5">
            {/* TOOLBAR: TWO-LINE ON MOBILE, COMPACT DESKTOP WITH STATUS TABS, 10/20 SWITCH, AND EXPORT */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 bg-card p-3 rounded-2xl border border-border/60 shadow-2xs relative">
                {/* Pending transition loader line */}
                {isPending && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/70 animate-pulse rounded-t-2xl" />
                )}

                {/* Line 1: Search Bar (w-full on mobile, compact lg:w-64 xl:w-72 on desktop) */}
                <div className="relative w-full lg:w-64 xl:w-72 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search workspace, admin email, ID..."
                        className="w-full pl-8.5 pr-8 h-8.5 text-xs rounded-xl bg-background border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                    {isPending ? (
                        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground animate-spin" />
                    ) : searchQuery ? (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                updateUrl({ q: "", page: 1 });
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                        >
                            <X className="size-3.5" />
                        </button>
                    ) : null}
                </div>

                {/* Line 2 on Mobile: Horizontally Scrollable Status Tabs, Filters, 10/20 Switch, and Export */}
                <div className="w-full lg:w-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
                    {/* Status Tabs */}
                    <div className="h-8.5 bg-muted/60 p-0.5 rounded-xl border border-border/60 flex items-center shrink-0 gap-0.5">
                        <button
                            type="button"
                            onClick={() => updateUrl({ status: "ALL", page: 1 })}
                            className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap select-none",
                                currentFilters.status === "ALL"
                                    ? "bg-card text-foreground shadow-2xs font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            All ({globalTotal})
                        </button>

                        <button
                            type="button"
                            onClick={() => updateUrl({ status: "ACTIVE", page: 1 })}
                            className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap select-none",
                                currentFilters.status === "ACTIVE"
                                    ? "bg-card text-foreground shadow-2xs font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active ({activeCount})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => updateUrl({ status: "PAUSED", page: 1 })}
                            className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap select-none",
                                currentFilters.status === "PAUSED"
                                    ? "bg-card text-foreground shadow-2xs font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            <span>Paused ({pausedCount})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => updateUrl({ status: "SUSPENDED", page: 1 })}
                            className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap select-none",
                                currentFilters.status === "SUSPENDED"
                                    ? "bg-card text-foreground shadow-2xs font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            <span>Suspended ({suspendedCount})</span>
                        </button>
                    </div>

                    {/* AI Tier Filter (Custom Select) */}
                    <Select
                        value={currentFilters.tier}
                        onValueChange={(val) => updateUrl({ tier: val, page: 1 })}
                    >
                        <SelectTrigger className="h-8.5 px-2.5 text-[11px] font-semibold rounded-xl bg-card border-border/60 text-foreground shadow-2xs gap-1.5 focus:ring-1 focus:ring-primary/40 shrink-0 cursor-pointer">
                            <SelectValue placeholder="AI Tier" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/60 bg-popover shadow-xl text-xs">
                            <SelectItem value="all">All AI Tiers</SelectItem>
                            <SelectItem value="unlimited">Unlimited AI</SelectItem>
                            <SelectItem value="standard">Standard Quota</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Page Size Segmented Switcher (10 or 20) */}
                    <div className="h-8.5 bg-muted/60 p-0.5 rounded-xl border border-border/60 flex items-center shrink-0 gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground px-1.5 select-none hidden sm:inline">
                            Per Page:
                        </span>
                        <button
                            type="button"
                            onClick={() => updateUrl({ limit: 10, page: 1 })}
                            className={cn(
                                "px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap select-none",
                                pageSize === 10
                                    ? "bg-primary text-primary-foreground shadow-2xs font-extrabold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Show 10 workspaces per page"
                        >
                            10
                        </button>
                        <button
                            type="button"
                            onClick={() => updateUrl({ limit: 20, page: 1 })}
                            className={cn(
                                "px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap select-none",
                                pageSize === 20
                                    ? "bg-primary text-primary-foreground shadow-2xs font-extrabold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Show 20 workspaces per page"
                        >
                            20
                        </button>
                    </div>

                    {/* Sort Selector (Custom Select) */}
                    <Select
                        value={currentFilters.sort}
                        onValueChange={(val) => updateUrl({ sort: val, page: 1 })}
                    >
                        <SelectTrigger className="h-8.5 px-2.5 text-[11px] font-semibold rounded-xl bg-card border-border/60 text-foreground shadow-2xs gap-1.5 focus:ring-1 focus:ring-primary/40 shrink-0 cursor-pointer">
                            <ArrowUpDown className="size-3 text-muted-foreground mr-0.5" />
                            <SelectValue placeholder="Sort Order" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/60 bg-popover shadow-xl text-xs">
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="name">Alphabetical (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Export CSV Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="h-8.5 px-3 rounded-xl border-border/60 hover:bg-muted font-semibold text-xs gap-1.5 shadow-2xs cursor-pointer select-none shrink-0 whitespace-nowrap"
                        title="Export current page to CSV"
                    >
                        <Download className="size-3.5 text-primary" />
                        <span>Export CSV</span>
                    </Button>
                </div>
            </div>

            {/* DIRECT SHARD ACTIVE FILTER NOTICE */}
            {currentFilters.id && (
                <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-xl flex items-center justify-between text-xs font-semibold">
                    <span>Filtering directly by Workspace ID: <code className="font-mono text-xs bg-primary/20 px-1.5 py-0.5 rounded">{currentFilters.id}</code></span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateUrl({ id: undefined, page: 1 })}
                        className="h-7 text-xs rounded-lg"
                    >
                        View All Workspaces
                    </Button>
                </div>
            )}

            {/* WORKSPACES LIST */}
            {workspaces.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-border/60 p-6 shadow-2xs">
                    <div className="size-11 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
                        <Building2 className="size-5.5" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">No Workspaces Found</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                        {currentFilters.q || currentFilters.status !== "ALL" || currentFilters.tier !== "all"
                            ? "No institutional workspaces match your current search criteria or status filter."
                            : "There are currently no institutional workspaces registered on the platform."}
                    </p>
                    {(currentFilters.q || currentFilters.status !== "ALL" || currentFilters.tier !== "all") && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearchQuery("");
                                updateUrl({ q: "", status: "ALL", tier: "all", sort: "newest", page: 1, id: undefined });
                            }}
                            className="mt-3.5 text-xs rounded-xl h-8 font-semibold"
                        >
                            Reset Filters
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-2.5">
                    {/* DESKTOP FIXED COLUMN HEADER */}
                    <div className="hidden md:grid md:grid-cols-[48px_minmax(0,1.2fr)_120px_minmax(0,1.3fr)_120px_130px] lg:grid-cols-[56px_minmax(0,1.3fr)_130px_minmax(0,1.4fr)_130px_140px] items-center gap-3 lg:gap-4 px-4 pl-4.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-muted/30 rounded-xl border border-border/50 select-none">
                        <div className="text-center font-mono">SL #</div>
                        <div>Institutional Node & Admin</div>
                        <div className="border-l border-border/40 pl-3">Status</div>
                        <div className="border-l border-border/40 pl-3">Resource Load (T / S / E)</div>
                        <div className="border-l border-border/40 pl-3">AI Engine Tier</div>
                        <div className="text-right border-l border-border/40 pl-3 pr-1">Governance</div>
                    </div>

                    {workspaces.map((ws, index) => {
                        const slNo = (currentPage - 1) * pageSize + index + 1;
                        const formattedSlNo = `#${slNo.toString().padStart(2, '0')}`;
                        const statusKey = ws.status as keyof typeof STATUS_CONFIG;
                        const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.ACTIVE;
                        const StatusIcon = cfg.Icon;
                        const maxQ = ws.maxQuestions ?? 500;
                        const isDirectMatch = currentFilters.id === ws.id;

                        return (
                            <div
                                key={ws.id}
                                className={cn(
                                    "group relative overflow-hidden border border-border/60 bg-card rounded-xl shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all duration-150",
                                    isDirectMatch && "ring-1 ring-primary/50 bg-primary/[0.02]"
                                )}
                            >
                                {/* Left Accent Indicator */}
                                <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1 transition-colors",
                                    ws.status === "ACTIVE" ? "bg-emerald-500" : ws.status === "PAUSED" ? "bg-amber-500" : "bg-rose-500"
                                )} />

                                {/* DESKTOP ROW (md:grid) - Increased top-bottom padding (py-3.5) & Fixed CSS Grid Alignment */}
                                <div className="hidden md:grid md:grid-cols-[48px_minmax(0,1.2fr)_120px_minmax(0,1.3fr)_120px_130px] lg:grid-cols-[56px_minmax(0,1.3fr)_130px_minmax(0,1.4fr)_130px_140px] items-center gap-3 lg:gap-4 py-3.5 px-4 pl-4.5">
                                    {/* Col 1: Fixed SL No */}
                                    <div className="flex items-center justify-center">
                                        <div
                                            className="h-8.5 w-full rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center font-mono font-bold text-[11px] text-muted-foreground group-hover:text-primary group-hover:border-primary/40 group-hover:bg-primary/5 transition-all select-none"
                                            title={`Workspace Serial Number: ${slNo}`}
                                        >
                                            {formattedSlNo}
                                        </div>
                                    </div>

                                    {/* Col 2: Institutional Node & Admin Credentials */}
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div className="size-8.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                                            <Building2 className="size-4" />
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <h3
                                                className="text-xs sm:text-[13px] font-bold text-foreground truncate block group-hover:text-primary transition-colors"
                                                title={ws.name}
                                            >
                                                {ws.name}
                                            </h3>

                                            <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
                                                <span className="truncate max-w-[170px]" title={ws.admin?.email || "Unassigned"}>
                                                    {ws.admin?.email || "No admin assigned"}
                                                </span>
                                                <span className="text-[10px] opacity-70 shrink-0">
                                                    • {format(new Date(ws.createdAt), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Col 3: Status Badge */}
                                    <div className="min-w-0 border-l border-border/40 pl-3">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full border gap-1.5 shrink-0 inline-flex items-center shadow-2xs",
                                                cfg.bg, cfg.text, cfg.border
                                            )}
                                        >
                                            <StatusIcon className="size-3" />
                                            <span>{cfg.label}</span>
                                        </Badge>
                                    </div>

                                    {/* Col 4: Resource Telemetry (Teachers, Students, Exams) */}
                                    <div className="min-w-0 border-l border-border/40 pl-3 space-y-1">
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* Teachers */}
                                            <div className="space-y-0.5">
                                                <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground">
                                                    <span>T</span>
                                                    <span className="text-foreground">{ws._count.teachers}/{ws.maxTeachers}</span>
                                                </div>
                                                <MicroUsageBar used={ws._count.teachers} max={ws.maxTeachers} color="bg-indigo-500" />
                                            </div>

                                            {/* Students */}
                                            <div className="space-y-0.5">
                                                <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground">
                                                    <span>S</span>
                                                    <span className="text-foreground">{ws._count.students}/{ws.maxStudents}</span>
                                                </div>
                                                <MicroUsageBar used={ws._count.students} max={ws.maxStudents} color="bg-emerald-500" />
                                            </div>

                                            {/* Exams */}
                                            <div className="space-y-0.5">
                                                <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground">
                                                    <span>E</span>
                                                    <span className="text-foreground">{ws._count.exams}/{ws.maxExams}</span>
                                                </div>
                                                <MicroUsageBar used={ws._count.exams} max={ws.maxExams} color="bg-amber-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Col 5: AI Engine Tier */}
                                    <div className="min-w-0 border-l border-border/40 pl-3">
                                        {ws.aiUnlimited ? (
                                            <Badge
                                                variant="outline"
                                                className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-bold text-[9.5px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs"
                                            >
                                                <Zap className="size-2.5 fill-current" />
                                                <span>UNLIMITED</span>
                                            </Badge>
                                        ) : (
                                            <div className="space-y-0.5 max-w-[100px]">
                                                <div className="flex items-center justify-between text-[9.5px] font-bold">
                                                    <span className="text-muted-foreground">AI:</span>
                                                    <span className="text-foreground">{ws.aiGenerationsCount}/{ws.aiLimit}</span>
                                                </div>
                                                <MicroUsageBar used={ws.aiGenerationsCount} max={ws.aiLimit} color="bg-indigo-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Col 6: Governance Control Suite (Enhanced Manage Section) */}
                                    <div className="flex items-center justify-end gap-1.5 shrink-0 border-l border-border/40 pl-3">
                                        {/* Direct Workspace Control Panel Modal */}
                                        <WorkspaceControlPanel
                                            workspaceId={ws.id}
                                            workspaceName={ws.name}
                                            currentStatus={statusKey as "ACTIVE" | "PAUSED" | "SUSPENDED"}
                                            aiLimit={ws.aiLimit}
                                            aiUsage={ws.aiGenerationsCount}
                                            isUnlimited={ws.aiUnlimited}
                                            maxTeachers={ws.maxTeachers}
                                            maxStudents={ws.maxStudents}
                                            maxExams={ws.maxExams}
                                            maxQuestions={maxQ}
                                            maxConcurrentExams={ws.maxConcurrentExams ?? 100}
                                            trialExpiresAt={ws.trialExpiresAt ? new Date(ws.trialExpiresAt).toISOString() : undefined}
                                        />

                                        {/* Direct Workspace Examinations Link */}
                                        <Button
                                            asChild
                                            size="icon"
                                            variant="outline"
                                            className="size-8 rounded-xl border-border/60 hover:bg-amber-500/10 hover:border-amber-500/30 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-all shadow-2xs"
                                            title="View Workspace Examinations"
                                        >
                                            <Link href={`/super-admin/exams?workspace=${ws.id}`}>
                                                <ClipboardList className="size-3.5 text-amber-500" />
                                            </Link>
                                        </Button>

                                        {/* Quick Copy ID Button */}
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => handleCopy(ws.id, ws.id)}
                                            className="size-8 rounded-xl border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all shadow-2xs"
                                            title="Copy Workspace Shard ID"
                                        >
                                            {copiedId === ws.id ? (
                                                <Check className="size-3.5 text-emerald-500" />
                                            ) : (
                                                <Copy className="size-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* MOBILE DEDICATED CARD (md:hidden) WITH INCREASED PADDING & PROPER MANAGE SUITE */}
                                <div className="md:hidden p-4 space-y-3 pl-4">
                                    {/* Header: SL No + Status Badge + Date */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 shrink-0">
                                                SL {formattedSlNo}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[9px] font-bold px-1.5 py-0 rounded-md border gap-1",
                                                    cfg.bg, cfg.text, cfg.border
                                                )}
                                            >
                                                <StatusIcon className="size-2.5" />
                                                <span>{cfg.label}</span>
                                            </Badge>
                                        </div>

                                        <span className="text-[10px] text-muted-foreground">
                                            {format(new Date(ws.createdAt), 'dd MMM yyyy')}
                                        </span>
                                    </div>

                                    {/* Workspace Name and Admin Email */}
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate" title={ws.name}>
                                            {ws.name}
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {ws.admin?.email || "No admin assigned"}
                                        </p>
                                    </div>

                                    {/* 3-Column Resource Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/40 text-[10px]">
                                        <div className="space-y-0.5">
                                            <span className="text-[8.5px] font-bold uppercase text-muted-foreground block">Teachers</span>
                                            <span className="font-bold text-foreground">{ws._count.teachers} / {ws.maxTeachers}</span>
                                            <MicroUsageBar used={ws._count.teachers} max={ws.maxTeachers} color="bg-indigo-500" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[8.5px] font-bold uppercase text-muted-foreground block">Students</span>
                                            <span className="font-bold text-foreground">{ws._count.students} / {ws.maxStudents}</span>
                                            <MicroUsageBar used={ws._count.students} max={ws.maxStudents} color="bg-emerald-500" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[8.5px] font-bold uppercase text-muted-foreground block">Exams</span>
                                            <span className="font-bold text-foreground">{ws._count.exams} / {ws.maxExams}</span>
                                            <MicroUsageBar used={ws._count.exams} max={ws.maxExams} color="bg-amber-500" />
                                        </div>
                                    </div>

                                    {/* AI Quota and Full Manage Actions Toolbar */}
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                                        <div>
                                            {ws.aiUnlimited ? (
                                                <Badge variant="outline" className="text-[9px] font-bold bg-indigo-500/10 text-indigo-600 border-indigo-500/30">
                                                    Unlimited AI
                                                </Badge>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground">
                                                    AI: <b className="text-foreground">{ws.aiGenerationsCount}/{ws.aiLimit}</b>
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <WorkspaceControlPanel
                                                workspaceId={ws.id}
                                                workspaceName={ws.name}
                                                currentStatus={statusKey as "ACTIVE" | "PAUSED" | "SUSPENDED"}
                                                aiLimit={ws.aiLimit}
                                                aiUsage={ws.aiGenerationsCount}
                                                isUnlimited={ws.aiUnlimited}
                                                maxTeachers={ws.maxTeachers}
                                                maxStudents={ws.maxStudents}
                                                maxExams={ws.maxExams}
                                                maxQuestions={maxQ}
                                                maxConcurrentExams={ws.maxConcurrentExams ?? 100}
                                                trialExpiresAt={ws.trialExpiresAt ? new Date(ws.trialExpiresAt).toISOString() : undefined}
                                            />

                                            <Button
                                                asChild
                                                size="icon"
                                                variant="outline"
                                                className="size-8 rounded-xl border-border/60 text-muted-foreground hover:text-amber-500"
                                                title="View Workspace Exams"
                                            >
                                                <Link href={`/super-admin/exams?workspace=${ws.id}`}>
                                                    <ClipboardList className="size-3.5 text-amber-500" />
                                                </Link>
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => handleCopy(ws.id, ws.id)}
                                                className="size-8 rounded-xl border-border/60 text-muted-foreground"
                                                title="Copy ID"
                                            >
                                                {copiedId === ws.id ? (
                                                    <Check className="size-3 text-emerald-500" />
                                                ) : (
                                                    <Copy className="size-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* HIGH-PERFORMANCE PAGINATION CONTROLS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 px-1 text-xs text-muted-foreground border-t border-border/40">
                {/* Showing Range Summary */}
                <div className="flex items-center gap-2">
                    <span>
                        Showing <span className="font-semibold text-foreground">{startRange}</span> to <span className="font-semibold text-foreground">{endRange}</span> of <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> institutional workspaces
                    </span>

                    {/* Quick 10 or 20 badge selector */}
                    <div className="hidden sm:flex items-center gap-1 ml-2 text-[11px] bg-muted/40 p-0.5 rounded-lg border border-border/50">
                        <span className="text-muted-foreground text-[10px] px-1 font-medium">Rows:</span>
                        <button
                            type="button"
                            onClick={() => updateUrl({ limit: 10, page: 1 })}
                            className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer",
                                pageSize === 10
                                    ? "bg-primary text-primary-foreground shadow-2xs font-extrabold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            10
                        </button>
                        <button
                            type="button"
                            onClick={() => updateUrl({ limit: 20, page: 1 })}
                            className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer",
                                pageSize === 20
                                    ? "bg-primary text-primary-foreground shadow-2xs font-extrabold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            20
                        </button>
                    </div>
                </div>

                {/* Navigation Buttons: First, Prev, Pages, Next, Last */}
                <div className="flex items-center gap-1 self-center sm:self-auto">
                    {/* First Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => updateUrl({ page: 1 })}
                        disabled={currentPage <= 1 || isPending}
                        title="First Page"
                        aria-label="First Page"
                    >
                        <ChevronsLeft className="size-3.5" />
                    </Button>

                    {/* Prev Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => updateUrl({ page: Math.max(1, currentPage - 1) })}
                        disabled={currentPage <= 1 || isPending}
                        title="Previous Page"
                        aria-label="Previous Page"
                    >
                        <ChevronLeft className="size-3.5" />
                    </Button>

                    {/* Page Numbers with Elision */}
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                            let pageNum = i + 1;
                            if (totalPages > 5) {
                                if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                            }

                            const isSelected = currentPage === pageNum;
                            return (
                                <Button
                                    key={pageNum}
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateUrl({ page: pageNum })}
                                    disabled={isSelected || isPending}
                                    className={cn(
                                        "size-8 p-0 rounded-lg text-xs cursor-pointer transition-all",
                                        isSelected ? "font-bold shadow-2xs opacity-100" : "hover:bg-muted/50"
                                    )}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Next Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => updateUrl({ page: Math.min(totalPages, currentPage + 1) })}
                        disabled={currentPage >= totalPages || isPending}
                        title="Next Page"
                        aria-label="Next Page"
                    >
                        <ChevronRight className="size-3.5" />
                    </Button>

                    {/* Last Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => updateUrl({ page: totalPages })}
                        disabled={currentPage >= totalPages || isPending}
                        title="Last Page"
                        aria-label="Last Page"
                    >
                        <ChevronsRight className="size-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
