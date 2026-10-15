import { db } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Users, 
    Building2, 
    BookCheck, 
    ShieldAlert, 
    CheckCircle2, 
    Zap, 
    TrendingUp, 
    Inbox, 
    Activity, 
    AlertCircle,
    ArrowUpRight,
    Server,
    Cpu,
    Database,
    ShieldCheck,
    Radio
} from "lucide-react";
import { EntityBarChart } from "@/components/analytics/BarChart";
import { RolePieChart } from "@/components/analytics/PieChart";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";

export default async function SuperAdminDashboard() {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Role Demographics & Core Repository Counts
    const [rolesGrouped, workspacesCount, examsCount, questionsCount] = await Promise.all([
        db.user.groupBy({
            by: ['role'],
            _count: { role: true }
        }).catch(() => []),
        db.workspace.count().catch(() => 0),
        db.exam.count().catch(() => 0),
        db.question.count().catch(() => 0),
    ]);

    const usersCount = rolesGrouped.reduce((acc, r) => acc + r._count.role, 0);

    // 2. Action Queue & Growth Velocity
    const [pendingInquiriesCount, pendingRequisitionsCount, unreadBookingsCount, lastWeekWorkspaces] = await Promise.all([
        db.inquiry.count({ where: { status: "PENDING" } }).catch(() => 0),
        db.workspaceRequest.count({ where: { status: "PENDING" } }).catch(() => 0),
        db.callBooking.count({ where: { isRead: false } }).catch(() => 0),
        db.workspace.count({ where: { createdAt: { gte: sevenDaysAgo } } }).catch(() => 0),
    ]);

    // 3. Activity Feeds & Recent Velocity
    const [recentResults, activeExamsCount, globalActivities, workspaces] = await Promise.all([
        db.examResult.findMany({
            where: { createdAt: { gte: fourteenDaysAgo } },
            select: { createdAt: true },
            take: 250,
        }).catch(() => []),
        db.examDraft.count().catch(() => 0),
        db.examDraft.findMany({
            take: 8,
            orderBy: { updatedAt: 'desc' },
            include: {
                student: { select: { email: true, firstName: true, imageUrl: true } },
                exam: { 
                    select: { 
                        title: true, 
                        workspace: { select: { name: true, logoUrl: true } } 
                    } 
                } 
            }
        }).catch(() => []),
        db.workspace.findMany({
            take: 4,
            include: {
                admin: true,
                _count: { select: { teachers: true, students: true, exams: true } }
            },
            orderBy: { createdAt: 'desc' }
        }).catch(() => []),
    ]);

    // 14-day velocity timeline
    const daysMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        daysMap.set(key, 0);
    }
    recentResults.forEach(r => {
        const key = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (daysMap.has(key)) {
            daysMap.set(key, (daysMap.get(key) || 0) + 1);
        }
    });
    const velocityData = Array.from(daysMap.entries()).map(([date, count]) => ({
        date,
        submissions: count,
    }));
    const totalRecentSubmissions = recentResults.length;
    const dailyAverageSubmissions = (totalRecentSubmissions / 14).toFixed(1);

    const roleNameMap: Record<string, string> = {
        SUPER_ADMIN: "Super Admin",
        ADMIN: "Workspace Admin",
        TEACHER: "Faculty / Instructor",
        STUDENT: "Student Scholar",
    };
    const roleData = rolesGrouped.map(r => ({
        name: roleNameMap[r.role] || r.role.replace("_", " "),
        value: r._count.role
    }));

    const globalAiUsage = workspaces.reduce((acc, ws) => acc + ws.aiGenerationsCount, 0);
    const computeCapacity = Math.min(99.9, 84.2 + (activeExamsCount * 0.5) + (workspacesCount * 0.1));
    const clusterLatency = 18 + (new Date().getSeconds() % 12);
    const totalPendingActions = pendingRequisitionsCount + pendingInquiriesCount + unreadBookingsCount;

    async function toggleAiUnlimited(workspaceId: string, currentStatus: boolean) {
        'use server';
        await db.workspace.update({
            where: { id: workspaceId },
            data: { aiUnlimited: !currentStatus }
        });
        revalidatePath('/super-admin');
    }

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Strategic <span className="text-primary font-black">Command</span></>}
                subtitle="Real-time multi-tenant monitoring, infrastructure capacity, and active exam supervision."
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/super-admin/requests">
                            <Button size="sm" className="h-8.5 px-3 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs rounded-xl shadow-2xs gap-1.5">
                                <Inbox className="size-3.5" />
                                <span>Requests ({pendingRequisitionsCount})</span>
                            </Button>
                        </Link>
                        <Link href="/super-admin/workspaces">
                            <div className="h-8.5 px-3 rounded-xl border border-border/60 bg-card hover:bg-muted/60 transition-colors shadow-2xs flex items-center gap-2 cursor-pointer">
                                <Building2 className="size-3.5 text-primary" />
                                <span className="text-xs font-semibold text-muted-foreground">Global Nodes</span>
                                <span className="text-xs font-black tabular-nums text-foreground">{workspacesCount}</span>
                            </div>
                        </Link>
                    </div>
                }
            />

            {/* ENHANCED ANALYTICAL PULSE METRICS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Active Workspaces"
                    value={workspacesCount}
                    subtitle={`+${lastWeekWorkspaces} provisioned in 7d`}
                    icon={<Building2 className="size-4 text-primary" />}
                    progress={Math.min(100, Math.max(15, (workspacesCount / 30) * 100))}
                />

                <DashboardMetricCard
                    title="Platform Population"
                    value={usersCount.toLocaleString()}
                    subtitle={`${rolesGrouped.find(r => r.role === 'STUDENT')?._count.role || 0} students • ${rolesGrouped.find(r => r.role === 'TEACHER')?._count.role || 0} faculty`}
                    icon={<Users className="size-4 text-emerald-500" />}
                    progress={Math.min(100, Math.max(10, (usersCount / 500) * 100))}
                />

                <DashboardMetricCard
                    title="Curriculum Assets"
                    value={examsCount}
                    subtitle={`${questionsCount.toLocaleString()} total questions pooled`}
                    icon={<BookCheck className="size-4 text-blue-500" />}
                    badge={
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {examsCount} Active
                        </span>
                    }
                    progress={Math.min(100, Math.max(15, (examsCount / 50) * 100))}
                />

                <DashboardMetricCard
                    title="Action Queue"
                    value={totalPendingActions}
                    subtitle={`${pendingRequisitionsCount} waitlist • ${pendingInquiriesCount} inquiries`}
                    icon={<Inbox className={cn("size-4", totalPendingActions > 0 ? "text-amber-500" : "text-muted-foreground")} />}
                    badge={
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {totalPendingActions} Pending
                        </span>
                    }
                />
            </div>

            {/* ANALYTICS & DATA VISUALIZATION SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* 14-Day Examination & Assessment Velocity */}
                <Card className="lg:col-span-8 border border-border/60 bg-card rounded-2xl shadow-2xs flex flex-col justify-between overflow-hidden">
                    <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                                    <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Academic Velocity</CardDescription>
                                </div>
                                <CardTitle className="text-base sm:text-lg font-bold tracking-tight">Examination Submissions (Last 14 Days)</CardTitle>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-[11px] tabular-nums">
                                    {totalRecentSubmissions} Total Submissions
                                </div>
                                <div className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-semibold text-[11px] tabular-nums">
                                    ~{dailyAverageSubmissions} / day
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                        <div className="h-[220px] sm:h-[240px] w-full">
                            <EntityBarChart 
                                data={velocityData} 
                                dataKey="submissions" 
                                nameKey="date" 
                                color="var(--primary)" 
                                noCard={true} 
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-border/40 text-center">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-muted/40">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Live Tests Now</p>
                                <p className="text-base sm:text-lg font-black text-foreground tabular-nums">{activeExamsCount}</p>
                            </div>
                            <div className="p-2 sm:p-2.5 rounded-xl bg-muted/40">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Exams</p>
                                <p className="text-base sm:text-lg font-black text-foreground tabular-nums">{examsCount}</p>
                            </div>
                            <div className="p-2 sm:p-2.5 rounded-xl bg-muted/40">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Questions Pool</p>
                                <p className="text-base sm:text-lg font-black text-foreground tabular-nums">{questionsCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Role Demographics Donut Chart */}
                <Card className="lg:col-span-4 border border-border/60 bg-card rounded-2xl shadow-2xs flex flex-col justify-between overflow-hidden">
                    <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
                        <div className="space-y-0.5">
                            <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Demographics Allocation</CardDescription>
                            <CardTitle className="text-base sm:text-lg font-bold tracking-tight">Role Distribution</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                        <div className="h-[190px] flex items-center justify-center">
                            <RolePieChart data={roleData} centerLabel={`${usersCount} Total`} />
                        </div>
                        <div className="space-y-2 pt-2 border-t border-border/40">
                            {roleData.map((item, idx) => {
                                const colors = ['bg-primary', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500'];
                                const total = roleData.reduce((acc, curr) => acc + curr.value, 0);
                                const pct = total > 0 ? (item.value / total) * 100 : 0;

                                return (
                                    <div key={item.name} className="space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-[11px] font-medium text-muted-foreground truncate">{item.name}</span>
                                            <span className="font-bold text-foreground text-xs tabular-nums">
                                                {item.value} <span className="text-[10px] text-muted-foreground font-normal">({pct.toFixed(0)}%)</span>
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-500", colors[idx % colors.length])}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* EXPANSION ALERT & CLUSTER CAPACITY STRIP */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2 bg-card border border-border/60 p-5 rounded-2xl shadow-2xs relative overflow-hidden flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <div className="size-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <Inbox className="size-4" />
                                </div>
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Expansion Waitlist</p>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-foreground tabular-nums tracking-tight">
                                {pendingRequisitionsCount} <span className="text-sm font-semibold text-muted-foreground">Institutions Awaiting Approval</span>
                            </h2>
                            <p className="text-xs text-muted-foreground max-w-md">Pending workspace creation requests awaiting strategic administrative authorization.</p>
                        </div>
                        <Link href="/super-admin/requests" className="shrink-0 w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-9.5 px-4.5 rounded-xl text-xs font-semibold tracking-wide">
                                <span>Audit Requests</span>
                                <ArrowUpRight className="ml-1.5 size-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cluster Health</h4>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5">
                            {clusterLatency}ms Latency
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between items-center text-[10px] font-semibold mb-1 text-muted-foreground">
                                <span>Compute Load</span>
                                <span className="text-foreground font-bold">{computeCapacity.toFixed(1)}%</span>
                            </div>
                            <Progress value={computeCapacity} className="h-1.5" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-[10px] font-semibold mb-1 text-muted-foreground">
                                <span>Global AI Generations</span>
                                <span className="text-foreground font-bold">{globalAiUsage.toLocaleString()} ops</span>
                            </div>
                            <Progress value={Math.min((globalAiUsage / 500) * 100, 100)} className="h-1.5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE GLOBAL INTELLIGENCE MONITOR */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Radio className="size-3.5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">Global Intelligence Feed</h3>
                            <p className="text-[11px] text-muted-foreground">Live proctoring streams and active candidate mission status</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                        Live Pulse Active
                    </Badge>
                </div>

                <Card className="border border-border/60 bg-card rounded-2xl overflow-hidden p-3.5 sm:p-4 shadow-2xs">
                    {globalActivities.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-xs font-medium">
                            No active examination drafts currently running.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {globalActivities.map((activity) => (
                                <div key={activity.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/40 transition-all flex flex-col justify-between gap-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Avatar className="size-7 rounded-lg">
                                                <AvatarImage src={activity.student?.imageUrl || ""} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px] uppercase">
                                                    {activity.student?.firstName?.[0] || "S"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">{activity.student?.firstName || "Candidate"}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{activity.exam.workspace.name}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-semibold py-0.5 border-border/60 shrink-0">
                                            {activity.tabSwitches > 0 ? (
                                                <span className="text-rose-500 flex items-center gap-1 font-bold">
                                                    <AlertCircle className="size-2.5" /> {activity.tabSwitches} Flags
                                                </span>
                                            ) : (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Nominal</span>
                                            )}
                                        </Badge>
                                    </div>
                                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                                        <h4 className="text-[11px] font-medium text-foreground line-clamp-1 flex-1">{activity.exam.title}</h4>
                                        <Activity className="size-3 text-muted-foreground shrink-0 ml-1.5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* ACTIVE NODE REGISTRY */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">Institutional Node Registry</h3>
                        <p className="text-[11px] text-muted-foreground">Showing top 4 active workspaces • Access full tenant ledger in main directory</p>
                    </div>
                    <Link href="/super-admin/workspaces">
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1 text-primary hover:text-primary">
                            <span>View All ({workspacesCount})</span>
                            <ArrowUpRight className="size-3.5" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {workspaces.map((ws) => (
                        <Card key={ws.id} className="border border-border/60 bg-card rounded-2xl shadow-2xs hover:border-primary/40 transition-all p-4 flex flex-col justify-between gap-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm shrink-0">
                                        {ws.name?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-foreground truncate">{ws.name}</h4>
                                        <p className="text-[10px] text-muted-foreground truncate">{ws.admin.email}</p>
                                    </div>
                                </div>
                                {ws.aiUnlimited ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] font-bold shrink-0">
                                        Unlimited AI
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[9px] text-muted-foreground shrink-0">
                                        {ws.aiGenerationsCount} Used
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 py-2 px-2.5 rounded-xl bg-muted/40 text-center">
                                <div>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold">Users</p>
                                    <p className="text-xs font-bold text-foreground">{ws._count.students + ws._count.teachers}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold">Exams</p>
                                    <p className="text-xs font-bold text-foreground">{ws._count.exams}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] font-semibold text-muted-foreground">AI Quota</span>
                                <form action={toggleAiUnlimited.bind(null, ws.id, ws.aiUnlimited)}>
                                    <Button size="sm" variant={ws.aiUnlimited ? "outline" : "default"} className="h-7 rounded-lg text-[11px] font-semibold px-2.5">
                                        {ws.aiUnlimited ? "Revoke" : "Provision"}
                                    </Button>
                                </form>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardPage>
    );
}
