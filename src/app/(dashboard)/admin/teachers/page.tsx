import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AddUserModal } from "@/components/workspace/AddUserModal";
import { 
    Users, 
    ClipboardList, 
    BookOpen, 
    TrendingUp, 
    QrCode, 
    AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { TeachersDirectoryClient } from "@/components/admin/TeachersDirectoryClient";

export default async function AdminTeachersPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    const workspace = await db.workspace.findUnique({
        where: { adminId: dbUser.id },
    });

    if (!workspace) {
        return (
            <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border/60">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-base text-foreground">Infrastructure Missing</p>
                <p className="text-xs text-muted-foreground mt-0.5">Please initialize your workspace profile on the dashboard first.</p>
            </div>
        );
    }

    const workspaceWithTeachers = await db.workspace.findUnique({
        where: { id: workspace.id },
        include: {
            teachers: {
                orderBy: { createdAt: 'desc' },
                include: {
                    authoredQuestions: { select: { id: true } },
                    authoredExams: {
                        include: {
                            _count: { select: { results: true } }
                        }
                    },
                    workspaceAiUsages: {
                        where: { workspaceId: workspace.id }
                    }
                }
            }
        }
    });

    if (!workspaceWithTeachers) {
        return (
            <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border/60">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-base text-foreground">Infrastructure Missing</p>
                <p className="text-xs text-muted-foreground mt-0.5">Please initialize your workspace profile on the dashboard first.</p>
            </div>
        );
    }

    const { teachers } = workspaceWithTeachers;

    // Calculate aggregated high-density metrics
    const totalExamsCreated = teachers.reduce((acc, t) => acc + t.authoredExams.length, 0);
    const totalQuestionsAuthored = teachers.reduce((acc, t) => acc + t.authoredQuestions.length, 0);
    const totalStudentAttempts = teachers.reduce((acc, t) => 
        acc + t.authoredExams.reduce((a, e) => a + e._count.results, 0), 0
    );

    const teacherCapPercent = workspace.maxTeachers > 0 
        ? Math.min(100, Math.round((teachers.length / workspace.maxTeachers) * 100)) 
        : 0;

    return (
        <DashboardPage>
            {/* Standardized Dashboard Header */}
            <DashboardHeader
                title={<>Faculty <span className="text-primary font-black">Directory</span></>}
                subtitle={`Supervise educator staff, assign AI question quotas, monitor authored exam engagement for ${workspaceWithTeachers.name}.`}
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link href="/admin/invitations">
                            <Button variant="outline" size="sm" className="h-8.5 px-3 border-border/60 hover:bg-muted font-bold text-xs rounded-xl gap-1.5 cursor-pointer">
                                <QrCode className="size-3.5 text-muted-foreground" />
                                <span>QR Invite</span>
                            </Button>
                        </Link>
                        <AddUserModal roleType="TEACHER" />
                    </div>
                }
            />

            {/* EXACTLY 4 HIGH-DENSITY NUMBER-DRIVEN KPI CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {/* 1. Faculty Staff Count */}
                <DashboardMetricCard
                    title="Active Faculty Seats"
                    value={teachers.length}
                    subtitle={`${teachers.length} of ${workspace.maxTeachers} allocated seats`}
                    progress={teacherCapPercent}
                    icon={<Users className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {teacherCapPercent}% Cap
                        </span>
                    }
                />

                {/* 2. Authored Exams */}
                <DashboardMetricCard
                    title="Authored Exam Sets"
                    value={totalExamsCreated}
                    subtitle="Institutional tests deployed"
                    progress={Math.min(100, Math.round((totalExamsCreated / Math.max(1, workspace.maxExams)) * 100))}
                    icon={<ClipboardList className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {totalExamsCreated} Live
                        </span>
                    }
                />

                {/* 3. Question Bank */}
                <DashboardMetricCard
                    title="Curated Questions"
                    value={totalQuestionsAuthored}
                    subtitle="MCQ & descriptive question items"
                    progress={Math.min(100, Math.round((totalQuestionsAuthored / Math.max(1, workspace.maxQuestions)) * 100))}
                    icon={<BookOpen className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {totalQuestionsAuthored} Items
                        </span>
                    }
                />

                {/* 4. Total Student Submissions */}
                <DashboardMetricCard
                    title="Candidate Submissions"
                    value={totalStudentAttempts}
                    subtitle="Student responses evaluated"
                    progress={100}
                    icon={<TrendingUp className="size-4 text-blue-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {totalStudentAttempts} Attempts
                        </span>
                    }
                />
            </div>

            {/* INTERACTIVE TEACHERS DIRECTORY WITH SEARCH & SORTING */}
            <TeachersDirectoryClient
                teachers={teachers as any}
                workspaceId={workspaceWithTeachers.id}
                workspaceName={workspaceWithTeachers.name}
            />
        </DashboardPage>
    );
}
