import { db } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, BookCheck, ShieldAlert, CheckCircle2, XCircle, Zap, MoreVertical } from "lucide-react";
import { RolePieChart } from "@/components/analytics/PieChart";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default async function SuperAdminDashboard() {
    const usersCount = await db.user.count();
    const workspacesCount = await db.workspace.count();
    const examsCount = await db.exam.count();
    const questionsCount = await db.question.count();
    const systemAdmins = await db.user.count({ where: { role: "ADMIN" } });

    // Notification Summary
    const pendingInquiriesCount = await db.inquiry.count({ where: { status: "PENDING" } });
    const unreadBookingsCount = await db.callBooking.count({ where: { isRead: false } });

    // Active Monitoring Data
    const activeExamsCount = await db.examDraft.count();
    const activeSessions = await db.examDraft.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
            student: true,
            exam: { include: { workspace: true } }
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

    async function toggleAiUnlimited(workspaceId: string, currentStatus: boolean) {
        'use server'
        await db.workspace.update({
            where: { id: workspaceId },
            data: { aiUnlimited: !currentStatus }
        });
        revalidatePath('/super-admin');
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Super Admin <span className="text-primary">Hub</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Enterprise-level platform oversight and proctoring monitor.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(99,102,241,0.08)] transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Users</CardTitle>
                        <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-900/40 rounded-xl shadow-sm border border-indigo-100/50 dark:border-indigo-800/50">
                            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{usersCount}</div>
                        <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-1 font-bold uppercase tracking-widest">Registered platform-wide</p>
                    </CardContent>
                </Card>

                <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(16,185,129,0.08)] transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enterprise Tenants</CardTitle>
                        <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-900/40 rounded-xl shadow-sm border border-emerald-100/50 dark:border-emerald-800/50">
                            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{workspacesCount}</div>
                        <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-bold uppercase tracking-widest">Active Workspaces</p>
                    </CardContent>
                </Card>

                <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[2rem] overflow-hidden group hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(99,102,241,0.3)] transition-all duration-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Live Mission</CardTitle>
                        <div className="p-2.5 bg-white/20 border border-white/10 rounded-xl shadow-sm animate-pulse">
                            <BookCheck className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-black">{activeExamsCount}</div>
                        <p className="text-[10px] text-indigo-200 mt-1 font-bold uppercase tracking-widest">Currently in progress</p>
                    </CardContent>
                </Card>

                <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(244,63,94,0.08)] transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Exams</CardTitle>
                        <div className="p-2.5 bg-rose-50/80 dark:bg-rose-900/40 rounded-xl shadow-sm border border-rose-100/50 dark:border-rose-800/50">
                            <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{examsCount}</div>
                        <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1 font-bold uppercase tracking-widest">Across all workspaces</p>
                    </CardContent>
                </Card>

                <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(244,63,94,0.08)] transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Questions</CardTitle>
                        <div className="p-2.5 bg-amber-50/80 dark:bg-amber-900/40 rounded-xl shadow-sm border border-amber-100/50 dark:border-amber-800/50">
                            <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{questionsCount}</div>
                        <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1 font-bold uppercase tracking-widest">Global Question Bank</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-amber-500/10 dark:bg-amber-900/20 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:-translate-y-1 transition-all duration-500 border border-amber-200/50 dark:border-amber-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Pending Inquiries</CardTitle>
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                            <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-amber-600 dark:text-amber-400">{pendingInquiriesCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Action Required</p>
                    </CardContent>
                </Card>

                <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-rose-500/10 dark:bg-rose-900/20 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:-translate-y-1 transition-all duration-500 border border-rose-200/50 dark:border-rose-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">New Bookings</CardTitle>
                        <div className="p-2.5 bg-rose-100 dark:bg-rose-900/50 rounded-xl">
                            <BookCheck className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-rose-600 dark:text-rose-400">{unreadBookingsCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Awaiting Deployment</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden mt-12 group">
                <CardHeader className="border-b border-slate-100 dark:border-zinc-800 p-8 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-row items-center justify-between relative z-10">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Tenant Management</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Control and upgrade workspace capabilities.</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 border-none shadow-[0_8px_20px_rgb(99,102,241,0.3)] rounded-xl">
                        {workspacesCount} Units Active
                    </Badge>
                </CardHeader>
                <CardContent className="p-0 relative z-10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-zinc-800/20 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 dark:border-zinc-800">
                                <tr>
                                    <th className="px-8 py-5">Workspace</th>
                                    <th className="px-8 py-5">Administrator</th>
                                    <th className="px-8 py-5 text-center">Metrics</th>
                                    <th className="px-8 py-5 text-center">AI Credits</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {workspaces.map((ws) => (
                                    <tr key={ws.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group/row">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[1rem] bg-indigo-50/80 dark:bg-indigo-900/40 flex items-center justify-center font-black text-indigo-700 dark:text-indigo-400 text-lg group-hover/row:scale-105 group-hover/row:rotate-3 transition-transform shadow-sm border border-indigo-100/50 dark:border-indigo-800/50">
                                                    {ws.name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 transition-colors">{ws.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">ID: {ws.id.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold">{ws.admin.firstName} {ws.admin.lastName}</div>
                                            <div className="text-[10px] text-muted-foreground font-medium">{ws.admin.email}</div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">T</p>
                                                    <p className="text-xs font-black">{ws._count.teachers}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">S</p>
                                                    <p className="text-xs font-black">{ws._count.students}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">E</p>
                                                    <p className="text-xs font-black">{ws._count.exams}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {ws.aiUnlimited ? (
                                                <Badge className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 border-none rounded-lg shadow-inner">
                                                    <Zap className="w-3 h-3 mr-1.5 fill-current" /> UNLIMITED
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-slate-400">
                                                    {ws.aiGenerationsCount} / {(ws as any).aiLimit || 10} Used
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <form action={toggleAiUnlimited.bind(null, ws.id, ws.aiUnlimited)}>
                                                <Button size="sm" variant={ws.aiUnlimited ? "outline" : "default"} className={cn(
                                                    "h-9 rounded-xl font-bold text-xs px-4",
                                                    !ws.aiUnlimited && "bg-indigo-600 hover:bg-zinc-900 shadow-md"
                                                )}>
                                                    {ws.aiUnlimited ? "Revoke Premium" : "Provision Premium"}
                                                </Button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-8 pt-4">
                <Card className="lg:col-span-2 relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
                    <CardHeader className="border-b border-slate-100 dark:border-zinc-800 p-8 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-row items-center justify-between relative z-10">
                        <div>
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Live Sessions Monitor</CardTitle>
                            <p className="text-xs text-muted-foreground font-medium mt-1">Real-time proctoring data feeds.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-rose-50/80 dark:bg-rose-900/40 px-4 py-2 rounded-xl border border-rose-100/50 dark:border-rose-800/50 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Active Link</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 relative z-10">
                        {activeSessions.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Silence on the wire.</p>
                                    <p className="text-xs text-muted-foreground mt-2 font-medium italic">No students are currently taking assessments.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 dark:bg-zinc-800/20 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 dark:border-zinc-800">
                                        <tr>
                                            <th className="px-8 py-5">Student</th>
                                            <th className="px-8 py-5">Assessment</th>
                                            <th className="px-8 py-5 text-center">Tab Security</th>
                                            <th className="px-8 py-5 text-right">Heartbeat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                        {activeSessions.map((session: any) => (
                                            <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group/row">
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-[0.8rem] bg-indigo-600 flex items-center justify-center font-black text-white text-[10px] shadow-sm group-hover/row:scale-105 group-hover/row:-rotate-3 transition-transform">
                                                            {session.student.firstName?.[0]}{session.student.lastName?.[0]}
                                                        </div>
                                                        <div className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">{session.student.firstName} {session.student.lastName}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{session.exam.title}</div>
                                                    <div className="text-[9px] font-black text-indigo-600/80 dark:text-indigo-400/80 uppercase tracking-widest mt-0.5">{session.exam.workspace.name}</div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className={cn(
                                                        "text-[10px] font-black mx-auto px-4 py-1.5 rounded-xl w-fit uppercase tracking-widest border",
                                                        session.tabSwitches > 3 ? "bg-rose-50/80 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border-rose-100/50 dark:border-rose-800/50 animate-pulse shadow-sm shadow-rose-500/10" : "bg-emerald-50/80 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-800/50 shadow-sm"
                                                    )}>
                                                        {session.tabSwitches > 0 ? `${session.tabSwitches} Switches` : "Secure"}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                    {new Date(session.updatedAt).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-none shadow-[0_20px_50px_rgb(0,0,0,0.3)] bg-zinc-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-[1rem] shadow-inner backdrop-blur-md">
                                    <CheckCircle2 className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-100">Systems Nominal</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium mb-8 italic">"Enterprise infrastructure is operating at peak performance. No degradation in latency or connectivity detected across global edge nodes."</p>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-2.5 text-slate-400">
                                        <span>DB Uplink</span>
                                        <span className="text-emerald-400">Active - {usersCount + workspacesCount + examsCount} Entities</span>
                                    </div>
                                    <Progress value={99.9} className="h-1.5 bg-white/5 [&>div]:bg-emerald-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-2.5 text-slate-400">
                                        <span>Compute Cluster</span>
                                        <span className={cn(
                                            activeExamsCount > 0 ? "text-amber-400" : "text-emerald-400"
                                        )}>
                                            {activeExamsCount > 0 ? `${Math.min(100, 40 + (activeExamsCount * 15))}% Load` : 'Idle State'}
                                        </span>
                                    </div>
                                    <Progress value={activeExamsCount > 0 ? Math.min(100, 40 + (activeExamsCount * 15)) : 5} className="h-1.5 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-amber-500" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-8 -right-8 p-8 opacity-[0.02] mix-blend-overlay group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none text-white">
                            <Building2 className="w-48 h-48" />
                        </div>
                    </Card>

                    <div className="lg:col-span-1 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden p-6 group relative flex flex-col h-fit">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <div className="relative z-10 mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Intelligence Report</h3>
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Demographics</CardTitle>
                        </div>

                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex justify-center h-[260px]">
                                <RolePieChart data={roleData} />
                            </div>

                            <div className="space-y-3 pb-2">
                                {roleData.map((item, idx) => {
                                    const colors = ['bg-indigo-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-violet-500'];
                                    const total = roleData.reduce((acc, curr) => acc + curr.value, 0);
                                    const percentage = (item.value / total) * 100;

                                    return (
                                        <div key={item.name} className="space-y-1.5 group/role">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover/role:text-slate-900 dark:group-hover/role:text-white transition-colors">
                                                    {item.name}
                                                </span>
                                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                                    {item.value} <span className="text-[9px] text-slate-400 font-medium ml-1">({percentage.toFixed(0)}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
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
                    </div>
                </div>
            </div>
        </div>
    )
}
