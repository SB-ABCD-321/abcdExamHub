"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    History, 
    Search, 
    Calendar, 
    Clock, 
    ChevronRight, 
    FileText, 
    SortAsc, 
    CheckCircle2, 
    XCircle,
    Building2,
    BookOpen
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ResultsClientSectionProps {
    results: any[];
}

export function ResultsClientSection({ results }: ResultsClientSectionProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    const filteredAndSortedResults = useMemo(() => {
        let filtered = results.filter((result) => {
            if (!result || !result.exam) return false;
            const examTitle = result.exam.title || "";
            const workspaceName = result.exam.workspace?.name || "";
            return (
                examTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                workspaceName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });

        filtered.sort((a, b) => {
            if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortBy === "highest_marks") return b.score - a.score;
            if (sortBy === "lowest_marks") return a.score - b.score;
            return 0;
        });

        return filtered;
    }, [results, searchQuery, sortBy]);

    if (results.length === 0) {
        return (
            <div className="p-16 text-center rounded-2xl border border-dashed border-border/80 bg-card/50">
                <History className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-base font-bold text-foreground">No Examination Records Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
                    You have not completed any examinations yet. Your performance scores, merit ranks, and solution breakdowns will appear here.
                </p>
                <Link href="/student/exams">
                    <Button size="sm" className="h-9 px-4 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-2xs">
                        <BookOpen className="w-4 h-4" />
                        <span>Browse Available Examinations</span>
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Control Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search results by exam title or workspace..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 rounded-xl border border-border/60 bg-card focus-visible:ring-primary shadow-2xs text-xs"
                    />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-10 w-[170px] rounded-xl border border-border/60 bg-card font-bold text-xs gap-1.5 px-3">
                            <SortAsc className="w-3.5 h-3.5 text-primary shrink-0" />
                            <SelectValue placeholder="Sort Results" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-border/60 shadow-lg">
                            <SelectItem value="newest" className="font-semibold text-xs">Latest First</SelectItem>
                            <SelectItem value="oldest" className="font-semibold text-xs">Oldest First</SelectItem>
                            <SelectItem value="highest_marks" className="font-semibold text-xs">Highest Score</SelectItem>
                            <SelectItem value="lowest_marks" className="font-semibold text-xs">Lowest Score</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results List */}
            <div className="space-y-3">
                {filteredAndSortedResults.length === 0 ? (
                    <div className="p-12 text-center text-xs text-muted-foreground font-medium rounded-2xl border border-dashed border-border/60">
                        No examination results match your search query.
                    </div>
                ) : (
                    filteredAndSortedResults.map((result) => {
                        const exam = result.exam as any;
                        if (!exam) return null;

                        const isPublished = (() => {
                            if (exam.resultPublishMode === "EXAM_END") {
                                return exam.endTime ? new Date() > new Date(exam.endTime) : false;
                            }
                            if (exam.resultPublishMode === "CUSTOM") {
                                return exam.customPublishDate ? new Date() > new Date(exam.customPublishDate) : false;
                            }
                            return true;
                        })();

                        const passMarks = exam.passMarks || 0;
                        const isPassed = isPublished ? result.score >= passMarks : null;

                        const totalQuestions = exam._count?.questions || 0;
                        const marksPerQuestion = exam.marksPerQuestion || 1;
                        const maxMarks = totalQuestions * marksPerQuestion;
                        const percentage = maxMarks > 0 ? Math.round((result.score / maxMarks) * 100) : 0;

                        const answersObj = typeof result.answers === "string" ? JSON.parse(result.answers) : (result.answers || {});
                        const answeredCount = Object.keys(answersObj).length;

                        // Calculate Correct count properly by joining with questions table
                        let correctCount = 0;
                        if (exam.questions) {
                            for (const eq of exam.questions) {
                                if (answersObj[eq.questionId] === eq.question.correctAnswer) {
                                    correctCount++;
                                }
                            }
                        }

                        const incorrectCount = answeredCount - correctCount;

                        return (
                            <Link 
                                key={result.id} 
                                href={isPublished ? `/student/results/${result.id}` : "#"} 
                                className={cn("block", !isPublished && "cursor-not-allowed")}
                            >
                                <Card className="border border-border/70 shadow-2xs bg-card rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-xs transition-all duration-200 group">
                                    <div className="flex items-stretch min-h-0">
                                        {/* Status Accent Left Bar */}
                                        <div className={cn(
                                            "w-1.5 shrink-0 transition-colors",
                                            !isPublished ? "bg-muted-foreground/30" :
                                                isPassed ? "bg-emerald-500" : "bg-rose-500"
                                        )} />

                                        <CardContent className="flex-1 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs",
                                                    !isPublished ? "bg-muted text-muted-foreground" :
                                                        isPassed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                )}>
                                                    <FileText className="w-5 h-5" />
                                                </div>

                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-primary/10 text-primary border-primary/20">
                                                            {exam.workspace?.name || "Global Exam"}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                                            <Calendar className="w-3 h-3 text-muted-foreground/60" />
                                                            {new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(result.createdAt))}
                                                        </span>
                                                    </div>

                                                    <h4 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                                                        {exam.title}
                                                    </h4>

                                                    <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-muted-foreground font-medium">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-primary/70" />
                                                            <span>{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</span>
                                                        </div>
                                                        {isPublished && (
                                                            <>
                                                                <span className="text-muted-foreground/40">•</span>
                                                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    <span>{correctCount} Correct</span>
                                                                </div>
                                                                <span className="text-muted-foreground/40">•</span>
                                                                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    <span>{incorrectCount} Incorrect</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Score & Outcome Section */}
                                            <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 md:border-l border-border/50 pt-3 md:pt-0 md:pl-6 shrink-0">
                                                <div className="flex flex-col text-left md:text-right">
                                                    {isPublished ? (
                                                        <>
                                                            <div className="text-xl sm:text-2xl font-black text-foreground flex items-baseline md:justify-end gap-1">
                                                                {percentage}<span className="text-xs text-muted-foreground font-semibold">%</span>
                                                            </div>
                                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                {result.score} / {maxMarks} pts
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                            <span>Result Pending</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        className={cn(
                                                            "font-bold text-[9.5px] tracking-wider border-none px-2.5 py-1 rounded-md uppercase shadow-2xs",
                                                            !isPublished ? "bg-muted text-muted-foreground" :
                                                                isPassed ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                                        )}
                                                    >
                                                        {!isPublished ? "Pending" : isPassed ? "Cleared" : "Needs Review"}
                                                    </Badge>
                                                    <ChevronRight className={cn(
                                                        "w-4 h-4 transition-transform text-muted-foreground/50",
                                                        isPublished && "group-hover:text-primary group-hover:translate-x-0.5"
                                                    )} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
