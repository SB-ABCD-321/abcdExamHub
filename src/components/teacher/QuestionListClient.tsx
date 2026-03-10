"use client";

import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { UniversalDeleteAction } from "@/components/shared/UniversalDeleteAction";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, FileQuestion, Edit2 } from "lucide-react";
import Link from "next/link";
import { TopicRenameDialog } from "./TopicRenameDialog";

// Types extracted matching Prisma schema output
export type QuestionType = {
    id: string;
    text: string;
    isPublic: boolean;
    options: string[];
    createdAt: Date;
    updatedAt: Date;
};

export type TopicWithQuestions = {
    id: string;
    name: string;
    updatedAt?: Date;
    author?: { firstName: string | null; lastName: string | null; email: string } | null;
    questions: QuestionType[];
};

interface QuestionListClientProps {
    topics: TopicWithQuestions[];
}

const ITEMS_PER_PAGE = 10;

export function QuestionListClient({ topics }: QuestionListClientProps) {
    // State to track pagination for each topic independently. Key = topicId, Value = pageNumber
    const [pageMap, setPageMap] = useState<Record<string, number>>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handlePageChange = (topicId: string, delta: number) => {
        setPageMap(prev => {
            const currentPage = prev[topicId] || 1;
            return { ...prev, [topicId]: currentPage + delta };
        });
    };

    if (!mounted) return null; // FIX HYDRATION ERROR

    if (topics.length === 0 || topics.every(t => t.questions.length === 0)) {
        return (
            <div className="p-12 text-center rounded-xl border bg-card/50 mt-6">
                <FileQuestion className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">Question Bank Empty</h3>
                <p className="text-muted-foreground mt-1">Start adding questions to your workspaces to build out test papers.</p>
            </div>
        );
    }

    return (
        <div className="mt-6 border rounded-xl bg-card shadow-sm overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
                {topics.filter(t => t.questions.length > 0).map((topic) => {
                    const currentPage = pageMap[topic.id] || 1;
                    const totalPages = Math.ceil(topic.questions.length / ITEMS_PER_PAGE);
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const visibleQuestions = topic.questions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                    // Array of vibrant color classes to cycle through based on index to differentiate topics easily
                    const topicColors = [
                        "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100",
                        "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
                        "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
                        "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
                        "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-100",
                        "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100",
                    ];
                    // Fallbacks for dark mode matching the standard colors
                    const topicDarkColors = [
                        "dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-900/60",
                        "dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-900/60",
                        "dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/60",
                        "dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-900/60",
                        "dark:bg-fuchsia-950/40 dark:border-fuchsia-900 dark:text-fuchsia-400 dark:hover:bg-fuchsia-900/60",
                        "dark:bg-sky-950/40 dark:border-sky-900 dark:text-sky-400 dark:hover:bg-sky-900/60",
                    ];

                    // Simple hash to consistently color a topic based on ID length/characters
                    const colorIndex = topic.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % topicColors.length;
                    const headerClass = `${topicColors[colorIndex]} ${topicDarkColors[colorIndex]} transition-colors px-6 border-b`;

                    return (
                        <AccordionItem key={topic.id} value={topic.id} className="border border-slate-200 dark:border-zinc-800 rounded-xl mb-4 overflow-hidden last:mb-0 shadow-sm">
                            <AccordionTrigger className={headerClass}>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full pr-4 gap-2">
                                    <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center">
                                            <h3 className="text-lg font-bold">{topic.name}</h3>
                                            <div onClick={e => e.stopPropagation()}>
                                                <TopicRenameDialog topicId={topic.id} currentName={topic.name} />
                                            </div>
                                        </div>
                                        {topic.author && (
                                            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                                                Created by: {topic.author.firstName || topic.author.lastName ? `${topic.author.firstName || ''} ${topic.author.lastName || ''}`.trim() : topic.author.email || 'Unknown'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {topic.updatedAt && (
                                            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60 hidden sm:block">
                                                Edited: {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(topic.updatedAt)}
                                            </p>
                                        )}
                                        <Badge variant="secondary" className="font-bold bg-white/70 dark:bg-zinc-900/70 border-none shadow-sm capitalize">
                                            {topic.questions.length} Questions
                                        </Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-0 pb-0">
                                <div className="divide-y border-t bg-muted/10">
                                    {visibleQuestions.map((q, idx) => (
                                        <div key={q.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 px-6 hover:bg-muted/30 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                                                        Q{startIndex + idx + 1}
                                                    </span>
                                                    {q.isPublic ? (
                                                        <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">Public</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs text-slate-600 border-slate-200 bg-slate-50">Private</Badge>
                                                    )}
                                                </div>
                                                <p className="font-medium text-sm line-clamp-2 text-foreground/90">{q.text}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{q.options.length} Options</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Link href={`/teacher/questions/${q.id}/edit`}>
                                                    <Button variant="outline" size="icon" className="h-8 w-8" title="Edit Question">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <UniversalDeleteAction type="QUESTION" id={q.id} name="This Question" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-6 py-3 border-t bg-card">
                                        <span className="text-xs text-muted-foreground">
                                            Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, topic.questions.length)} of {topic.questions.length}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(topic.id, -1)}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                            </Button>
                                            <span className="text-xs font-medium w-12 text-center">
                                                {currentPage} / {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(topic.id, 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    );
}
