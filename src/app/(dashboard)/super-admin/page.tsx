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

    async function toggleAiUnlimited(workspaceId: string, currentStatus: boolean) {
        'use server'
        await db.workspace.update({
            where: { id: workspaceId },
            data: { aiUnlimited: !currentStatus }
        });
        revalidatePath('/super-admin');
    }

    return (
        <div className="space-y-10 pb-12 max-w-7xl mx-auto">
            {/* POWER HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 relative z-10 pb-2 border-b border-slate-100 dark:border-zinc-800/50">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                        Strategic <span className="text-primary">Command</span>
                    </h1>
                    <p className="text-muted-foreground font-bold text-sm md:text-lg max-w-xl italic">
                        Real-time institutional oversight and global proctoring monitor. Pulse frequency: 100% Nominal.
                    </p>
                </div>
                <div className="hidden lg:flex items-center gap-4 bg-slate-100 dark:bg-zinc-800 p-6 rounded-[2.5rem] shadow-xl border border-slate-200/50 dark:border-zinc-700/30 relative overflow-hidden group">
                     <div className="relative z-10 flex items-center gap-6">
                        <div className="text-right">
                             <p className="text-[10px] font-bold text-indigo-400 tracking-tight mb-1">Global Shard Count</p>
                             <p className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">{workspacesCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform">
                             <Building2 className="w-6 h-6 text-white" />
                        </div>
                     </div>
                </div>
            </div>

            {/* PULSE METRICS GRID */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Active Nodes", val: workspacesCount, desc: "SaaS Multi-tenants", icon: Building2, color: "indigo" },
                    { label: "Growth Velocity", val: lastWeekWorkspaces, desc: "New nodes last 7d", icon: TrendingUp, color: "emerald", trend: true },
                    { label: "Waitlist Pulse", val: pendingRequisitionsCount, desc: "Pending requisitions", icon: Inbox, color: "amber" },
                    { label: "Active Missions", val: activeExamsCount, desc: "Live proctoring feeds", icon: BookCheck, color: "rose", animate: true },
                ].map((metric, i) => (
                    <Card key={i} className="relative border border-slate-200/60 dark:border-zinc-800/60 shadow-sm bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                        <CardHeader className="pb-2">
                             <div className="flex items-center justify-between">
                                <CardTitle className="text-[11px] font-bold tracking-tight text-slate-400">{metric.label}</CardTitle>
                                <div className={cn(
                                    "p-2.5 rounded-xl border transition-colors",
                                    metric.color === 'indigo' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-100" :
                                    metric.color === 'emerald' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border-emerald-100" :
                                    metric.color === 'rose' ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 border-rose-100" :
                                    "bg-amber-50 dark:bg-amber-900/30 text-amber-600 border-amber-100"
                                )}>
                                    <metric.icon className={cn("h-4 w-4", metric.animate && "animate-pulse")} />
                                </div>
                             </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black tabular-nums mb-1">{metric.val.toLocaleString()}</div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{metric.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* STRATEGIC GROWTH PIPELINE */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                        <div className="space-y-2">
                             <div className="flex items-center justify-center md:justify-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
                                    <Inbox className="w-5 h-5" />
                                </div>
                                <p className="text-[10px] font-black text-amber-500 tracking-tight font-sans">Expansion Waitlist</p>
                             </div>
                             <h2 className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tight font-sans">
                                {pendingRequisitionsCount} <span className="text-xl text-slate-500">Nodes Pending</span>
                             </h2>
                             <p className="text-xs font-bold text-slate-400 italic max-w-sm">Strategic institutional requests awaiting administrative authorization for hub deployment.</p>
                        </div>
                        <Link href="/super-admin/requests">
                            <Button className="h-16 px-10 rounded-2xl bg-white hover:bg-white/90 text-slate-950 font-black text-xs uppercase tracking-widest shadow-[0_15px_40px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95 group">
                                Authorize Requisitions
                                <TrendingUp className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="bg-indigo-600 border border-indigo-500 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group flex flex-col justify-center">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    <div className="relative z-10 text-center">
                         <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-white/10">
                            <Activity className="w-6 h-6 animate-pulse" />
                         </div>
                         <h4 className="text-[10px] font-bold text-indigo-100/60 tracking-tight mb-1">Compute Capacity</h4>
                         <p className="text-3xl font-black text-white leading-none mb-1">92.4%</p>
                         <p className="text-[10px] font-medium text-indigo-100/40 tracking-tight leading-none">Global Cluster Load</p>
                    </div>
                </div>
            </div>

            {/* ALERT CENTER */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-amber-500/10 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-8 rounded-[2.5rem] flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-lg">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap size={80} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-tight mb-2 italic">Institutional Requisitions</p>
                        <h2 className="text-5xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{pendingInquiriesCount} <span className="text-xl">Inquiries</span></h2>
                    </div>
                    <Link href="/super-admin/requests">
                        <Button className="rounded-full bg-amber-600 hover:bg-black text-white px-8 h-12 font-black text-xs tracking-tight shadow-xl relative z-10 transition-all">Audit Now</Button>
                    </Link>
                </div>

                <div className="bg-rose-500/10 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-8 rounded-[2.5rem] flex items-center justify-between group overflow-hidden relative transition-all hover:shadow-lg">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <BookCheck size={80} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 tracking-tight mb-2 italic">Unread Bookings</p>
                        <h2 className="text-5xl font-black text-rose-600 dark:text-rose-400 tabular-nums">{unreadBookingsCount} <span className="text-xl">Deployments</span></h2>
                    </div>
                    <Button className="rounded-full bg-rose-600 hover:bg-black text-white px-8 h-12 font-black text-xs tracking-tight shadow-xl relative z-10 transition-all">View Call Hub</Button>
                </div>
            </div>

            {/* GLOBAL INTELLIGENCE FEED */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Global Intelligence Feed</h2>
                            <p className="text-[10px] font-bold tracking-tight text-slate-400 italic">Real-time mission tracking across active nodes</p>
                        </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 px-6 py-1.5 rounded-full font-bold text-[10px] tracking-tight border-emerald-500/20 shadow-sm animate-pulse">Live Pulse Active</Badge>
                </div>

                <Card className="border border-slate-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-3xl rounded-[3rem] overflow-hidden p-2 shadow-2xl">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {globalActivities.map((activity) => (
                            <div key={activity.id} className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <div className="flex items-start justify-between mb-4">
                                    <Avatar className="w-10 h-10 rounded-xl border-2 border-slate-50 dark:border-zinc-800 shadow-xl">
                                        <AvatarImage src={activity.student?.imageUrl || ""} />
                                        <AvatarFallback className="bg-indigo-600 text-white font-black text-[10px] uppercase">{activity.student?.firstName?.[0] || "S"}</AvatarFallback>
                                    </Avatar>
                                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest py-1 border-none bg-slate-100 dark:bg-zinc-800/50">
                                        {activity.tabSwitches > 0 ? (
                                            <span className="text-rose-500 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> {activity.tabSwitches} Flags</span>
                                        ) : (
                                            <span className="text-emerald-500">Nominal</span>
                                        )}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                     <p className="text-[10px] font-bold text-primary tracking-tight truncate">{activity.exam.workspace.name}</p>
                                     <h4 className="text-sm font-black tracking-tight leading-tight line-clamp-2 min-h-[2.5rem]">{activity.exam.title}</h4>
                                     <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/50">
                                        <span className="text-[9px] font-bold text-slate-400 italic">Student: {activity.student?.firstName || "Guest"}</span>
                                        <Activity className="w-3 h-3 text-indigo-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* ACTIVE NODE REGISTRY */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between pl-4 pr-4">
                        <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">Active Node Registry</h3>
                        <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-500 font-bold px-4 py-1 rounded-full text-[10px] tracking-tight border-none">{workspacesCount} Units Live</Badge>
                    </div>

                    <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {workspaces.map((ws) => (
                            <Card key={ws.id} className="relative border border-slate-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:shadow-lg transition-all duration-500 shrink-0">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                <CardContent className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-6">
                                    {/* Brand identity */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                         <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center font-black text-indigo-700 dark:text-indigo-400 text-xl border border-indigo-100/50 dark:border-indigo-800/50 group-hover:rotate-3 transition-transform">
                                            {ws.name?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-base font-black tracking-tight truncate">{ws.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-tight truncate italic">Admin: {ws.admin.email}</p>
                                        </div>
                                    </div>

                                    {/* Metrics Shard */}
                                    <div className="hidden lg:flex items-center gap-8 px-8 border-l border-slate-100 dark:border-zinc-800">
                                        <div className="text-center">
                                            <p className="text-[8px] font-bold text-slate-400 tracking-tight leading-none mb-1">Users</p>
                                            <p className="text-xs font-black">{ws._count.students + ws._count.teachers}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] font-bold text-slate-400 tracking-tight leading-none mb-1">Missions</p>
                                            <p className="text-xs font-black">{ws._count.exams}</p>
                                        </div>
                                    </div>

                                    {/* Status / Provisioning */}
                                    <div className="flex items-center justify-between md:justify-end gap-6 md:w-[240px] shrink-0">
                                        <div className="text-right">
                                            {ws.aiUnlimited ? (
                                                <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black text-[9px] tracking-tight border-none px-3 py-1 rounded-lg">
                                                    Unlimited AI
                                                </Badge>
                                            ) : (
                                                <p className="text-[10px] font-bold tracking-tight text-slate-400">{ws.aiGenerationsCount} Units Used</p>
                                            )}
                                        </div>
                                        <form action={toggleAiUnlimited.bind(null, ws.id, ws.aiUnlimited)}>
                                            <Button size="sm" variant={ws.aiUnlimited ? "outline" : "default"} className={cn(
                                                "h-10 rounded-xl font-black text-[10px] tracking-tight px-6",
                                                !ws.aiUnlimited && "bg-indigo-600 hover:bg-slate-950 shadow-xl text-white dark:text-white"
                                            )}>
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
                <div className="lg:col-span-4 space-y-8">
                    {/* SYSTEM HEARTBEAT */}
                     <Card className="border-none shadow-[0_30px_70px_rgb(0,0,0,0.4)] bg-slate-950 text-white rounded-[2.5rem] p-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl shadow-inner backdrop-blur-md relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-500 opacity-20 animate-pulse" />
                                    <CheckCircle2 className="w-6 h-6 text-emerald-400 relative z-10" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-100 font-sans">Nominal</h3>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 leading-none mt-0.5">Edge Integrity Checked</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center text-[10px] font-bold tracking-tight mb-2.5 text-slate-500">
                                        <span>Cluster Compute</span>
                                        <span className="text-emerald-400">Stable - 24ms</span>
                                    </div>
                                    <Progress value={99} className="h-1 bg-white/5 [&>div]:bg-emerald-500 shadow-sm" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-2.5 text-slate-500">
                                        <span>AI Mission Payload</span>
                                        <span className="text-indigo-400">{globalAiUsage.toLocaleString()} Units</span>
                                    </div>
                                    <Progress value={Math.min((globalAiUsage / 1000) * 100, 100)} className="h-1 bg-white/5 [&>div]:bg-indigo-500 shadow-sm" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-2.5 text-slate-500">
                                        <span>Node Storage Load</span>
                                        <span className="text-amber-400">Total: {examsCount + questionsCount}</span>
                                    </div>
                                    <Progress value={Math.min(((examsCount + questionsCount) / 5000) * 100, 100)} className="h-1 bg-white/5 [&>div]:bg-amber-500 shadow-sm" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* DEMOGRAPHICS PULSE */}
                    <Card className="border border-slate-200/60 dark:border-zinc-800/60 shadow-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 relative overflow-hidden group flex flex-col h-fit">
                        <div className="mb-6">
                            <h3 className="text-[10px] font-bold text-slate-400 mb-1 tracking-tight">Intelligence Pulser</h3>
                            <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Demographics</CardTitle>
                        </div>

                        <div className="flex flex-col gap-8">
                            <div className="flex justify-center h-[240px]">
                                <RolePieChart data={roleData} />
                            </div>

                            <div className="space-y-4">
                                {roleData.map((item, idx) => {
                                    const colors = ['bg-indigo-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-violet-500'];
                                    const total = roleData.reduce((acc, curr) => acc + curr.value, 0);
                                    const percentage = (item.value / total) * 100;

                                    return (
                                        <div key={item.name} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[9px] font-bold tracking-tight text-slate-400 italic">
                                                    {item.name} Identity
                                                </span>
                                                <span className="text-xs font-black">
                                                    {item.value} <span className="text-[9px] text-slate-400 font-bold ml-1">({percentage.toFixed(0)}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-1000", colors[idx % colors.length])}
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
