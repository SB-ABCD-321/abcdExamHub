import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ResultsClientSection } from "@/components/shared/ResultsClientSection";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { Trophy, Target, TrendingUp, Zap, BookOpen, ArrowRight, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function StudentResultsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
    });

    if (!dbUser) return <div>User not found.</div>;

    const rawResults = await db.examResult.findMany({
        where: { studentId: dbUser.id },
        include: {
            exam: {
                include: {
                    workspace: true,
                    questions: {
                        include: {
                            question: true
                        }
                    },
                    _count: { select: { questions: true } }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    // Safeguard against orphaned results
    const results = rawResults.filter(r => r.exam != null);

    const totalCompleted = results.length;
    const passedCount = results.filter(r => r.score >= (r.exam?.passMarks || 0)).length;
    const passRate = totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 0;
    const totalScoreSum = results.reduce((acc, r) => acc + (r.score || 0), 0);
    const avgScore = totalCompleted > 0 ? Math.round((totalScoreSum / totalCompleted) * 10) / 10 : 0;

    return (
        <DashboardPage>
            <DashboardHeader
                title={<>Performance <span className="text-primary font-black">Vault</span></>}
                subtitle="Your archived assessment history, merit outcomes, and forensic question solution keys."
                badge={
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10.5px] font-bold uppercase tracking-wider py-0.5">
                        Academic Archive
                    </Badge>
                }
                actions={
                    <Link href="/student/exams">
                        <Button size="sm" className="h-8.5 px-3.5 rounded-xl font-semibold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs group transition-all gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Browse Available Exams</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                    </Link>
                }
            />

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <DashboardMetricCard
                    title="Total Submissions"
                    value={totalCompleted}
                    subtitle="Recorded examination attempts"
                    icon={<Target className="size-4 text-primary" />}
                    badge={
                        <Badge variant="outline" className="text-[9.5px] font-bold bg-primary/10 text-primary border-primary/20">
                            Archived
                        </Badge>
                    }
                />
                <DashboardMetricCard
                    title="Assessments Cleared"
                    value={passedCount}
                    subtitle={`${passedCount} of ${totalCompleted} cleared`}
                    icon={<Trophy className="size-4 text-emerald-500" />}
                    badge={
                        <Badge variant="outline" className="text-[9.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                            Mastered
                        </Badge>
                    }
                />
                <DashboardMetricCard
                    title="Pass Rate"
                    value={`${passRate}%`}
                    subtitle="Historical success efficiency"
                    icon={<TrendingUp className="size-4 text-amber-500" />}
                    progress={passRate}
                />
                <DashboardMetricCard
                    title="Average Score"
                    value={`${avgScore} pts`}
                    subtitle={totalCompleted > 0 ? "Cumulative grade point" : "No results recorded"}
                    icon={<Zap className="size-4 text-blue-500" />}
                    badge={
                        <Badge variant="outline" className="text-[9.5px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            Points
                        </Badge>
                    }
                />
            </div>

            {/* Results Filter & List View */}
            <ResultsClientSection results={results} />
        </DashboardPage>
    );
}
