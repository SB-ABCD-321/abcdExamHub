import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, ClipboardList, CheckCircle2, Bot, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { DraftClearer } from "@/components/shared/DraftClearer";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { ExamListClient, ExamRecord } from "@/components/teacher/ExamListClient";

export default async function TeacherExamsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { teacherWorkspaces: true }
    });

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    const workspaceIds = dbUser.teacherWorkspaces.map(w => w.id);
    if (dbUser.role === "ADMIN") {
        const adminWorkspace = await db.workspace.findUnique({ where: { adminId: dbUser.id } });
        if (adminWorkspace && !workspaceIds.includes(adminWorkspace.id)) {
            workspaceIds.push(adminWorkspace.id);
        }
    }

    const isPureTeacher = dbUser.role === "TEACHER";
    const examFilter = isPureTeacher ? { authorId: dbUser.id } : {};

    // Fetch all accessible examinations with questions count and result participations
    const exams = await db.exam.findMany({
        where: {
            OR: [
                { workspaceId: { in: workspaceIds }, ...examFilter },
                { isPublic: true }
            ]
        },
        include: {
            _count: { select: { questions: true, results: true } },
            workspace: { select: { name: true } },
            author: { select: { firstName: true, lastName: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    // Compute dynamic analytical metric values (NO static mock values)
    const totalExams = exams.length;
    const activeExams = exams.filter(e => e.status === "ACTIVE").length;
    const totalAssignedQuestions = exams.reduce((acc, e) => acc + e._count.questions, 0);
    const totalCandidateResults = exams.reduce((acc, e) => acc + e._count.results, 0);

    return (
        <DashboardPage>
            <Suspense><DraftClearer storageKey="exam-create-draft" successTrigger="created" /></Suspense>

            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Exam <span className="text-primary font-black">Portfolio</span></>}
                subtitle="Design, schedule, supervise, and analyze examination sets across institutional workspaces."
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/teacher/exams/new?mode=auto">
                            <Button size="sm" className="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-xs gap-1.5 transition-all">
                                <Bot className="size-3.5" />
                                <span>Quick Setup</span>
                            </Button>
                        </Link>
                        <Link href="/teacher/exams/new?mode=manual">
                            <Button variant="outline" size="sm" className="h-9 px-3.5 border-border/70 hover:bg-muted font-bold text-xs rounded-xl gap-1.5 shadow-xs transition-all">
                                <PlusCircle className="size-3.5" />
                                <span>Manual Setup</span>
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* HIGH-DENSITY ANALYTICAL NUMERIC KPI METRICS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Total Examinations"
                    value={totalExams}
                    subtitle={`${activeExams} exams currently live`}
                    icon={<ClipboardList className="size-4 text-primary" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {totalExams} Sets
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Active Sessions"
                    value={activeExams}
                    subtitle="Currently taking candidates"
                    icon={<CheckCircle2 className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {activeExams} Live
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Curriculum Items"
                    value={totalAssignedQuestions}
                    subtitle="Questions assigned across sets"
                    icon={<BookOpen className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {totalAssignedQuestions} Qs
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Student Attempts"
                    value={totalCandidateResults}
                    subtitle="Completed participant submissions"
                    icon={<Users className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {totalCandidateResults} Results
                        </span>
                    }
                />
            </div>

            {/* INTERACTIVE TABLE & CARD VIEW ENGINE */}
            <div className="pt-2">
                <ExamListClient exams={exams as unknown as ExamRecord[]} isTeacher={isPureTeacher} />
            </div>
        </DashboardPage>
    );
}
