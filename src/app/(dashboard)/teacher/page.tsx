import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, FolderOpen, History, Zap, TrendingUp, Users } from "lucide-react";
import { EntityBarChart } from "@/components/analytics/BarChart";
import { cn } from "@/lib/utils";

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
            <div className="p-12 text-center bg-slate-50 dark:bg-zinc-900 rounded-3xl border-2 border-dashed">
                <p className="font-bold text-lg">No Workspaces Found</p>
                <p className="text-sm text-muted-foreground">Wait for an administrator to assign you to a workspace.</p>
            </div>
        )
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

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Instructor <span className="text-primary">Hub</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Monitor your curriculum performance and engagement.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-lg shadow-indigo-500/5 bg-white dark:bg-zinc-900 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Items</CardTitle>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <FileQuestion className="h-4 w-4 text-indigo-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{questionsCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Questions authored</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg shadow-indigo-500/5 bg-white dark:bg-zinc-900 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portfolio</CardTitle>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                            <History className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{examsCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Exams designed</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg shadow-indigo-500/5 bg-white dark:bg-zinc-900 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Engagement</CardTitle>
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                            <Users className="h-4 w-4 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{resultsCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Total participations</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-indigo-600 text-white rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-100">AI Support</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black uppercase">Active</div>
                        <p className="text-[10px] text-indigo-100 mt-1 font-bold">Smart Generator Ready</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 pt-4">
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-zinc-900 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Content Delivery</h3>
                            <p className="text-xs text-muted-foreground font-medium">Top categories by question volume.</p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
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
                        <div className="p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-800/20">
                            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-30">No Data Points</p>
                            <p className="text-xs text-muted-foreground mt-1">Add questions to your topics to see analytics.</p>
                        </div>
                    )}
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-zinc-900 rounded-3xl p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2 text-indigo-600">Upgrade Tip</h3>
                        <p className="text-sm font-medium mb-6 italic">"High-quality question banks lead to more accurate assessments. Try the AI Generator to diversify your items."</p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                <FolderOpen className="w-5 h-5 text-indigo-600" />
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-500">System Topics</p>
                                    <p className="text-lg font-black">{topicsCount}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                <History className="w-5 h-5 text-emerald-600" />
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-500">Live Exams</p>
                                    <p className="text-lg font-black">{examsCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
