"use client";

import { useState, useMemo, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { UniversalDeleteAction } from "@/components/shared/UniversalDeleteAction";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    ChevronLeft,
    ChevronRight,
    FileQuestion,
    Edit2,
    Search,
    X,
    Layers,
    Table as TableIcon,
    Copy,
    Check,
    Eye,
    ImageIcon,
    Sparkles,
    CheckCircle2,
    Calendar,
    User,
    ArrowUpDown,
    PlusCircle,
    Maximize2
} from "lucide-react";
import Link from "next/link";
import { TopicRenameDialog } from "./TopicRenameDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types matching Prisma schema output
export type QuestionType = {
    id: string;
    text: string;
    isPublic: boolean;
    options: string[];
    correctAnswer?: string;
    imageUrl?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    topicId: string;
    topic?: { id: string; name: string };
    author?: { firstName: string | null; lastName: string | null; email: string; imageUrl?: string | null } | null;
};

export type TopicWithQuestions = {
    id: string;
    name: string;
    updatedAt?: Date | string;
    author?: { firstName: string | null; lastName: string | null; email: string } | null;
    questions: QuestionType[];
};

interface QuestionListClientProps {
    topics: TopicWithQuestions[];
    newQuestionHref?: string;
}

const topicColors = [
    { light: "bg-indigo-50 border-indigo-200 text-indigo-700", dark: "dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300", badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
    { light: "bg-emerald-50 border-emerald-200 text-emerald-700", dark: "dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    { light: "bg-amber-50 border-amber-200 text-amber-700", dark: "dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    { light: "bg-rose-50 border-rose-200 text-rose-700", dark: "dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
    { light: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700", dark: "dark:bg-fuchsia-950/40 dark:border-fuchsia-900 dark:text-fuchsia-300", badge: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20" },
    { light: "bg-sky-50 border-sky-200 text-sky-700", dark: "dark:bg-sky-950/40 dark:border-sky-900 dark:text-sky-300", badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
];

export function QuestionListClient({ topics, newQuestionHref = "/teacher/questions/new" }: QuestionListClientProps) {
    const [mounted, setMounted] = useState(false);

    // Filter & Search states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("all");
    const [accessFilter, setAccessFilter] = useState<"all" | "public" | "private">("all");
    const [mediaFilter, setMediaFilter] = useState<"all" | "images">("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "alpha" | "options">("newest");
    
    // Strict 2 View Modes: "table" and "chapter"
    const [viewMode, setViewMode] = useState<"table" | "chapter">("table");

    // Pagination states (10, 20, 50 questions per page)
    const [globalPage, setGlobalPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [topicPageMap, setTopicPageMap] = useState<Record<string, number>>({});

    // Interactive states
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [previewQuestion, setPreviewQuestion] = useState<QuestionType | null>(null);
    const [previewImageZoom, setPreviewImageZoom] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Flatten all questions with topic details attached
    const allQuestions = useMemo(() => {
        const list: QuestionType[] = [];
        topics.forEach(t => {
            t.questions.forEach(q => {
                list.push({
                    ...q,
                    topic: q.topic || { id: t.id, name: t.name }
                });
            });
        });
        return list;
    }, [topics]);

    // Filtered questions
    const filteredQuestions = useMemo(() => {
        return allQuestions.filter(q => {
            // Search query filter
            if (searchQuery.trim()) {
                const term = searchQuery.toLowerCase().trim();
                const matchesText = q.text.toLowerCase().includes(term);
                const matchesOptions = q.options.some(opt => opt.toLowerCase().includes(term));
                const matchesTopic = q.topic?.name.toLowerCase().includes(term);
                const authorName = `${q.author?.firstName || ""} ${q.author?.lastName || ""} ${q.author?.email || ""}`.toLowerCase();
                const matchesAuthor = authorName.includes(term);

                if (!matchesText && !matchesOptions && !matchesTopic && !matchesAuthor) {
                    return false;
                }
            }

            // Topic filter
            if (selectedTopic !== "all" && q.topicId !== selectedTopic) {
                return false;
            }

            // Access filter
            if (accessFilter === "public" && !q.isPublic) return false;
            if (accessFilter === "private" && q.isPublic) return false;

            // Media filter
            if (mediaFilter === "images" && !q.imageUrl) return false;

            return true;
        }).sort((a, b) => {
            if (sortBy === "newest") {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (sortBy === "oldest") {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            if (sortBy === "alpha") {
                return a.text.localeCompare(b.text);
            }
            if (sortBy === "options") {
                return b.options.length - a.options.length;
            }
            return 0;
        });
    }, [allQuestions, searchQuery, selectedTopic, accessFilter, mediaFilter, sortBy]);

    // Clustered topics based on search/filter for Chapter View
    const filteredTopics = useMemo(() => {
        return topics
            .map(t => ({
                ...t,
                questions: t.questions.filter(q => filteredQuestions.some(fq => fq.id === q.id))
            }))
            .filter(t => t.questions.length > 0);
    }, [topics, filteredQuestions]);

    // Global Pagination
    const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
    const paginatedQuestions = useMemo(() => {
        const start = (globalPage - 1) * pageSize;
        return filteredQuestions.slice(start, start + pageSize);
    }, [filteredQuestions, globalPage, pageSize]);

    const hasActiveFilters = searchQuery.trim() !== "" || selectedTopic !== "all" || accessFilter !== "all" || mediaFilter !== "all" || sortBy !== "newest";

    const resetFilters = () => {
        setSearchQuery("");
        setSelectedTopic("all");
        setAccessFilter("all");
        setMediaFilter("all");
        setSortBy("newest");
        setGlobalPage(1);
    };

    const handleCopyQuestion = (q: QuestionType) => {
        const optionLines = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join("\n");
        const formatted = `${q.text}\n\n${optionLines}\n\nCorrect Answer: ${q.correctAnswer || "Not specified"}`;
        navigator.clipboard.writeText(formatted);
        setCopiedId(q.id);
        toast.success("Question and choices copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleTopicPageChange = (topicId: string, delta: number) => {
        setTopicPageMap(prev => {
            const current = prev[topicId] || 1;
            return { ...prev, [topicId]: current + delta };
        });
    };

    if (!mounted) return null;

    if (allQuestions.length === 0) {
        return (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border/70 bg-card/60 backdrop-blur-xl mt-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                    <FileQuestion className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-lg font-bold text-foreground">Question Repository Empty</h3>
                    <p className="text-sm text-muted-foreground">
                        Your institution currently has no questions stored. Synthesize curriculum items using Gemini AI or author new items manually.
                    </p>
                </div>
                <div className="pt-2">
                    <Link href={newQuestionHref}>
                        <Button className="h-10 px-5 rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                            <PlusCircle className="w-4 h-4" />
                            <span>Create First Question</span>
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* SEARCH & COMMAND TOOLBAR */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search questions, options, chapters, faculty..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setGlobalPage(1);
                            }}
                            className="h-10 pl-10 pr-9 rounded-xl border-border/60 bg-muted/30 focus-visible:bg-card text-xs sm:text-sm font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* View Switcher: ONLY Chapter wise & Table wise */}
                    <div className="flex items-center gap-2 self-end lg:self-center">
                        <div className="flex items-center p-1 rounded-xl bg-muted/40 border border-border/60">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode("table")}
                                className={cn(
                                    "h-8 px-3 rounded-lg text-xs font-bold gap-1.5 transition-all",
                                    viewMode === "table" ? "bg-card shadow-2xs text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <TableIcon className="w-3.5 h-3.5" />
                                <span>Table View</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode("chapter")}
                                className={cn(
                                    "h-8 px-3 rounded-lg text-xs font-bold gap-1.5 transition-all",
                                    viewMode === "chapter" ? "bg-card shadow-2xs text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Layers className="w-3.5 h-3.5" />
                                <span>Chapter Wise</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Secondary Filters Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/40">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Topic Selector */}
                        <Select
                            value={selectedTopic}
                            onValueChange={(val) => {
                                setSelectedTopic(val);
                                setGlobalPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8.5 px-3 rounded-xl border-border/60 bg-muted/20 text-xs font-semibold w-auto min-w-[140px]">
                                <SelectValue placeholder="All Chapters" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Chapters ({allQuestions.length})</SelectItem>
                                {topics.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.name} ({t.questions.length})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Access Filter */}
                        <Select
                            value={accessFilter}
                            onValueChange={(val: any) => {
                                setAccessFilter(val);
                                setGlobalPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8.5 px-3 rounded-xl border-border/60 bg-muted/20 text-xs font-semibold w-auto min-w-[110px]">
                                <SelectValue placeholder="Scope" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Visibility</SelectItem>
                                <SelectItem value="public">Public Items</SelectItem>
                                <SelectItem value="private">Private Workspace</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Media Filter */}
                        <Select
                            value={mediaFilter}
                            onValueChange={(val: any) => {
                                setMediaFilter(val);
                                setGlobalPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8.5 px-3 rounded-xl border-border/60 bg-muted/20 text-xs font-semibold w-auto min-w-[110px]">
                                <SelectValue placeholder="Media" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Formats</SelectItem>
                                <SelectItem value="images">With Diagrams</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort Order */}
                        <Select
                            value={sortBy}
                            onValueChange={(val: any) => setSortBy(val)}
                        >
                            <SelectTrigger className="h-8.5 px-3 rounded-xl border-border/60 bg-muted/20 text-xs font-semibold w-auto min-w-[130px]">
                                <ArrowUpDown className="w-3 h-3 mr-1 text-muted-foreground" />
                                <SelectValue placeholder="Sort Order" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="alpha">Alphabetical (A-Z)</SelectItem>
                                <SelectItem value="options">Most Choices</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-8 px-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive gap-1"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Reset</span>
                            </Button>
                        )}
                    </div>

                    {/* Pagination Page Size Selector: 10, 20, 50 questions */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground tabular-nums">
                            {filteredQuestions.length} Items
                        </span>
                        <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase hidden sm:inline">Per page:</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(val) => {
                                    setPageSize(Number(val));
                                    setGlobalPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8.5 px-2.5 rounded-xl border-border/60 bg-muted/20 text-xs font-bold w-auto">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="10">10 Questions</SelectItem>
                                    <SelectItem value="20">20 Questions</SelectItem>
                                    <SelectItem value="50">50 Questions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* RESULTS CONTENT */}
            {filteredQuestions.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border/70 bg-card/60 backdrop-blur-xl space-y-3">
                    <FileQuestion className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                    <h4 className="text-base font-bold text-foreground">No questions match your filters</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Try clearing search terms or selecting a different chapter.
                    </p>
                    <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl text-xs font-bold mt-2">
                        Reset All Filters
                    </Button>
                </div>
            ) : viewMode === "table" ? (
                /* TABLE WISE VIEW - STRICT 2 LINE CLAMP WITH DOT DOT */
                <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[320px]">Question Statement</th>
                                    <th className="py-3 px-4 min-w-[130px]">Chapter</th>
                                    <th className="py-3 px-4 min-w-[90px] text-center">Choices</th>
                                    <th className="py-3 px-4 min-w-[90px]">Scope</th>
                                    <th className="py-3 px-4 min-w-[130px]">Faculty</th>
                                    <th className="py-3 px-4 text-right min-w-[130px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {paginatedQuestions.map((q, idx) => {
                                    const globalIndex = (globalPage - 1) * pageSize + idx + 1;
                                    return (
                                        <tr key={q.id} className="hover:bg-muted/20 transition-colors group">
                                            <td className="py-3.5 px-4 font-bold text-muted-foreground text-center tabular-nums">
                                                {globalIndex}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="space-y-1">
                                                    {/* Strict Two Lines Maximum with ellipsis */}
                                                    <p
                                                        onClick={() => setPreviewQuestion(q)}
                                                        className="font-semibold text-foreground text-xs sm:text-sm leading-snug line-clamp-2 overflow-hidden text-ellipsis cursor-pointer hover:text-primary transition-colors max-w-xl"
                                                        title="Click to preview full question"
                                                    >
                                                        {q.text}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        {q.imageUrl && (
                                                            <button
                                                                onClick={() => setPreviewQuestion(q)}
                                                                className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded hover:bg-amber-500/20 transition-colors"
                                                            >
                                                                <ImageIcon className="w-2.5 h-2.5" /> Diagram
                                                            </button>
                                                        )}
                                                        {q.correctAnswer && (
                                                            <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-xs">
                                                                Answer: {q.correctAnswer}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-foreground">
                                                <span className="inline-block px-2 py-0.5 rounded-md bg-muted/60 text-foreground font-bold text-[11px] truncate max-w-[150px]">
                                                    {q.topic?.name || "General"}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 tabular-nums font-bold text-muted-foreground text-center">
                                                {q.options.length} Options
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {q.isPublic ? (
                                                    <Badge variant="outline" className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                                                        Public
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[9.5px] font-bold text-muted-foreground bg-muted/40 border-border/60">
                                                        Private
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-muted-foreground truncate max-w-[130px]">
                                                <span className="text-[11px] font-medium">
                                                    {q.author?.firstName || q.author?.lastName
                                                        ? `${q.author.firstName || ""} ${q.author.lastName || ""}`.trim()
                                                        : q.author?.email || "Faculty"}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleCopyQuestion(q)}
                                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                                        title="Copy Question & Options"
                                                    >
                                                        {copiedId === q.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setPreviewQuestion(q)}
                                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                                                        title="Candidate View Simulation"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Link href={`/teacher/questions/${q.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" title="Edit Question">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <UniversalDeleteAction type="QUESTION" id={q.id} name="This Question" />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Proper Pagination Controls (10, 20, 50 questions) */}
                    <div className="p-3.5 sm:p-4 border-t border-border/60 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground font-medium">
                            Showing {(globalPage - 1) * pageSize + 1}–{Math.min(globalPage * pageSize, filteredQuestions.length)} of {filteredQuestions.length} questions
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setGlobalPage(p => Math.max(1, p - 1))}
                                disabled={globalPage === 1}
                                className="h-8 px-3 rounded-xl text-xs font-bold"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                            </Button>
                            <div className="flex items-center gap-1 px-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = i + 1;
                                    if (totalPages > 5 && globalPage > 3) {
                                        pageNum = Math.min(totalPages - 4 + i, Math.max(1, globalPage - 2 + i));
                                    }
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={globalPage === pageNum ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setGlobalPage(pageNum)}
                                            className={cn("h-8 w-8 rounded-xl text-xs font-bold p-0", globalPage === pageNum && "bg-primary text-primary-foreground")}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setGlobalPage(p => Math.min(totalPages, p + 1))}
                                disabled={globalPage === totalPages}
                                className="h-8 px-3 rounded-xl text-xs font-bold"
                            >
                                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                /* CHAPTER WISE VIEW - CLUSTERED BY SUBJECT TOPICS */
                <Accordion type="multiple" defaultValue={filteredTopics.map(t => t.id)} className="space-y-4">
                    {filteredTopics.map((topic) => {
                        const colorIndex = topic.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % topicColors.length;
                        const scheme = topicColors[colorIndex];
                        const page = topicPageMap[topic.id] || 1;
                        const topicTotalPages = Math.ceil(topic.questions.length / pageSize) || 1;
                        const topicQuestions = topic.questions.slice((page - 1) * pageSize, page * pageSize);

                        return (
                            <AccordionItem
                                key={topic.id}
                                value={topic.id}
                                className="border border-border/70 rounded-2xl overflow-hidden bg-card/80 backdrop-blur-xl shadow-xs"
                            >
                                <AccordionTrigger className={cn("px-5 py-4 border-b border-border/50 hover:no-underline transition-colors", scheme.light, scheme.dark)}>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full pr-4 gap-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-black tracking-tight">{topic.name}</h3>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <TopicRenameDialog topicId={topic.id} currentName={topic.name} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {topic.author && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 hidden md:inline">
                                                    Curated by {topic.author.firstName || topic.author.email}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-card/80 border border-border/60 text-foreground shadow-2xs">
                                                {topic.questions.length} Questions
                                            </span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-0">
                                    <div className="divide-y divide-border/50">
                                        {topicQuestions.map((q, idx) => {
                                            const itemNumber = (page - 1) * pageSize + idx + 1;
                                            return (
                                                <div
                                                    key={q.id}
                                                    className="p-4 sm:p-4.5 hover:bg-muted/20 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                                >
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                                                                Q{itemNumber}
                                                            </span>
                                                            {q.isPublic ? (
                                                                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                                                                    Public
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground bg-muted/40 border-border/60">
                                                                    Private
                                                                </Badge>
                                                            )}
                                                            {q.imageUrl && (
                                                                <Badge variant="outline" className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 gap-1">
                                                                    <ImageIcon className="w-2.5 h-2.5" /> Diagram
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {/* Strict 2 Line Maximum with ellipsis */}
                                                        <p
                                                            onClick={() => setPreviewQuestion(q)}
                                                            className="font-semibold text-sm text-foreground leading-snug line-clamp-2 overflow-hidden text-ellipsis cursor-pointer hover:text-primary transition-colors"
                                                            title="Click to preview full question"
                                                        >
                                                            {q.text}
                                                        </p>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span>{q.options.length} Choices</span>
                                                            {q.correctAnswer && (
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-sm">
                                                                    Answer: {q.correctAnswer}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleCopyQuestion(q)}
                                                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                                            title="Copy Question & Options"
                                                        >
                                                            {copiedId === q.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setPreviewQuestion(q)}
                                                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                                                            title="Candidate View Simulation"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Link href={`/teacher/questions/${q.id}/edit`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" title="Edit">
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </Link>
                                                        <UniversalDeleteAction type="QUESTION" id={q.id} name="This Question" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Per-chapter pagination with 10/20/50 support */}
                                    {topicTotalPages > 1 && (
                                        <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-muted/10 text-xs">
                                            <span className="text-muted-foreground font-medium">
                                                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, topic.questions.length)} of {topic.questions.length}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleTopicPageChange(topic.id, -1)}
                                                    disabled={page === 1}
                                                    className="h-7 px-2.5 rounded-lg text-xs"
                                                >
                                                    <ChevronLeft className="w-3 h-3 mr-1" /> Prev
                                                </Button>
                                                <span className="font-bold tabular-nums">
                                                    {page} / {topicTotalPages}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleTopicPageChange(topic.id, 1)}
                                                    disabled={page === topicTotalPages}
                                                    className="h-7 px-2.5 rounded-lg text-xs"
                                                >
                                                    Next <ChevronRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            )}

            {/* ADVANCED CANDIDATE VIEW SIMULATION MODAL */}
            {previewQuestion && (
                <Dialog open={!!previewQuestion} onOpenChange={() => { setPreviewQuestion(null); setPreviewImageZoom(false); }}>
                    <DialogContent className="max-w-2xl rounded-2xl p-6 sm:p-7 bg-card/95 backdrop-blur-2xl border-border/80 shadow-2xl">
                        <DialogHeader>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {previewQuestion.topic && (
                                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/20 bg-primary/10">
                                            {previewQuestion.topic.name}
                                        </Badge>
                                    )}
                                    {previewQuestion.isPublic ? (
                                        <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                                            Public Item
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground bg-muted/40">
                                            Private Workspace
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyQuestion(previewQuestion)}
                                        className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1"
                                    >
                                        {copiedId === previewQuestion.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        <span>Copy</span>
                                    </Button>
                                    <Link href={`/teacher/questions/${previewQuestion.id}/edit`}>
                                        <Button size="sm" variant="default" className="h-8 px-3 rounded-xl text-xs font-bold gap-1">
                                            <Edit2 className="w-3 h-3" />
                                            <span>Edit</span>
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <DialogTitle className="text-lg font-black tracking-tight leading-snug">
                                Candidate View Simulation
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                High-fidelity representation of how candidates observe and interact with this test item.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-2">
                            {/* Full Statement */}
                            <div className="p-4 sm:p-5 rounded-2xl border border-border/60 bg-muted/20 font-semibold text-sm sm:text-base leading-relaxed text-foreground select-text">
                                {previewQuestion.text}
                            </div>

                            {/* Diagram Viewer */}
                            {previewQuestion.imageUrl && (
                                <div className="rounded-2xl border border-border/60 overflow-hidden bg-muted/10 p-3 relative group">
                                    <img
                                        src={previewQuestion.imageUrl}
                                        alt="Question Diagram"
                                        className={cn(
                                            "w-full object-contain mx-auto transition-all cursor-zoom-in",
                                            previewImageZoom ? "max-h-[500px]" : "max-h-64"
                                        )}
                                        onClick={() => setPreviewImageZoom(!previewImageZoom)}
                                    />
                                    <button
                                        onClick={() => setPreviewImageZoom(!previewImageZoom)}
                                        className="absolute bottom-4 right-4 p-2 rounded-xl bg-black/60 text-white backdrop-blur-md opacity-80 hover:opacity-100 transition-opacity text-xs font-bold flex items-center gap-1.5"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                        <span>{previewImageZoom ? "Shrink" : "Zoom"}</span>
                                    </button>
                                </div>
                            )}

                            {/* Multiple Choice Options */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Answer Options ({previewQuestion.options.length}):
                                </span>
                                <div className="grid gap-2">
                                    {previewQuestion.options.map((opt, i) => {
                                        const letter = String.fromCharCode(65 + i);
                                        const isCorrect = previewQuestion.correctAnswer && (previewQuestion.correctAnswer === opt || previewQuestion.correctAnswer.toLowerCase() === letter.toLowerCase());

                                        return (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "p-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-3 transition-colors",
                                                    isCorrect
                                                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-bold"
                                                        : "bg-card border-border/60 text-foreground"
                                                )}
                                            >
                                                <span className={cn(
                                                    "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                                                    isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                                                )}>
                                                    {letter}
                                                </span>
                                                <span className="flex-1">{opt}</span>
                                                {isCorrect && (
                                                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white shrink-0 flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Correct Choice
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Metadata telemetry footer */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>
                                        Author: {previewQuestion.author?.firstName || previewQuestion.author?.email || "Faculty"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>
                                        Created: {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(previewQuestion.createdAt))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
