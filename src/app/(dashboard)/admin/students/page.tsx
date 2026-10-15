import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AddUserModal } from "@/components/workspace/AddUserModal";
import { 
    GraduationCap, 
    ClipboardList, 
    UserPlus, 
    TrendingUp, 
    QrCode, 
    AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { StudentsDirectoryClient } from "@/components/admin/StudentsDirectoryClient";

export default async function AdminStudentsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    const workspace = await db.workspace.findUnique({
        where: { adminId: dbUser.id },
        include: { 
            students: { 
                orderBy: { createdAt: 'desc' },
                include: {
                    examResults: {
                        select: { id: true, score: true }
                    }
                }
            } 
        }
    });

    if (!workspace) {
        return (
            <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border/60">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2 opacity-50" />
                <h2 className="text-base font-bold text-foreground">Workspace Required</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Please create your workspace profile on the dashboard first to manage students.</p>
            </div>
        );
    }

    const students = workspace.students;

    // Calculate aggregated high-density metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newStudents30d = students.filter(s => new Date(s.createdAt) >= thirtyDaysAgo).length;

    const totalAttempts = students.reduce((acc, s) => acc + (s.examResults?.length || 0), 0);
    const allScores = students.flatMap(s => (s.examResults || []).map(r => r.score));
    const averageScore = allScores.length > 0
        ? Math.round(allScores.reduce((acc, score) => acc + score, 0) / allScores.length)
        : 0;

    const studentCapPercent = workspace.maxStudents > 0 
        ? Math.min(100, Math.round((students.length / workspace.maxStudents) * 100)) 
        : 0;

    return (
        <DashboardPage>
            {/* Standardized Dashboard Header */}
            <DashboardHeader
                title={<>Student <span className="text-primary font-black">Cohort</span></>}
                subtitle={`Enrolled candidate roster, assessment participation tracking, and faculty promotion for ${workspace.name}.`}
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link href="/admin/invitations">
                            <Button variant="outline" size="sm" className="h-8.5 px-3 border-border/60 hover:bg-muted font-bold text-xs rounded-xl gap-1.5 cursor-pointer">
                                <QrCode className="size-3.5 text-muted-foreground" />
                                <span>QR Portal</span>
                            </Button>
                        </Link>
                        <AddUserModal roleType="STUDENT" />
                    </div>
                }
            />

            {/* EXACTLY 4 HIGH-DENSITY NUMBER-DRIVEN KPI CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {/* 1. Total Enrolled Scholars */}
                <DashboardMetricCard
                    title="Enrolled Scholars"
                    value={students.length}
                    subtitle={`${students.length} of ${workspace.maxStudents} capacity slots`}
                    progress={studentCapPercent}
                    icon={<GraduationCap className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {studentCapPercent}% Cap
                        </span>
                    }
                />

                {/* 2. Assessment Submissions */}
                <DashboardMetricCard
                    title="Test Submissions"
                    value={totalAttempts}
                    subtitle="Student responses evaluated"
                    progress={100}
                    icon={<ClipboardList className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Evaluated
                        </span>
                    }
                />

                {/* 3. 30-Day New Enrollees */}
                <DashboardMetricCard
                    title="Recent Enrollees"
                    value={newStudents30d}
                    subtitle="Enrolled in last 30 days"
                    progress={Math.min(100, Math.round((newStudents30d / Math.max(1, students.length)) * 100))}
                    icon={<UserPlus className="size-4 text-blue-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            30D Intake
                        </span>
                    }
                />

                {/* 4. Average Assessment Score */}
                <DashboardMetricCard
                    title="Cohort Average Score"
                    value={`${averageScore}%`}
                    subtitle={`Calculated across ${allScores.length} tests`}
                    progress={averageScore}
                    icon={<TrendingUp className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Performance
                        </span>
                    }
                />
            </div>

            {/* INTERACTIVE STUDENTS DIRECTORY WITH SEARCH, SORT, TABLE/GRID VIEWS */}
            <StudentsDirectoryClient
                students={students as any}
                workspaceId={workspace.id}
                workspaceName={workspace.name}
            />
        </DashboardPage>
    );
}
