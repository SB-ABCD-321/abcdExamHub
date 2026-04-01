import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Medal, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReAllowButton } from "./ReAllowButton";
import { ExportMeritList } from "./ExportMeritList";

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                    <Link href="/teacher/exams">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Leaderboard: {exam.title}</h1>
                        <p className="text-muted-foreground text-sm">View student rankings and performance metrics.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <ExportMeritList 
                        examTitle={exam.title}
                        workspaceName={(exam.workspace as any)?.siteName || (exam.workspace as any)?.name || "Assessment Center"}
                        passMarks={exam.passMarks}
                        totalQuestions={exam._count.questions}
                        results={results as any}
                    />
                </div>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Exam Results ({results.length} total participants)</CardTitle>
                    <CardDescription>Ranked by highest score, followed by fastest completion time.</CardDescription>
                </CardHeader>
                <CardContent>
                    {results.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No students have taken this exam yet.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[600px]">
                                <thead className="bg-muted text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-3 w-16 text-center">Rank</th>
                                        <th className="px-4 py-3">Student Name</th>
                                        <th className="px-4 py-3 text-center">Score</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-right">Time Taken</th>
                                        <th className="px-4 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y bg-card text-foreground">
                                    {results.map((r, index) => {
                                        const rank = index + 1;
                                        const isPass = r.score >= exam.passMarks;
                                        const percentage = Math.round((r.score / exam._count.questions) * 100);

                                        return (
                                            <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 text-center font-bold">
                                                    <div className="flex justify-center items-center">
                                                        {rank === 1 ? <Medal className="w-5 h-5 text-yellow-500" /> :
                                                            rank === 2 ? <Medal className="w-5 h-5 text-gray-400" /> :
                                                                rank === 3 ? <Medal className="w-5 h-5 text-amber-700" /> :
                                                                    <span className="text-muted-foreground">#{rank}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {r.student ? (
                                                        <>
                                                            <div className="font-semibold">{r.student.firstName} {r.student.lastName}</div>
                                                            <div className="text-xs text-muted-foreground">{r.student.email}</div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="font-semibold flex items-center gap-2">
                                                                {r.guestName || "Unknown Guest"}
                                                                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm">Walk-In</span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground font-mono">{r.guestMobile || "No Mobile"}</div>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold">
                                                    {r.score} <span className="text-xs font-normal text-muted-foreground">({percentage}%)</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-full text-xs font-medium",
                                                        isPass ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                                    )}>
                                                        {isPass ? "PASS" : "FAIL"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {getFormattedTime(r.timeTaken)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ReAllowButton 
                                                        resultId={r.id} 
                                                        examId={examId} 
                                                        studentName={r.student ? `${r.student.firstName} ${r.student.lastName}` : (r.guestName || "Guest")} 
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
        </div>
    );
}
