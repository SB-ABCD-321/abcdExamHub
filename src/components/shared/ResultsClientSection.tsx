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
import { History, Search, Calendar, Clock, ChevronRight, FileText, SortAsc } from "lucide-react";
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
            const examTitle = result.exam?.title || "";
            const workspaceName = result.exam?.workspace?.name || "";
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
            <div className="p-24 text-center rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                <History className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                <h3 className="text-2xl font-black uppercase tracking-tighter">No Records Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-10 font-bold italic">You haven't completed any assessments yet. Mission data will appear here once you finish a test.</p>
                <Link href="/student/exams">
                    <Button className="h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-900 hover:bg-indigo-600 transition-all text-white shadow-xl hover:-translate-y-1">Explore Available Missions</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center relative z-10 w-full mb-8">
                <div className="relative w-full lg:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by mission title or hub name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus-visible:ring-primary shadow-sm text-sm"
                    />
                </div>

                <div className="flex w-full lg:w-auto gap-3">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="!h-14 w-full lg:w-[200px] rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-[10px] sm:text-xs uppercase tracking-widest shadow-sm px-5">
                            <div className="flex items-center gap-2">
                                <SortAsc className="w-4 h-4 text-indigo-600" />
                                <SelectValue placeholder="Sort" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="newest" className="font-bold">Newest First</SelectItem>
                            <SelectItem value="oldest" className="font-bold">Oldest First</SelectItem>
                            <SelectItem value="highest_marks" className="font-bold">Highest Marks</SelectItem>
                            <SelectItem value="lowest_marks" className="font-bold">Lowest Marks</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-6">
                {filteredAndSortedResults.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-bold italic">No results match your search criteria.</div>
                ) : (
                    filteredAndSortedResults.map((result) => {
                        const exam = result.exam as any;
                        const isPublished = (() => {
                            if (exam.resultPublishMode === "EXAM_END") {
                                return exam.endTime ? new Date() > new Date(exam.endTime) : true;
                            }
                            if (exam.resultPublishMode === "CUSTOM") {
                                return exam.customPublishDate ? new Date() > new Date(exam.customPublishDate) : true;
                            }
                            return true;
                        })();

                        const passMarks = exam.passMarks;
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
                            <Link key={result.id} href={isPublished ? `/student/results/${result.id}` : "#"} className={cn(!isPublished && "pointer-events-none")}>
                                <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
                                    <div className="flex items-stretch min-h-0">
                                        <div className={cn(
                                            "w-2 transition-colors duration-300",
                                            !isPublished ? "bg-slate-300 dark:bg-zinc-700" :
                                                isPassed ? "bg-emerald-500" : "bg-rose-500"
                                        )} />
                                        <CardContent className="flex-1 p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className={cn(
                                                    "p-4 rounded-xl transition-colors",
                                                    !isPublished ? "bg-slate-50 dark:bg-zinc-800" :
                                                        isPassed ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600"
                                                )}>
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-500 font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 border-none rounded">
                                                            {result.exam.workspace?.name || "Global"}
                                                        </Badge>
                                                    </div>
                                                    <h4 className="font-extrabold text-lg md:text-xl text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">{result.exam.title}</h4>
                                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(result.createdAt))}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                                                {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                                                            </p>
                                                        </div>
                                                        {isPublished && (
                                                            <>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{correctCount} Correct</p>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{incorrectCount} Incorrect</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 md:border-l border-slate-100 dark:border-zinc-800 pt-4 md:pt-0 md:pl-6">
                                                <div className="flex flex-col text-right items-end">
                                                    {isPublished ? (
                                                        <>
                                                            <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                                                                {percentage}<span className="text-sm text-slate-500 uppercase font-semibold">%</span>
                                                            </div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                                {result.score} / {maxMarks} Marks
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" />
                                                            Pending
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Badge
                                                        className={cn(
                                                            "font-bold text-[9px] tracking-wider border-none px-3 py-1 rounded-lg uppercase shadow-sm",
                                                            !isPublished ? "bg-slate-100 dark:bg-zinc-800 text-slate-500" :
                                                                isPassed ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
                                                        )}
                                                    >
                                                        {!isPublished ? "Locked" : isPassed ? "Success" : "Failed"}
                                                    </Badge>
                                                    <ChevronRight className={cn(
                                                        "w-5 h-5 transition-transform",
                                                        isPublished ? "text-slate-400 group-hover:text-primary group-hover:translate-x-1" : "text-slate-200 dark:text-zinc-700"
                                                    )} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    );
}
