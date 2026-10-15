import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ExamClientSection } from "@/components/shared/ExamClientSection";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { BookOpen, CheckCircle, Clock, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function StudentExamsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
    });

    if (!dbUser) return <div>User not found.</div>;

    // 1. Fetch History (Results)
    const historyExams = await db.examResult.findMany({
        where: { studentId: dbUser.id },
        include: {
            exam: {
                include: {
                    workspace: true,
                    author: true,
                    _count: { select: { questions: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Safeguard: Filter out any historic results where the associated exam was removed
    const validHistoryExams = historyExams.filter(h => h.exam != null);
    const historyIds = validHistoryExams.map(h => h.examId);

    // 2. Fetch Available (Not in history)
    const availableExams = await (db.exam as any).findMany({
        where: {
            AND: [
                {
                    OR: [
                        { isPublic: true },
                        { allowedStudents: { some: { id: dbUser.id } } },
                        { workspace: { students: { some: { id: dbUser.id } } } }
                    ]
                },
                { id: { notIn: historyIds } },
                { status: "ACTIVE" }
            ]
        },
        include: {
            workspace: true,
            author: true,
            _count: { select: { questions: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Compute stats
    const totalCompleted = validHistoryExams.length;
    const passedExams = validHistoryExams.filter(h => h.score >= (h.exam?.passMarks || 0)).length;
    const avgScore = totalCompleted > 0 
        ? (validHistoryExams.reduce((acc, h) => acc + (h.score || 0), 0) / totalCompleted).toFixed(1) 
        : "0";

    return (
        <DashboardPage>
            <DashboardHeader
                title="Student Exam Terminal"
                subtitle="Launch active examination sessions or inspect detailed post-submission performance history."
                badge={
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[11px] font-bold uppercase tracking-wider py-0.5">
                        Assessments Hub
                    </Badge>
                }
            />

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <DashboardMetricCard
                    title="Available Exams"
                    value={availableExams.length}
                    subtitle="Ready to take right now"
                    icon={<BookOpen className="size-4 text-primary" />}
                />
                <DashboardMetricCard
                    title="Completed Tests"
                    value={totalCompleted}
                    subtitle="Total historical submissions"
                    icon={<CheckCircle className="size-4 text-emerald-500" />}
                />
                <DashboardMetricCard
                    title="Passed Sessions"
                    value={passedExams}
                    subtitle={`${totalCompleted > 0 ? Math.round((passedExams / totalCompleted) * 100) : 0}% success rate`}
                    icon={<Award className="size-4 text-amber-500" />}
                />
                <DashboardMetricCard
                    title="Average Score"
                    value={`${avgScore} pts`}
                    subtitle="Performance across all tests"
                    icon={<Clock className="size-4 text-blue-500" />}
                />
            </div>

            <ExamClientSection
                availableExams={availableExams}
                historyExams={validHistoryExams}
            />
        </DashboardPage>
    );
}
