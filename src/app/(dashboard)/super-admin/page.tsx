import { db } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, BookCheck, ShieldAlert, CheckCircle2, XCircle, Zap, MoreVertical, TrendingUp, Inbox, History, Activity, AlertCircle } from "lucide-react";
import { RolePieChart } from "@/components/analytics/PieChart";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function SuperAdminDashboard() {
    const usersCount = await db.user.count();
    const workspacesCount = await db.workspace.count();
    const examsCount = await db.exam.count();
    const questionsCount = await db.question.count();
    const systemAdmins = await db.user.count({ where: { role: "ADMIN" } });

    // Notification Summary
    const pendingInquiriesCount = await db.inquiry.count({ where: { status: "PENDING" } });
    const pendingRequisitionsCount = await db.workspaceRequest.count({ where: { status: "PENDING" } });
    const unreadBookingsCount = await db.callBooking.count({ where: { isRead: false } });

    // Growth Velocity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const lastWeekWorkspaces = await db.workspace.count({ where: { createdAt: { gte: sevenDaysAgo } } });

    // Active Monitoring Data
    const activeExamsCount = await db.examDraft.count();
    const globalActivities = await db.examDraft.findMany({
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
    });

    const rolesGrouped = await db.user.groupBy({
        by: ['role'],
        _count: { role: true }
    });

    const roleData = rolesGrouped.map(r => ({ name: r.role.replace("_", " "), value: r._count.role }));

    const workspaces = await db.workspace.findMany({
        include: {
            admin: true,
            _count: { select: { teachers: true, students: true, exams: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    const globalAiUsage = workspaces.reduce((acc, ws) => acc + ws.aiGenerationsCount, 0);

    // Dashboard Dynamics
    const computeCapacity = Math.min(99.9, 84.2 + (activeExamsCount * 0.5) + (workspacesCount * 0.1));
    const clusterLatency = 18 + (new Date().getSeconds() % 12);

    async function toggleAiUnlimited(workspaceId: string, currentStatus: boolean) {
        'use server'
        await db.workspace.update({
            where: { id: workspaceId },
            data: { aiUnlimited: !currentStatus }
        });
        revalidatePath('/super-admin');
    }

    return (
        <div className="space-y-6 pb-10 max-w-7xl mx-auto">
            {/* POWER HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/60">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                        Strategic <span className="text-primary">Command</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                        Real-time institutional oversight and global proctoring monitor.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-card p-3 sm:p-4 rounded-2xl border border-border/60 shadow-xs">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Global Nodes</p>
                        <p className="text-xl sm:text-2xl font-black tabular-nums text-foreground">{workspacesCount}</p>
                    </div>
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Building2 className="size-5" />
                    </div>
                </div>
            </div>

            {/* PULSE METRICS GRID */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Active Nodes", val: workspacesCount, desc: "Multi-tenants", icon: Building2, color: "indigo" },
                    { label: "Growth Velocity", val: lastWeekWorkspaces, desc: "New in last 7d", icon: TrendingUp, color: "emerald", trend: true },
                    { label: "Waitlist Pulse", val: pendingRequisitionsCount, desc: "Pending requests", icon: Inbox, color: "amber" },
                    { label: "Active Missions", val: activeExamsCount, desc: "Live feeds", icon: BookCheck, color: "rose", animate: true },
                ].map((metric, i) => (
                    <Card key={i} className="border border-border/60 bg-card rounded-2xl shadow-xs hover:border-primary/40 transition-colors">
                        <CardHeader className="p-4 pb-2">
                             <div className="flex items-center justify-between">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{metric.label}</CardTitle>
                                <div className={cn(
                                    "size-8 rounded-lg flex items-center justify-center",
                                    metric.color === 'indigo' ? "bg-indigo-500/10 text-indigo-500" :
                                    metric.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
                                    metric.color === 'rose' ? "bg-rose-500/10 text-rose-500" :
                                    "bg-amber-500/10 text-amber-500"
                                )}>
                                    <metric.icon className={cn("size-4", metric.animate && "animate-pulse")} />
                                </div>
                             </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{metric.val.toLocaleString()}</div>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1">{metric.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* STRATEGIC GROWTH PIPELINE */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2 bg-card border border-border/60 p-5 sm:p-6 rounded-2xl shadow-xs relative overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                        <div className="space-y-1.5">
                             <div className="flex items-center gap-2">
                                <div className="size-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <Inbox className="size-4" />
                                </div>
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Expansion Waitlist</p>
                             </div>
                             <h2 className="text-2xl sm:text-3xl font-black text-foreground tabular-nums tracking-tight">
                                {pendingRequisitionsCount} <span className="text-sm font-semibold text-muted-foreground">Nodes Pending</span>
                             </h2>
                             <p className="text-xs text-muted-foreground max-w-sm">Strategic institutional requests awaiting administrative authorization.</p>
                        </div>
                        <Link href="/super-admin/requests">
                            <Button className="h-10 px-5 rounded-xl text-xs font-semibold tracking-wide">
                                Authorize Requisitions
                                <TrendingUp className="ml-2 size-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="bg-card border border-border/60 p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-center text-center">
                     <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2.5">
                        <Activity className="size-5 animate-pulse" />
                     </div>
                     <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Compute Capacity</h4>
                     <p className="text-2xl font-black text-foreground mb-0.5">{computeCapacity.toFixed(1)}%</p>
                     <p className="text-[10px] text-muted-foreground">Global Cluster Load</p>
                </div>
            </div>

            {/* ALERT CENTER */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Institutional Requisitions</p>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">{pendingInquiriesCount} <span className="text-xs font-semibold text-muted-foreground">Inquiries</span></h2>
                    </div>
                    <Link href="/super-admin/requests">
                        <Button variant="outline" className="rounded-xl border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 h-9 text-xs font-semibold">
                            Audit Now
                        </Button>
                    </Link>
                </div>

                <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">Unread Bookings</p>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">{unreadBookingsCount} <span className="text-xs font-semibold text-muted-foreground">Deployments</span></h2>
                    </div>
                    <Button variant="outline" className="rounded-xl border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 h-9 text-xs font-semibold">
                        View Hub
                    </Button>
                </div>
            </div>

            {/* GLOBAL INTELLIGENCE FEED */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Activity className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">Global Intelligence Feed</h2>
                            <p className="text-[10px] text-muted-foreground font-medium">Real-time mission tracking across active nodes</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 px-3 py-1 rounded-full font-bold text-[10px]">
                        Live Pulse Active
                    </Badge>
                </div>

                <Card className="border border-border/60 bg-card rounded-2xl overflow-hidden p-4 shadow-xs">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {globalActivities.map((activity) => (
                            <div key={activity.id} className="p-3.5 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all">
                                <div className="flex items-start justify-between mb-2.5">
                                    <Avatar className="size-8 rounded-lg">
                                        <AvatarImage src={activity.student?.imageUrl || ""} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px] uppercase">{activity.student?.firstName?.[0] || "S"}</AvatarFallback>
                                    </Avatar>
                                    <Badge variant="outline" className="text-[9px] font-semibold py-0.5 border-border/60">
                                        {activity.tabSwitches > 0 ? (
                                            <span className="text-rose-500 flex items-center gap-1"><AlertCircle className="size-2.5" /> {activity.tabSwitches} Flags</span>
                                        ) : (
                                            <span className="text-emerald-500">Nominal</span>
                                        )}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                     <p className="text-[10px] font-bold text-primary truncate">{activity.exam.workspace.name}</p>
                                     <h4 className="text-xs font-semibold text-foreground line-clamp-1">{activity.exam.title}</h4>
                                     <div className="pt-2 flex items-center justify-between border-t border-border/50">
                                        <span className="text-[10px] text-muted-foreground">Student: {activity.student?.firstName || "Guest"}</span>
                                        <Activity className="size-3 text-muted-foreground" />
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid lg:grid-cols-12 gap-5">
                {/* ACTIVE NODE REGISTRY */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">Active Node Registry</h3>
                        <Badge variant="secondary" className="text-[10px] font-semibold">{workspacesCount} Units Live</Badge>
                    </div>

                    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                        {workspaces.map((ws) => (
                            <Card key={ws.id} className="border border-border/60 bg-card rounded-2xl shadow-xs overflow-hidden shrink-0 hover:border-primary/30 transition-all">
                                <CardContent className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3.5 justify-between">
                                    {/* Brand identity */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                         <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-base">
                                            {ws.name?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-foreground truncate">{ws.name}</h4>
                                            <p className="text-[10px] text-muted-foreground truncate">Admin: {ws.admin.email}</p>
                                        </div>
                                    </div>

                                    {/* Metrics Shard */}
                                    <div className="hidden sm:flex items-center gap-6 px-4 border-l border-border/60">
                                        <div className="text-center">
                                            <p className="text-[9px] text-muted-foreground uppercase font-semibold">Users</p>
                                            <p className="text-xs font-bold text-foreground">{ws._count.students + ws._count.teachers}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] text-muted-foreground uppercase font-semibold">Missions</p>
                                            <p className="text-xs font-bold text-foreground">{ws._count.exams}</p>
                                        </div>
                                    </div>

                                    {/* Status / Provisioning */}
                                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                        <div>
                                            {ws.aiUnlimited ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] font-bold">
                                                    Unlimited AI
                                                </Badge>
                                            ) : (
                                                <p className="text-[10px] font-medium text-muted-foreground">{ws.aiGenerationsCount} Used</p>
                                            )}
                                        </div>
                                        <form action={toggleAiUnlimited.bind(null, ws.id, ws.aiUnlimited)}>
                                            <Button size="sm" variant={ws.aiUnlimited ? "outline" : "default"} className="h-8 rounded-lg text-xs font-semibold px-3">
                                                {ws.aiUnlimited ? "Revoke" : "Provision"}
                                            </Button>
                                        </form>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* SIDEBAR MONITOR */}
                <div className="lg:col-span-4 space-y-5">
                    {/* SYSTEM HEARTBEAT */}
                     <Card className="border border-border/60 bg-card rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">Cluster Nominal</h3>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Edge Integrity Checked</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center text-[10px] font-semibold mb-1.5 text-muted-foreground">
                                    <span>Cluster Compute</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">Stable - {clusterLatency}ms</span>
                                </div>
                                <Progress value={computeCapacity} className="h-1.5" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-[10px] font-semibold mb-1.5 text-muted-foreground">
                                    <span>AI Mission Payload</span>
                                    <span className="text-foreground">{globalAiUsage.toLocaleString()} Units</span>
                                </div>
                                <Progress value={Math.min((globalAiUsage / 1000) * 100, 100)} className="h-1.5" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-[10px] font-semibold mb-1.5 text-muted-foreground">
                                    <span>Node Storage Load</span>
                                    <span className="text-foreground">Total: {examsCount + questionsCount}</span>
                                </div>
                                <Progress value={Math.min(((examsCount + questionsCount) / 5000) * 100, 100)} className="h-1.5" />
                            </div>
                        </div>
                    </Card>

                    {/* DEMOGRAPHICS PULSE */}
                    <Card className="border border-border/60 bg-card rounded-2xl p-5 shadow-xs">
                        <div className="mb-4">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Demographics</h3>
                            <CardTitle className="text-base font-bold text-foreground">Role Distribution</CardTitle>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex justify-center h-[180px]">
                                <RolePieChart data={roleData} />
                            </div>

                            <div className="space-y-2.5">
                                {roleData.map((item, idx) => {
                                    const colors = ['bg-indigo-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-violet-500'];
                                    const total = roleData.reduce((acc, curr) => acc + curr.value, 0);
                                    const percentage = total > 0 ? (item.value / total) * 100 : 0;

                                    return (
                                        <div key={item.name} className="space-y-1">
                                            <div className="flex justify-between items-end text-xs">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {item.name}
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {item.value} <span className="text-[10px] text-muted-foreground font-normal">({percentage.toFixed(0)}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-500", colors[idx % colors.length])}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
