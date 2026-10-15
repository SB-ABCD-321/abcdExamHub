import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, FolderOpen, History, Zap, TrendingUp, Users, Plus, Lightbulb } from "lucide-react";
import { EntityBarChart } from "@/components/analytics/BarChart";
import { cn } from "@/lib/utils";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TeacherDashboard() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { teacherWorkspaces: true }
    });

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <h2 className="text-2xl font-bold uppercase tracking-tighter">Access Restricted</h2>
                <p className="text-muted-foreground mt-2 max-w-md font-medium">You are not registered as a teacher. Please ask an Institute Admin to appoint you using your email address.</p>
            </div>
        );
    }

    const workspaceIds = dbUser.teacherWorkspaces.map(w => w.id);
    if (dbUser.role === "ADMIN") {
        const adminWorkspace = await db.workspace.findUnique({ where: { adminId: dbUser.id } });
        if (adminWorkspace) workspaceIds.push(adminWorkspace.id);
    }

    if (workspaceIds.length === 0) {
        return (
            <div className="p-12 text-center bg-card/60 rounded-3xl border-2 border-dashed border-border/70">
                <p className="font-bold text-lg text-foreground">No Workspaces Found</p>
                <p className="text-sm text-muted-foreground">Wait for an administrator to assign you to a workspace.</p>
            </div>
        );
    }

    // Filter by author if it's a pure teacher
    const isPureTeacher = dbUser.role === "TEACHER";
    const authorFilter = isPureTeacher ? { authorId: dbUser.id } : {};

    const [questionsCount, examsCount, topicsCount, resultsCount] = await Promise.all([
        db.question.count({ where: { workspaceId: { in: workspaceIds }, ...authorFilter } }),
        db.exam.count({ where: { workspaceId: { in: workspaceIds }, ...authorFilter } }),
        db.topic.count({ where: { workspaceId: { in: workspaceIds } } }), // Topics are shared in workspace
        db.examResult.count({
            where: {
                exam: {
                    workspaceId: { in: workspaceIds },
                    ...authorFilter
                }
            }
        })
    ]);

    const topicsWithQuestions = await db.topic.findMany({
        where: { workspaceId: { in: workspaceIds } },
        include: {
            questions: {
                where: authorFilter,
                select: { id: true }
            }
        }
    });

    const topicChartData = topicsWithQuestions
        .filter(t => t.questions.length > 0)
        .map(t => ({ name: t.name, total: t.questions.length }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    // Dynamic Context
    const hasUnlimitedAIAccess = dbUser.teacherWorkspaces.some(w => w.aiUnlimited) || (dbUser.role === "ADMIN" && dbUser.teacherWorkspaces[0]?.aiUnlimited) || false;

    const instructorTips = [
        "High-quality question banks lead to more accurate assessments. Try the AI Generator to diversify your items.",
        "Use 'Strict Proctoring' for high-stakes exams to monitor tab switches in real-time.",
        "Analyze the 'Content Delivery' chart to identify which topics need more question coverage.",
        "Group questions by 'Topic' to allow for randomized mission generation.",
        "Regularly archive old exams to keep your mission registry clean and professional."
    ];
    const dailyTip = instructorTips[new Date().getDay() % instructorTips.length];

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Instructor <span className="text-primary font-black">Hub</span></>}
                subtitle="Monitor curriculum performance, authored question banks, and student examination engagement."
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/teacher/questions/new">
                            <Button size="sm" className="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-xs gap-1.5 transition-all">
                                <Plus className="size-3.5" />
                                <span>New Question</span>
                            </Button>
                        </Link>
                        <Link href="/teacher/exams">
                            <Button variant="outline" size="sm" className="h-9 px-3.5 border-border/70 hover:bg-muted font-bold text-xs rounded-xl gap-1.5 shadow-xs transition-all">
                                <span>View Exams</span>
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* DYNAMIC NUMERIC ANALYTICAL KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Curriculum Items"
                    value={questionsCount}
                    subtitle="Authored assessment questions"
                    icon={<FileQuestion className="size-4 text-primary" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {questionsCount} Items
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Exam Portfolio"
                    value={examsCount}
                    subtitle="Designed examination sets"
                    icon={<History className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {examsCount} Exams
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Total Engagement"
                    value={resultsCount}
                    subtitle="Student candidate attempts"
                    icon={<Users className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {resultsCount} Attempts
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="AI Infrastructure"
                    value={hasUnlimitedAIAccess ? "Unlimited" : "Standard"}
                    subtitle={hasUnlimitedAIAccess ? "Enterprise quota unlocked" : "Smart generator enabled"}
                    icon={<Zap className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {hasUnlimitedAIAccess ? "Unlimited" : "Active"}
                        </span>
                    }
                />
            </div>

            {/* CHARTS & PEDAGOGICAL INSIGHTS */}
            <div className="grid lg:grid-cols-3 gap-5 pt-1">
                <Card className="lg:col-span-2 border border-border/70 bg-card/90 backdrop-blur-xl rounded-2xl p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-foreground">Content Delivery Analysis</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Top curriculum chapters ranked by authored question volume.</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    {topicChartData.length > 0 ? (
                        <EntityBarChart
                            data={topicChartData}
                            title=""
                            description=""
                            dataKey="total"
                            nameKey="name"
                            color="#6366f1"
                        />
                    ) : (
                        <div className="p-12 border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center bg-muted/10 text-center">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">No Subject Data Available</p>
                            <p className="text-xs text-muted-foreground mt-1">Author questions in your subject chapters to generate analytics.</p>
                        </div>
                    )}
                </Card>

                <Card className="border border-border/70 bg-card/90 backdrop-blur-xl rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <Lightbulb className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Pedagogical Recommendation</h3>
                        </div>

                        <p className="text-xs leading-relaxed text-muted-foreground italic mb-6">
                            "{dailyTip}"
                        </p>

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/50">
                                <div className="flex items-center gap-2.5">
                                    <FolderOpen className="w-4 h-4 text-indigo-500" />
                                    <span className="text-xs font-semibold text-foreground">Available Topics</span>
                                </div>
                                <span className="text-sm font-black text-foreground tabular-nums">{topicsCount}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/50">
                                <div className="flex items-center gap-2.5">
                                    <History className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-semibold text-foreground">Live Examinations</span>
                                </div>
                                <span className="text-sm font-black text-foreground tabular-nums">{examsCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/40 mt-4">
                        <Link href="/teacher/exams/new?mode=auto">
                            <Button variant="outline" size="sm" className="w-full h-8.5 rounded-xl text-xs font-bold border-border/70 text-foreground hover:bg-muted/50">
                                Create New Assessment
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        </DashboardPage>
    );
}
