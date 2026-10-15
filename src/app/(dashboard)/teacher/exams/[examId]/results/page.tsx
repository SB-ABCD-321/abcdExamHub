import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Medal, Clock, Trophy, Users, Award, CheckCircle, TrendingUp, Sparkles, UserCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReAllowButton } from "./ReAllowButton";
import { ExportMeritList } from "./ExportMeritList";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { Badge } from "@/components/ui/badge";

export default async function ExamLeaderboardPage(props: { params: Promise<{ examId: string }> }) {
    const params = await props.params;
    const examId = params.examId;

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId }
    });

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: {
            workspace: true,
            _count: { select: { questions: true } }
        }
    });

    if (!exam) return redirect("/teacher/exams");

    // Fetch all results, order by highest score first, then lowest time taken
    const results = await db.examResult.findMany({
        where: { examId },
        include: {
            student: {
                select: { id: true, firstName: true, lastName: true, email: true }
            }
        },
        orderBy: [
            { score: 'desc' },
            { timeTaken: 'asc' }
        ]
    });

    const getFormattedTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const totalParticipants = results.length;
    const passCount = results.filter(r => r.score >= exam.passMarks).length;
    const passRate = totalParticipants > 0 ? Math.round((passCount / totalParticipants) * 100) : 0;
    const highestScore = totalParticipants > 0 ? Math.max(...results.map(r => r.score)) : 0;
    const avgScore = totalParticipants > 0 
        ? (results.reduce((acc, r) => acc + r.score, 0) / totalParticipants).toFixed(1) 
        : "0";
    const totalPossibleMarks = exam._count.questions * (exam.marksPerQuestion || 1);

    return (
        <DashboardPage>
            <DashboardHeader
                title={`Results & Merit List: ${exam.title}`}
                subtitle={`View student rankings, time efficiency, and attempt history for this assessment.`}
                badge={
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[11px] font-bold uppercase tracking-wider py-0.5">
                        Pass Marks: {exam.passMarks} / {totalPossibleMarks}
                    </Badge>
                }
                actions={
                    <div className="flex items-center gap-2">
                        <ExportMeritList 
                            examTitle={exam.title}
                            workspaceName={(exam.workspace as any)?.siteName || (exam.workspace as any)?.name || "Assessment Center"}
                            passMarks={exam.passMarks}
                            totalQuestions={exam._count.questions}
                            results={results as any}
                        />
                        <Link href="/teacher/exams">
                            <Button variant="outline" className="h-9 px-3.5 rounded-xl font-bold text-xs gap-1.5 border-slate-200 dark:border-zinc-800">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back to Exams
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <DashboardMetricCard
                    title="Total Submissions"
                    value={totalParticipants}
                    subtitle="Recorded candidate attempts"
                    icon={Users}
                />
                <DashboardMetricCard
                    title="Pass Rate"
                    value={`${passRate}%`}
                    subtitle={`${passCount} of ${totalParticipants} cleared`}
                    icon={CheckCircle}
                />
                <DashboardMetricCard
                    title="Top Score"
                    value={`${highestScore} pts`}
                    subtitle={`Out of ${totalPossibleMarks} max points`}
                    icon={Award}
                />
                <DashboardMetricCard
                    title="Average Score"
                    value={`${avgScore} pts`}
                    subtitle="Overall cohort mean score"
                    icon={TrendingUp}
                />
            </div>

            {/* Results Table Card */}
            <Card className="border border-border/50 shadow-sm bg-card rounded-2xl overflow-hidden mt-2">
                <CardHeader className="border-b border-border/40 p-4 sm:p-6 flex flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base sm:text-lg font-bold">Candidates Leaderboard</CardTitle>
                        <CardDescription className="text-xs">
                            Ranked by highest score, with tie-breakers awarded to faster completion times.
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-bold text-xs px-2.5 py-1 rounded-lg">
                        {totalParticipants} Attempt{totalParticipants === 1 ? '' : 's'}
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                    {results.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                                <Trophy className="w-7 h-7 text-muted-foreground/40" />
                            </div>
                            <h3 className="font-bold text-base text-foreground mb-1">No Attempt Records Found</h3>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                Students have not completed any submissions for this examination yet. Results will appear live here as candidates finish.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left min-w-[700px]">
                                <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border/40 text-[11px] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3 w-16 text-center">Rank</th>
                                        <th className="px-5 py-3">Candidate</th>
                                        <th className="px-5 py-3 text-center">Score</th>
                                        <th className="px-5 py-3 text-center">Outcome</th>
                                        <th className="px-5 py-3 text-right">Time Taken</th>
                                        <th className="px-5 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 text-foreground">
                                    {results.map((r, index) => {
                                        const rank = index + 1;
                                        const isPass = r.score >= exam.passMarks;
                                        const percentage = totalPossibleMarks > 0 
                                            ? Math.round((r.score / totalPossibleMarks) * 100) 
                                            : 0;

                                        const studentName = r.student 
                                            ? `${r.student.firstName} ${r.student.lastName}`.trim() 
                                            : (r.guestName || "Walk-In Candidate");
                                        const candidateInitial = studentName.charAt(0).toUpperCase() || "U";

                                        return (
                                            <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-5 py-3.5 text-center font-bold">
                                                    <div className="flex justify-center items-center">
                                                        {rank === 1 ? (
                                                            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-xs">
                                                                <Medal className="w-4 h-4 fill-amber-500 text-amber-500" />
                                                            </div>
                                                        ) : rank === 2 ? (
                                                            <div className="w-7 h-7 rounded-full bg-slate-400/10 text-slate-500 flex items-center justify-center border border-slate-400/20">
                                                                <Medal className="w-4 h-4 fill-slate-400 text-slate-400" />
                                                            </div>
                                                        ) : rank === 3 ? (
                                                            <div className="w-7 h-7 rounded-full bg-amber-700/10 text-amber-700 flex items-center justify-center border border-amber-700/20">
                                                                <Medal className="w-4 h-4 fill-amber-700 text-amber-700" />
                                                            </div>
                                                        ) : (
                                                            <span className="font-mono text-muted-foreground font-bold">#{rank}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                                                            {candidateInitial}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                                {studentName}
                                                                {!r.student && (
                                                                    <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase px-1.5 py-0 h-4 border-indigo-200">
                                                                        Walk-In
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground font-mono">
                                                                {r.student?.email || r.guestMobile || "No Contact Stored"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="font-bold text-sm text-foreground">
                                                            {r.score} <span className="text-[10px] text-muted-foreground font-normal">/ {totalPossibleMarks}</span>
                                                        </span>
                                                        <span className="text-[10px] font-medium text-muted-foreground">
                                                            ({percentage}%)
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                        isPass 
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50" 
                                                            : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50"
                                                    )}>
                                                        {isPass ? "Passed" : "Failed"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">
                                                    <div className="flex items-center justify-end gap-1 font-semibold text-xs">
                                                        <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                                                        {getFormattedTime(r.timeTaken)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <ReAllowButton 
                                                        resultId={r.id} 
                                                        examId={examId} 
                                                        studentName={studentName} 
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardPage>
    );
}
