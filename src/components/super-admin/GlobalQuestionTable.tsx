"use client";

import { useState, useTransition, useEffect } from "react";
import { format } from "date-fns";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    HelpCircle,
    Building2,
    User,
    Trash2,
    Eye,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Download,
    ImageIcon,
    FileQuestion,
    Copy,
    Check,
    Loader2,
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
import { deleteGlobalQuestionAction } from "@/actions/super-admin-crud";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuestionItem {
    id: string;
    text: string;
    imageUrl?: string | null;
    options: string[];
    correctAnswer: string;
    createdAt: Date | string;
    workspaceId?: string | null;
    workspace?: { id: string; name: string } | null;
    topic?: { id: string; name: string } | null;
    author?: { id?: string; firstName?: string | null; lastName?: string | null; email?: string | null } | null;
}

interface GlobalQuestionTableProps {
    questions: QuestionItem[];
    totalCount: number;
    globalTotal: number;
    currentPage: number;
    pageSize: number;
    topics: { id: string; name: string }[];
    workspaces: { id: string; name: string }[];
    currentFilters: {
        q: string;
        topic: string;
        workspace: string;
        media: string;
        sort: string;
        limit: number;
        page: number;
    };
}

export default function GlobalQuestionTable({
    questions,
    totalCount,
    globalTotal,
    currentPage,
    pageSize,
    topics,
    workspaces,
    currentFilters
}: GlobalQuestionTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    // Local search state for responsive typing
    const [searchQuery, setSearchQuery] = useState(currentFilters.q);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Modal / Drawer states
    const [inspectQuestion, setInspectQuestion] = useState<QuestionItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<QuestionItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Sync search input if URL changes externally
    useEffect(() => {
        setSearchQuery(currentFilters.q);
    }, [currentFilters.q]);

    // Push URL query parameters with zero layout shift
    const updateUrl = (updates: Partial<typeof currentFilters>) => {
        const params = new URLSearchParams();
        const merged = { ...currentFilters, ...updates };

        if (merged.q?.trim()) params.set("q", merged.q.trim());
        if (merged.topic && merged.topic !== "all") params.set("topic", merged.topic);
        if (merged.workspace && merged.workspace !== "all") params.set("workspace", merged.workspace);
        if (merged.media && merged.media !== "all") params.set("media", merged.media);
        if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
        if (merged.limit && merged.limit !== 10) params.set("limit", merged.limit.toString());
        if (merged.page && merged.page > 1) params.set("page", merged.page.toString());

        startTransition(() => {
            const queryStr = params.toString();
            router.push(`${pathname}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
        });
    };

    // Debounced search query
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== currentFilters.q) {
                updateUrl({ q: searchQuery, page: 1 });
            }
        }, 320);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle delete action
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await deleteGlobalQuestionAction(deleteTarget.id);
            if (res.success) {
                toast.success("Question permanently deleted from the vault.");
                setDeleteTarget(null);
                if (inspectQuestion?.id === deleteTarget.id) setInspectQuestion(null);
                startTransition(() => {
                    router.refresh();
                });
            } else {
                toast.error(res.error || "Failed to delete question.");
            }
        } catch {
            toast.error("An error occurred while deleting the question.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Copy to clipboard helper
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Export current page or visible data to CSV
    const handleExportCSV = () => {
        if (questions.length === 0) {
            toast.error("No questions available to export.");
            return;
        }

        const headers = ["SL No", "ID", "Question Text", "Topic", "Workspace", "Author Name", "Author Email", "Has Diagram", "Choices Count", "Correct Key", "Created At"];
        const rows = questions.map((q, idx) => {
            const slNo = (currentPage - 1) * pageSize + idx + 1;
            const authorName = [q.author?.firstName, q.author?.lastName].filter(Boolean).join(" ") || "Unknown";
            return [
                slNo,
                `"${q.id}"`,
                `"${q.text.replace(/"/g, '""')}"`,
                `"${(q.topic?.name || "Uncategorized").replace(/"/g, '""')}"`,
                `"${(q.workspace?.name || "Global Vault").replace(/"/g, '""')}"`,
                `"${authorName.replace(/"/g, '""')}"`,
                `"${q.author?.email || ""}"`,
                q.imageUrl ? "Yes" : "No",
                q.options?.length || 0,
                `"${(q.correctAnswer || "").replace(/"/g, '""')}"`,
                `"${format(new Date(q.createdAt), 'yyyy-MM-dd HH:mm')}"`
            ];
        });

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `question_bank_page_${currentPage}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Exported ${questions.length} questions to CSV.`);
    };

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startRange = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRange = Math.min(currentPage * pageSize, totalCount);

    return (
        <div className="space-y-3.5">
            {/* TOOLBAR: TWO-LINE ON MOBILE, COMPACT DESKTOP WITH 10/20 SELECTOR */}
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
                        placeholder="Search stem, topic, author, ID..."
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

                {/* Line 2 on Mobile: Horizontally Scrollable Filters, 10/20 Page Size Switch, and Export */}
                <div className="w-full lg:w-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
                    {/* Page Size Segmented Switcher (10 or 20 items per page) */}
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
                            title="Show 10 questions per page"
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
                            title="Show 20 questions per page"
                        >
                            20
                        </button>
                    </div>

                    {/* Topic Selector (Custom Select) */}
                    <Select
                        value={currentFilters.topic}
                        onValueChange={(val) => updateUrl({ topic: val, page: 1 })}
                    >
                        <SelectTrigger className="h-8.5 px-2.5 text-[11px] font-semibold rounded-xl bg-card border-border/60 text-foreground shadow-2xs gap-1.5 focus:ring-1 focus:ring-primary/40 shrink-0 cursor-pointer max-w-[170px]">
                            <SelectValue placeholder="All Topics" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/60 bg-popover shadow-xl text-xs max-h-60">
                            <SelectItem value="all">All Topics ({topics.length})</SelectItem>
                            {topics.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Workspace Cluster Selector (Custom Select) */}
                    <Select
                        value={currentFilters.workspace}
                        onValueChange={(val) => updateUrl({ workspace: val, page: 1 })}
                    >
                        <SelectTrigger className="h-8.5 px-2.5 text-[11px] font-semibold rounded-xl bg-card border-border/60 text-foreground shadow-2xs gap-1.5 focus:ring-1 focus:ring-primary/40 shrink-0 cursor-pointer max-w-[170px]">
                            <SelectValue placeholder="All Clusters" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/60 bg-popover shadow-xl text-xs max-h-60">
                            <SelectItem value="all">All Clusters</SelectItem>
                            <SelectItem value="global">Global Vault</SelectItem>
                            {workspaces.map((ws) => (
                                <SelectItem key={ws.id} value={ws.id}>
                                    {ws.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Media Type Toggle */}
                    <div className="h-8.5 bg-muted/60 p-0.5 rounded-xl border border-border/60 flex items-center shrink-0 gap-0.5">
                        <button
                            type="button"
                            onClick={() => updateUrl({ media: "all", page: 1 })}
                            className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap select-none",
                                currentFilters.media === "all"
                                    ? "bg-card text-foreground shadow-2xs font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            onClick={() => updateUrl({ media: "image", page: 1 })}
                            className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap select-none",
                                currentFilters.media === "image"
                                    ? "bg-card text-foreground shadow-2xs font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ImageIcon className="size-3 text-indigo-500" />
                            <span>Diagrams</span>
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
                            <SelectItem value="alpha">Alphabetical (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Export CSV Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="h-8.5 px-3 rounded-xl border-border/60 hover:bg-muted font-semibold text-xs gap-1.5 shadow-2xs cursor-pointer select-none shrink-0 whitespace-nowrap"
                        title="Export current page questions to CSV"
                    >
                        <Download className="size-3.5 text-primary" />
                        <span>Export CSV</span>
                    </Button>
                </div>
            </div>

            {/* QUESTIONS MANIFEST LIST */}
            {questions.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-border/60 p-6 shadow-2xs">
                    <div className="size-11 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
                        <FileQuestion className="size-5.5" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">No Questions Found</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                        {currentFilters.q || currentFilters.topic !== "all" || currentFilters.workspace !== "all" || currentFilters.media !== "all"
                            ? "No questions match your current query or filter criteria in the vault."
                            : "There are currently no questions recorded in the platform repository."}
                    </p>
                    {(currentFilters.q || currentFilters.topic !== "all" || currentFilters.workspace !== "all" || currentFilters.media !== "all") && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearchQuery("");
                                updateUrl({ q: "", topic: "all", workspace: "all", media: "all", sort: "newest", page: 1 });
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
                    <div className="hidden md:grid md:grid-cols-[48px_minmax(0,1fr)_150px_150px_145px] lg:grid-cols-[56px_minmax(0,1fr)_180px_180px_160px] items-center gap-3 lg:gap-4 px-4 pl-4.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-muted/30 rounded-xl border border-border/50 select-none">
                        <div className="text-center font-mono">SL #</div>
                        <div>Question Stem & Curriculum</div>
                        <div className="border-l border-border/40 pl-3">Origin Cluster</div>
                        <div className="border-l border-border/40 pl-3">Contributor</div>
                        <div className="text-right border-l border-border/40 pl-3 pr-1">Choices & Actions</div>
                    </div>

                    {questions.map((question, index) => {
                        // Calculate precise continuous serial number across pages
                        const slNo = (currentPage - 1) * pageSize + index + 1;
                        const formattedSlNo = `#${slNo.toString().padStart(2, '0')}`;
                        const authorName = [question.author?.firstName, question.author?.lastName].filter(Boolean).join(" ") || "System / Contributor";
                        const hasImage = Boolean(question.imageUrl);

                        return (
                            <div
                                key={question.id}
                                className="group relative overflow-hidden border border-border/60 bg-card rounded-xl shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all duration-150"
                            >
                                {/* Left Accent Indicator */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/70 group-hover:bg-primary transition-colors" />

                                {/* DESKTOP ROW (md:grid) - Increased py-3.5 Padding & Strictly Fixed Columns */}
                                <div className="hidden md:grid md:grid-cols-[48px_minmax(0,1fr)_150px_150px_145px] lg:grid-cols-[56px_minmax(0,1fr)_180px_180px_160px] items-center gap-3 lg:gap-4 py-3.5 px-4 pl-4.5">
                                    {/* Col 1: Fixed SL No. */}
                                    <div className="flex items-center justify-center">
                                        <div
                                            className="h-8.5 w-full rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center font-mono font-bold text-[11px] text-muted-foreground group-hover:text-primary group-hover:border-primary/40 group-hover:bg-primary/5 transition-all select-none"
                                            title={`Question Serial Number: ${slNo}`}
                                        >
                                            {formattedSlNo}
                                        </div>
                                    </div>

                                    {/* Col 2: Question Stem & Curriculum Topic */}
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div className="size-8.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                                            <HelpCircle className="size-4" />
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <h3
                                                className="text-xs sm:text-[13px] font-bold text-foreground truncate block"
                                                title={question.text}
                                            >
                                                {question.text}
                                            </h3>

                                            <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
                                                <Badge
                                                    variant="outline"
                                                    className="text-[9.5px] font-bold px-1.5 py-0 rounded-md border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 max-w-[170px] truncate"
                                                    title={question.topic?.name || "Uncategorized"}
                                                >
                                                    {question.topic?.name || "Uncategorized"}
                                                </Badge>

                                                {hasImage && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[9px] font-bold px-1.5 py-0 rounded-md border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0"
                                                    >
                                                        <ImageIcon className="size-2.5" />
                                                        <span>Diagram</span>
                                                    </Badge>
                                                )}

                                                <span className="text-[10px] opacity-70 shrink-0">
                                                    • {format(new Date(question.createdAt), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Col 3: Origin Workspace (Fixed Width) */}
                                    <div className="min-w-0 space-y-0.5 border-l border-border/40 pl-3">
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground/80 block">
                                            Origin Cluster
                                        </span>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                            <Building2 className="size-3.5 text-indigo-500 shrink-0" />
                                            <span className="truncate block" title={question.workspace?.name || "Global Vault"}>
                                                {question.workspace?.name || "Global Vault"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Col 4: Contributor (Fixed Width) */}
                                    <div className="min-w-0 space-y-0.5 border-l border-border/40 pl-3">
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground/80 block">
                                            Author / Contributor
                                        </span>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                            <User className="size-3.5 text-muted-foreground shrink-0" />
                                            <span className="truncate block" title={authorName}>
                                                {authorName}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Col 5: Choices & Actions (Fixed Width) */}
                                    <div className="flex items-center justify-end gap-2.5 shrink-0 border-l border-border/40 pl-3">
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border-border/60 bg-muted/40 text-muted-foreground shrink-0"
                                        >
                                            {question.options?.length || 0} Choices
                                        </Badge>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => setInspectQuestion(question)}
                                                className="size-7.5 rounded-lg text-primary hover:bg-primary/10 border-border/60 cursor-pointer"
                                                title="Inspect Question Dossier"
                                            >
                                                <Eye className="size-3.5" />
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => setDeleteTarget(question)}
                                                className="size-7.5 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border-border/60 cursor-pointer"
                                                title="Delete Question Record"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* MOBILE DEDICATED CARD (md:hidden) WITH INCREASED PADDING */}
                                <div className="md:hidden p-4 space-y-3 pl-4">
                                    {/* Top Row: SL No + Topic + Date */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 shrink-0">
                                                SL {formattedSlNo}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-[9px] font-bold px-1.5 py-0 rounded-md border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                            >
                                                {question.topic?.name || "General"}
                                            </Badge>
                                        </div>

                                        <span className="text-[10px] text-muted-foreground">
                                            {format(new Date(question.createdAt), 'dd MMM yyyy')}
                                        </span>
                                    </div>

                                    {/* Question Stem */}
                                    <h4 className="text-xs font-bold text-foreground line-clamp-2" title={question.text}>
                                        {question.text}
                                    </h4>

                                    {/* Cluster and Choices Pill */}
                                    <div className="bg-muted/30 rounded-lg p-2 border border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-1 truncate max-w-[150px]">
                                            <Building2 className="size-3 text-indigo-500 shrink-0" />
                                            <span className="truncate">{question.workspace?.name || "Global Vault"}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {hasImage && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[8.5px] font-bold px-1 py-0 rounded border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                >
                                                    Diagram
                                                </Badge>
                                            )}
                                            <span className="text-[10px] font-semibold text-foreground">
                                                {question.options?.length || 0} Choices
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mobile Actions Toolbar */}
                                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                                        <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                                            By {authorName}
                                        </span>

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setInspectQuestion(question)}
                                                className="h-7 px-2.5 text-[10px] rounded-lg text-primary gap-1"
                                            >
                                                <Eye className="size-3" />
                                                <span>Inspect</span>
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => setDeleteTarget(question)}
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

            {/* HIGH-PERFORMANCE PAGINATION CONTROLS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 px-1 text-xs text-muted-foreground border-t border-border/40">
                {/* Showing Range Summary */}
                <div className="flex items-center gap-2">
                    <span>
                        Showing <span className="font-semibold text-foreground">{startRange}</span> to <span className="font-semibold text-foreground">{endRange}</span> of <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> questions
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

            {/* QUESTION INSPECTION SLIDE-OVER DRAWER */}
            <Sheet open={!!inspectQuestion} onOpenChange={(open) => !open && setInspectQuestion(null)}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-lg p-0 flex flex-col justify-between border-l border-border/60 bg-card text-card-foreground shadow-2xl"
                >
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <SheetHeader className="p-0 space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-md border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                >
                                    {inspectQuestion?.topic?.name || "Uncategorized Topic"}
                                </Badge>
                                {inspectQuestion?.imageUrl && (
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1"
                                    >
                                        <ImageIcon className="size-3" />
                                        <span>Multimedia Diagram</span>
                                    </Badge>
                                )}
                            </div>
                            <SheetTitle className="text-lg font-black tracking-tight">Question Dossier</SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground">
                                Detailed inspection of question stem, diagram, multiple choice keys, and tenant telemetry.
                            </SheetDescription>
                        </SheetHeader>

                        {inspectQuestion && (
                            <div className="space-y-5">
                                {/* Question Stem */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Question Stem
                                    </span>
                                    <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-sm font-semibold text-foreground leading-relaxed select-text">
                                        {inspectQuestion.text}
                                    </div>
                                </div>

                                {/* Diagram preview if available */}
                                {inspectQuestion.imageUrl && (
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Visual Diagram
                                        </span>
                                        <div className="rounded-xl overflow-hidden border border-border/60 bg-black/5 dark:bg-white/5 flex items-center justify-center p-2">
                                            <img
                                                src={inspectQuestion.imageUrl}
                                                alt="Question Diagram"
                                                className="max-h-56 object-contain rounded-lg"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Multiple Choice Options */}
                                <div className="space-y-2.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Answer Options ({inspectQuestion.options?.length || 0})
                                    </span>
                                    <div className="space-y-2">
                                        {inspectQuestion.options?.map((option, idx) => {
                                            const letter = String.fromCharCode(65 + idx);
                                            const isCorrect = inspectQuestion.correctAnswer === option || inspectQuestion.correctAnswer === letter;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-colors",
                                                        isCorrect
                                                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 font-semibold"
                                                            : "bg-card border-border/60 text-foreground"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span
                                                            className={cn(
                                                                "size-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0",
                                                                isCorrect
                                                                    ? "bg-emerald-500 text-white shadow-2xs"
                                                                    : "bg-muted text-muted-foreground border border-border/40"
                                                            )}
                                                        >
                                                            {letter}
                                                        </span>
                                                        <span className="truncate">{option}</span>
                                                    </div>

                                                    {isCorrect && (
                                                        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9.5px] font-bold shrink-0">
                                                            Correct Key
                                                        </Badge>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Metadata Breakdown */}
                                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/30 border border-border/50 text-xs">
                                    <div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                                            Origin Cluster
                                        </span>
                                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                                            <Building2 className="size-3.5 text-indigo-500" />
                                            {inspectQuestion.workspace?.name || "Global Vault"}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                                            Created On
                                        </span>
                                        <p className="font-semibold text-foreground">
                                            {format(new Date(inspectQuestion.createdAt), 'PPP p')}
                                        </p>
                                    </div>

                                    <div className="col-span-2 pt-2 border-t border-border/40 flex items-center justify-between">
                                        <div className="min-w-0">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">
                                                Author / Contributor
                                            </span>
                                            <p className="font-semibold text-foreground truncate">
                                                {[inspectQuestion.author?.firstName, inspectQuestion.author?.lastName].filter(Boolean).join(" ") || "System Contributor"}
                                                {inspectQuestion.author?.email && ` (${inspectQuestion.author.email})`}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleCopy(inspectQuestion.id, inspectQuestion.id)}
                                            className="h-7 px-2 text-[10px] font-mono rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer shrink-0"
                                            title="Copy Question ID"
                                        >
                                            {copiedId === inspectQuestion.id ? (
                                                <Check className="size-3 text-emerald-500" />
                                            ) : (
                                                <Copy className="size-3" />
                                            )}
                                            <span>Copy ID</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Drawer Footer Actions */}
                    <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectQuestion(null)}
                            className="rounded-xl font-semibold text-xs"
                        >
                            Close
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                setDeleteTarget(inspectQuestion);
                            }}
                            className="rounded-xl font-semibold text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            <Trash2 className="size-3.5" />
                            <span>Delete Question</span>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* CUSTOM ALERT DIALOG: CONFIRM PERMANENT DELETE */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl">
                    <AlertDialogHeader className="space-y-2">
                        <div className="size-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1">
                            <Trash2 className="size-5.5" />
                        </div>
                        <AlertDialogTitle className="text-base font-bold text-foreground">
                            Delete Question Record?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                            This action will permanently delete this question item from the Question Bank repository.
                            {deleteTarget?.text && (
                                <span className="block mt-2 p-2.5 rounded-lg bg-muted/40 border border-border/40 text-foreground font-semibold text-[11px] line-clamp-2">
                                    "{deleteTarget.text}"
                                </span>
                            )}
                            This question will no longer be available for future assessments. This operation cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel
                            disabled={isDeleting}
                            className="rounded-xl text-xs font-semibold h-9"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="rounded-xl text-xs font-bold h-9 bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-3.5" />
                                    <span>Confirm Delete</span>
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
