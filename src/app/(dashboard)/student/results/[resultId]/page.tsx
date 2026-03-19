import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Trophy, BarChart3, Medal, Share2, Download, ArrowLeft, Zap, Info } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ResultActions } from "./ResultActions";

export default async function ExamResultPage(props: { params: Promise<{ resultId: string }> }) {
    const params = await props.params;
    const resultId = params.resultId;

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId }
    });

    if (!dbUser) return <div>User not found.</div>;

    const result = await db.examResult.findUnique({
        where: { id: resultId },
        include: {
            exam: {
                include: {
                    workspace: true,
                    _count: { select: { questions: true } },
                    questions: {
                        include: {
                            question: true
                        }
                    },
                    // Explicitly include all policy fields to fix lint errors
                    author: true
                }
            }
        }
    });


    if (!result || result.studentId !== dbUser.id) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Record Not Found</h2>
                <p className="text-muted-foreground mt-2 max-w-sm font-medium italic">This result doesn't exist or you don't have access to it.</p>
                <Link href="/student/results" className="mt-8">
                    <Button variant="outline" className="rounded-xl font-bold">Back to Performance Vault</Button>
                </Link>
            </div>
        );
    }

    const exam = result.exam as any;
    const isPublished = (() => {
        if (exam.resultPublishMode === "EXAM_END") {
            return exam.endTime ? new Date() > new Date(exam.endTime) : true;
        }
        if (exam.resultPublishMode === "CUSTOM") {
            return exam.customPublishDate ? new Date() > new Date(exam.customPublishDate) : true;
        }
        return true; // INSTANT
    })();


    if (!isPublished) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <Clock className="w-16 h-16 text-indigo-500 mb-6 drop-shadow-xl" />
                <h2 className="text-4xl font-black uppercase tracking-tighter">Results Pending</h2>
                <p className="text-muted-foreground mt-2 max-w-sm font-medium italic">
                    The results for this assessment will be published by the examiner at a later time. Please check your performance vault later.
                </p>
                <Link href="/student/results" className="mt-8">
                    <Button variant="outline" className="rounded-xl font-bold">Return to Vault</Button>
                </Link>
            </div>
        );
    }

    // result.exam is already captured as 'exam' above

    const totalQuestions = exam._count.questions;
    const safeMarksPerQuestion = exam.marksPerQuestion ?? 1;
    const safePassMarks = exam.passMarks ?? 0;
    const maxMarks = safeMarksPerQuestion * totalQuestions;
    const isPass = result.score >= safePassMarks;
    const percentage = maxMarks > 0 ? Math.round((result.score / maxMarks) * 100) : 0;

    const allResults = await db.examResult.findMany({
        where: { examId: exam.id },
        orderBy: [
            { score: 'desc' },
            { timeTaken: 'asc' }
        ],
        select: { id: true }
    });

    const rank = allResults.findIndex(r => r.id === result.id) + 1;
    const totalParticipants = allResults.length;

    const getFormattedTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <Link href="/student/results" className="group flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Performance Vault
                </Link>
                <ResultActions
                    resultId={resultId}
                    examTitle={exam.title}
                    workspaceName={exam.workspace.name}
                    score={result.score}
                    maxMarks={maxMarks}
                    percentage={percentage}
                    isPass={isPass}
                    passMarks={safePassMarks}
                    timeTaken={result.timeTaken}
                    rank={rank}
                    totalParticipants={totalParticipants}
                    submittedAt={result.createdAt.toISOString()}
                    studentName={`${dbUser.firstName} ${dbUser.lastName}`}
                    questions={exam.questions}
                    studentAnswers={(result as any).answers || {}}
                    showCorrectAnswers={exam.showCorrectAnswers ?? true}
                    showDetailedLog={exam.showDetailedLog ?? true}
                />
            </div>

            <Card className="border-none shadow-2xl shadow-indigo-500/10 bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden">
                <div className={cn(
                    "h-4 w-full",
                    isPass ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-rose-400 to-orange-500"
                )} />

                <CardHeader className="text-center pt-12 pb-8 px-6 lg:px-12">
                    <div className="flex justify-center mb-8">
                        <div className={cn(
                            "p-6 rounded-[2rem] shadow-xl",
                            isPass ? "bg-emerald-50 text-emerald-600 shadow-emerald-500/10" : "bg-rose-50 text-rose-600 shadow-rose-500/10"
                        )}>
                            {isPass ? <Trophy className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
                        </div>
                    </div>

                    <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white leading-none">
                        {isPass ? "Achievement Unlocked" : "Incomplete Mission"}
                    </h2>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mb-8">
                        Assessment Result for <span className="text-slate-900 dark:text-slate-100 italic">"{exam.title}"</span>
                    </p>

                    <div className="flex flex-col items-center">
                        <div className="relative inline-block">
                            <div className="text-9xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                                {result.score}
                            </div>
                            <span className="absolute -top-2 -right-12 text-3xl font-black text-indigo-600">/{maxMarks}</span>
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Net Proficiency Score</p>
                            <div className="h-1.5 w-32 bg-slate-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-1000 ease-out", isPass ? "bg-emerald-500" : "bg-rose-500")}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <p className="text-lg font-black mt-1 text-slate-600 dark:text-slate-300">{percentage}% Precision</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-6 lg:px-12 pb-12 space-y-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 text-center">
                            <Zap className={cn("w-5 h-5 mx-auto mb-3", isPass ? "text-emerald-500" : "text-rose-500")} />
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                            <p className={cn("font-black text-xl leading-none", isPass ? "text-emerald-600" : "text-rose-600")}>
                                {isPass ? "PASSED" : "FAILED"}
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 text-center">
                            <Clock className="w-5 h-5 mx-auto mb-3 text-indigo-500" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Duration</p>
                            <p className="font-black text-xl leading-none text-slate-900 dark:text-slate-100">{getFormattedTime(result.timeTaken)}</p>
                        </div>

                        <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 text-center relative overflow-hidden group">
                            <div className="relative z-10">
                                <Medal className={cn(
                                    "w-5 h-5 mx-auto mb-3",
                                    rank === 1 ? "text-yellow-500" : 
                                    rank === 2 ? "text-slate-400" : 
                                    rank === 3 ? "text-amber-700" : 
                                    rank <= 5 ? "text-indigo-400" : "text-slate-300"
                                )} />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Merit Rank</p>
                                <p className="font-black text-xl leading-none text-slate-900 dark:text-slate-100">
                                    {rank <= 5 ? `#${rank}` : 'PARTICIPANT'}
                                </p>
                            </div>
                            {rank <= 5 && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Trophy className="w-20 h-20" />
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 text-center">
                            <BarChart3 className="w-5 h-5 mx-auto mb-3 text-slate-400" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Cohorts</p>
                            <p className="font-black text-xl leading-none text-slate-900 dark:text-slate-100">{totalParticipants} <span className="text-[10px] text-slate-400">USERS</span></p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 text-center">
                        <Badge className="bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-indigo-600/20">
                            Verified Assessment Result
                        </Badge>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                            Issued by {exam.workspace.name} • System ID: {result.id}
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="bg-indigo-600 p-8 flex flex-col sm:flex-row gap-4 justify-between items-center group">
                    <div className="text-white text-center sm:text-left">
                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">Continue Learning</p>
                        <p className="text-lg font-black uppercase tracking-tight">Master your next goal</p>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <Link href="/student" className="flex-1 sm:flex-none">
                            <Button variant="outline" className="w-full bg-white/10 hover:bg-white text-white hover:text-indigo-600 border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest h-12 px-8">Dashboard</Button>
                        </Link>
                        <Link href="/student/exams" className="flex-1 sm:flex-none">
                            <Button className="w-full bg-white text-indigo-600 hover:bg-zinc-900 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest h-12 px-8 shadow-xl">Take Next Mission</Button>
                        </Link>
                    </div>
                </CardFooter>
            </Card>

            {/* Detailed Log Section */}
            {exam.showDetailedLog && (
                <div className="mt-12 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black tracking-tight uppercase">Detailed Performance Log</h3>
                            <p className="text-sm text-muted-foreground font-medium italic mt-1 pl-1">A forensic breakdown of your choices.</p>
                        </div>
                        {exam.showCorrectAnswers && (
                            <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 bg-indigo-50/50 uppercase text-[9px] font-black tracking-widest px-3 py-1">
                                <Info className="w-3 h-3 mr-1.5 inline" /> True Answers Revealed
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-4">
                        {exam.questions.map((eq: any, index: number) => {
                            const studentAnswers = (result as any).answers as Record<string, string>;
                            const studentAnswer = studentAnswers[eq.question.id];

                            const isCorrect = studentAnswer === eq.question.correctAnswer;
                            const isUnanswered = !studentAnswer;

                            return (
                                <Card key={eq.questionId} className={cn(
                                    "border shadow-sm rounded-3xl overflow-hidden transition-all",
                                    isCorrect ? "border-emerald-200/50 bg-emerald-50/30" :
                                        isUnanswered ? "border-slate-200 bg-slate-50/50" : "border-rose-200/50 bg-rose-50/30"
                                )}>
                                    <div className="flex flex-col sm:flex-row">
                                        <div className={cn(
                                            "flex flex-col items-center justify-center p-6 w-full sm:w-24 shrink-0",
                                            isCorrect ? "bg-emerald-100/50 text-emerald-600" :
                                                isUnanswered ? "bg-slate-100 text-slate-500" : "bg-rose-100/50 text-rose-600"
                                        )}>
                                            <span className="text-[10px] uppercase font-black tracking-widest opacity-70 mb-1">Index</span>
                                            <span className="text-2xl font-black leading-none">{index + 1}</span>
                                            <div className="mt-2">
                                                {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : isUnanswered ? <div className="w-2 h-0.5 bg-slate-400 rounded-full" /> : <XCircle className="w-6 h-6" />}
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 bg-white dark:bg-zinc-900">
                                            <div className="mb-4">
                                                <div className="font-semibold text-base leading-relaxed text-slate-900 dark:text-slate-100 break-words whitespace-pre-wrap">
                                                    {eq.question.text}
                                                </div>
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Choice</p>
                                                    <p className={cn(
                                                        "font-medium text-sm break-words",
                                                        isCorrect ? "text-emerald-600 font-semibold" :
                                                            isUnanswered ? "text-slate-500 italic" : "text-rose-600 font-semibold"
                                                    )}>
                                                        {studentAnswer || "No answer provided"}
                                                    </p>
                                                </div>

                                                {(!isCorrect && exam.showCorrectAnswers) && (
                                                    <div className="space-y-1.5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-bl-2xl flex items-center justify-center">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 z-10 relative">Correct Answer</p>
                                                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 break-words z-10 relative">
                                                            {eq.question.correctAnswer}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
