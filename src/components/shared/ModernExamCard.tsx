"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    Zap,
    Shield,
    Star,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    User,
    Building2,
    Calendar,
    Target,
    HelpCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ModernExamCardProps {
    exam: any;
    variant?: "available" | "draft" | "history";
    attemptDate?: Date;
    score?: number;
}

export function ModernExamCard({ exam, variant = "available", attemptDate, score }: ModernExamCardProps) {
    const isPassed = score !== undefined && score >= exam.passMarks;
    const totalMarks = (exam._count?.questions || 0) * (exam.marksPerQuestion || 1);

    return (
        <Card className="border border-slate-200/60 dark:border-zinc-800 bg-white/50 backdrop-blur-xl dark:bg-zinc-900/80 rounded-[2rem] overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] transition-all duration-500 relative flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Top Indicator */}
            <div className={cn(
                "h-1.5 w-full",
                variant === "history"
                    ? (isPassed ? "bg-emerald-500" : "bg-rose-500")
                    : variant === "draft" ? "bg-amber-500" : "bg-primary"
            )} />

            <CardHeader className="pb-4 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                        <Badge className="w-fit bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-black text-[9px] uppercase tracking-widest px-2 py-0.5 border-none rounded">
                            {exam.workspace?.name}
                        </Badge>
                        {variant === "history" && attemptDate && (
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                <Calendar className="w-3 h-3" />
                                {new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short' }).format(new Date(attemptDate))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {exam.isPublic ? (
                            <div className="flex items-center text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg leading-none uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                                Global
                            </div>
                        ) : (
                            <div className="flex items-center text-[9px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg leading-none uppercase tracking-widest">
                                <Shield className="w-3 h-3 mr-1.5" />
                                Private
                            </div>
                        )}
                    </div>
                </div>

                <CardTitle className="text-lg font-extrabold leading-tight line-clamp-2 min-h-[3rem] uppercase tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {exam.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs font-medium h-8 text-muted-foreground mt-1">
                    {exam.description || "Operational assessment mission."}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 relative z-10 flex flex-col flex-grow">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="bg-white dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/50 flex flex-col items-center justify-center text-center">
                        <Clock className="w-4 h-4 text-primary mb-1" />
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{exam.duration}m</p>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Timing</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/50 flex flex-col items-center justify-center text-center">
                        <Target className="w-4 h-4 text-emerald-500 mb-1" />
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{totalMarks}</p>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Marks</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/50 flex flex-col items-center justify-center text-center">
                        <HelpCircle className="w-4 h-4 text-amber-500 mb-1" />
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{exam._count?.questions || 0}</p>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Questions</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/50 flex flex-col items-center justify-center text-center">
                        <AlertCircle className={cn("w-4 h-4 mb-1", exam.negativeMarksEnabled ? "text-rose-500" : "text-slate-400")} />
                        <p className={cn("text-sm font-bold leading-none", exam.negativeMarksEnabled ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400")}>
                            {exam.negativeMarksEnabled ? `-${exam.negativeMarksValue}` : "No"}
                        </p>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Neg. Marks</p>
                    </div>
                </div>

                {/* Pass Criteria & Author */}
                <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <User className="w-3.5 h-3.5" />
                            By {exam.author?.firstName || "Unknown"}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-zinc-800/20 rounded-xl border border-dashed dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pass Criteria</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{exam.passMarks} Points</span>
                    </div>
                </div>

                {/* Action Area */}
                <div className="pt-2">
                    {variant === "history" ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Your Score</span>
                                    <span className="text-2xl font-bold">{score}</span>
                                </div>
                                <Badge className={cn(
                                    "font-bold text-[10px] uppercase tracking-wider border-none px-3 py-1 rounded-lg",
                                    isPassed ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                )}>
                                    {isPassed ? "Cleared" : "Failed"}
                                </Badge>
                            </div>
                            <Link href={`/student/results/${exam.lastResultId || ''}`} className="w-full">
                                <Button className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-200 dark:hover:bg-zinc-700 transition-all">
                                    View Report
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Link href={`/student/exams/${exam.id}/${variant === 'draft' ? 'take' : 'start'}`} className="block w-full">
                            <Button className={cn(
                                "w-full h-11 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-primary hover:text-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-primary dark:hover:text-slate-900 transition-all group-hover:-translate-y-1",
                                variant === 'draft' && "bg-amber-500 text-white hover:bg-amber-600 hover:text-white dark:bg-amber-500 dark:text-white dark:hover:bg-amber-600"
                            )}>
                                {variant === 'draft' ? "Resume Mission" : "Accept Mission"}
                                <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </Link>
                    )}
                </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
        </Card>
    );
}
