import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WorkspaceSettingsForm } from "@/components/workspace/WorkspaceSettingsForm";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Building2, 
    GraduationCap, 
    Users, 
    ClipboardList, 
    Sparkles, 
    Zap, 
    ArrowRight 
} from "lucide-react";

export default async function AdminSettingsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    let workspace = await db.workspace.findUnique({
        where: { adminId: dbUser.id }
    });

    if (!workspace && dbUser.role === "SUPER_ADMIN") {
        workspace = await db.workspace.findFirst();
    }

    if (!workspace) {
        return (
            <DashboardPage>
                <div className="p-12 text-center rounded-2xl bg-card border border-border/70 space-y-3 max-w-lg mx-auto my-12">
                    <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                        <Building2 className="size-6" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground">Workspace Not Initialized</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Please establish your institutional workspace profile on the dashboard to access administrative controls.
                    </p>
                </div>
            </DashboardPage>
        );
    }

    // Load live telemetry counts
    const [studentCount, teacherCount, examCount, activePayment] = await Promise.all([
        db.user.count({
            where: { role: 'STUDENT', studentWorkspaces: { some: { id: workspace.id } } }
        }),
        db.user.count({
            where: { role: 'TEACHER', teacherWorkspaces: { some: { id: workspace.id } } }
        }),
        db.exam.count({
            where: { workspaceId: workspace.id }
        }),
        db.workspacePayment.findFirst({
            where: { workspaceId: workspace.id, status: 'PAID', expiryDate: { gt: new Date() } },
            orderBy: { expiryDate: 'desc' }
        })
    ]);

    const studentCapPercent = workspace.maxStudents > 0 
        ? Math.min(100, Math.round((studentCount / workspace.maxStudents) * 100)) 
        : 0;

    const teacherCapPercent = workspace.maxTeachers > 0 
        ? Math.min(100, Math.round((teacherCount / workspace.maxTeachers) * 100)) 
        : 0;

    const examCapPercent = workspace.maxExams > 0 
        ? Math.min(100, Math.round((examCount / workspace.maxExams) * 100)) 
        : 0;

    const aiCapPercent = workspace.aiLimit > 0
        ? Math.min(100, Math.round(((workspace.aiGenerationsCount || 0) / workspace.aiLimit) * 100))
        : 0;

    const daysRemaining = activePayment 
        ? Math.max(0, Math.ceil((new Date(activePayment.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <DashboardPage className="space-y-6">
            {/* Standardized Dashboard Header without unwanted Tenant Governance badge */}
            <DashboardHeader
                title={<>Workspace <span className="text-primary font-black">Settings</span></>}
                subtitle={`Institutional parameters, public branding, and compliance identity for ${workspace.name}.`}
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="border-border/60 text-muted-foreground text-xs font-mono py-1 px-2.5">
                            <Building2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
                            Shard: {workspace.id.slice(0, 8).toUpperCase()}
                        </Badge>
                        <Link href="/admin/billing">
                            <Button size="sm" className="h-8.5 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-2xs gap-1.5 cursor-pointer">
                                <Zap className="w-3.5 h-3.5 fill-current" />
                                <span>Billing & Quota</span>
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Top 4 Static Metric KPI Cards */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {/* 1. Student Capacity */}
                <DashboardMetricCard
                    title="Student Seats"
                    value={studentCount}
                    subtitle={`${studentCount} of ${workspace.maxStudents} enrolled candidates`}
                    progress={studentCapPercent}
                    icon={<GraduationCap className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {studentCapPercent}% Cap
                        </span>
                    }
                />

                {/* 2. Faculty Capacity */}
                <DashboardMetricCard
                    title="Faculty Leads"
                    value={teacherCount}
                    subtitle={`${teacherCount} of ${workspace.maxTeachers} faculty appointed`}
                    progress={teacherCapPercent}
                    icon={<Users className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {teacherCapPercent}% Cap
                        </span>
                    }
                />

                {/* 3. Exams Capacity */}
                <DashboardMetricCard
                    title="Exams Created"
                    value={examCount}
                    subtitle={`${examCount} of ${workspace.maxExams} active tests`}
                    progress={examCapPercent}
                    icon={<ClipboardList className="size-4 text-primary" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {examCapPercent}% Used
                        </span>
                    }
                />

                {/* 4. AI Generation Quota */}
                <DashboardMetricCard
                    title="AI Generations"
                    value={workspace.aiUnlimited ? "Unlimited" : (workspace.aiLimit || 10)}
                    subtitle={`${workspace.aiGenerationsCount || 0} questions authored`}
                    progress={workspace.aiUnlimited ? 100 : aiCapPercent}
                    icon={<Sparkles className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {workspace.aiUnlimited ? "Unlimited" : "Gemini AI"}
                        </span>
                    }
                />
            </div>

            {/* Billing Quota & Subscription Strip */}
            <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-secondary/30 border border-primary/25 rounded-2xl p-4 sm:p-5 text-foreground relative overflow-hidden group shadow-2xs">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground">Workspace Subscription & Quota Allocation</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                {workspace.status || "ACTIVE"}
                            </span>
                            {daysRemaining > 0 ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                                    {daysRemaining} Days Left in Cycle
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                    Trial / Direct Tier
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                            Capacity limits: Up to <strong className="text-foreground">{workspace.maxConcurrentExams || 100} concurrent examinees</strong> and <strong className="text-foreground">{workspace.maxQuestions || 500} question items</strong> permitted under current shard tier.
                        </p>
                    </div>
                    <Link href="/admin/billing" className="shrink-0 w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto h-9 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer">
                            <Zap className="size-3.5 fill-current" />
                            <span>Renew & Expand Quotas</span>
                            <ArrowRight className="size-3.5 ml-0.5" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Proper Tabs Form (matching standard settings format) */}
            <WorkspaceSettingsForm workspace={workspace} />
        </DashboardPage>
    );
}
