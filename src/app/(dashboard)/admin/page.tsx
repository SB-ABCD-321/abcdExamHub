import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { QrCode, Users, GraduationCap, ClipboardList, Zap, Rocket, CheckCircle2, ShieldAlert, Activity, Bell, Settings, ArrowUpRight, Plus, UserPlus, FileText, AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react";
import { EntityBarChart } from "@/components/analytics/BarChart";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatDistanceToNow } from "date-fns";

export default async function AdminDashboard() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h2>
                <p className="text-muted-foreground mt-2 max-w-md font-medium italic">You do not have Admin privileges. Please contact the Super Admin to purchase a workspace subscription and upgrade your account.</p>
            </div>
        )
    }

    let workspace = await db.workspace.findUnique({
        where: { adminId: dbUser.id },
        include: {
            teachers: true,
            students: true,
            exams: true,
        }
    });

    let examEngagementData: any[] = [];
    let recentStudents: any[] = [];
    let recentNotices: any[] = [];
    let totalTabSwitches = 0;

    if (workspace) {
        // Exam Engagement (Results over time - Bar Chart Data)
        const results = await db.examResult.findMany({
            where: { exam: { workspaceId: workspace.id } },
            orderBy: { createdAt: 'asc' }
        });

        if (results.length > 0) {
            const engagementMap = new Map<string, number>();
            results.forEach(r => {
                const dateStr = r.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                engagementMap.set(dateStr, (engagementMap.get(dateStr) || 0) + 1);
            });
            examEngagementData = Array.from(engagementMap.entries()).map(([date, count]) => ({ date, count }));
        }

        recentStudents = await db.user.findMany({
            where: { studentWorkspaces: { some: { id: workspace.id } } },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        recentNotices = await db.notice.findMany({
            where: { 
                OR: [
                    { targetWorkspaceId: workspace.id },
                    { targetType: 'WORKSPACE_ADMINS', targetWorkspaceId: workspace.id },
                    { targetType: 'WORKSPACE_TEACHERS', targetWorkspaceId: workspace.id },
                ]
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { sender: true }
        });

        const draftsWithSwitches = await db.examDraft.aggregate({
            where: { exam: { workspaceId: workspace.id } },
            _sum: { tabSwitches: true }
        });
        totalTabSwitches = draftsWithSwitches._sum.tabSwitches || 0;
    }

    async function createOrUpdateWorkspace(formData: FormData) {
        "use server";
        if (!dbUser) return;

        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const contactEmail = formData.get("contactEmail") as string;
        const contactPhone = formData.get("contactPhone") as string;
        const address = formData.get("address") as string;

        const existing = await db.workspace.findUnique({ where: { adminId: dbUser.id } });

        const siteSettings = await db.siteSetting.findFirst();

        if (existing) {
            await db.workspace.update({
                where: { id: existing.id },
                data: { name, description, contactEmail, contactPhone, address }
            });
        } else {
            await db.workspace.create({
                data: {
                    name, description, contactEmail, contactPhone, address,
                    adminId: dbUser.id,
                    maxStudents: siteSettings?.trialMaxStudents ?? 50,
                    maxTeachers: siteSettings?.trialMaxTeachers ?? 1,
                    maxExams: siteSettings?.trialMaxExams ?? 5,
                    aiLimit: siteSettings?.trialAiLimit ?? 10,
                    trialExpiresAt: siteSettings?.trialDays ? new Date(Date.now() + siteSettings.trialDays * 24 * 60 * 60 * 1000) : null
                }
            })
        }
        revalidatePath("/admin");
    }

    const showUpgradePrompt = workspace && !workspace.aiUnlimited && workspace.aiGenerationsCount >= 1;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Workspace <span className="text-primary">Hub</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Manage your enterprise training environment.
                </p>
            </div>

            {showUpgradePrompt && (
                <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 rounded-[2.5rem] p-10 text-white shadow-[0_20px_50px_rgb(99,102,241,0.3)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                    <Zap className="absolute -bottom-6 -right-6 w-56 h-56 text-white/5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight">Upgrade to Unlimited AI</h2>
                            <p className="text-sm text-indigo-100 font-medium italic max-w-xl leading-relaxed">You've sampled the power of AI Question Generation. Unlock unlimited creation, custom branding, and deep proctoring insights by upgrading to Enterprise Premium.</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Questions
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Custom Logo & Themes
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Advanced Proctoring
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <Link href="mailto:sb.abcd321@gmail.com?subject=Workspace Upgrade Request">
                                <Button className="h-14 px-8 bg-white text-indigo-700 hover:bg-zinc-900 hover:text-white rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300">
                                    <Rocket className="w-5 h-5 mr-3" /> Upgrade Now
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {!workspace ? (
                <Card className="max-w-2xl relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden mt-12 group">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="bg-slate-50/50 dark:bg-zinc-800/30 p-8 border-b border-slate-100 dark:border-zinc-800 relative z-10">
                        <CardTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Welcome to ABCD Exam Hub!</CardTitle>
                        <CardDescription className="text-muted-foreground mt-1 font-medium italic">Get started by creating your Institute Workspace profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 relative z-10">
                        <form action={createOrUpdateWorkspace} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institute Name</Label>
                                <Input id="name" name="name" placeholder="E.g., Global Tech Academy" required className="rounded-[1rem] border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 h-14 font-bold focus-visible:ring-indigo-500" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                                <Input id="description" name="description" placeholder="A brief about your institute..." required className="rounded-[1rem] border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 h-14 focus-visible:ring-indigo-500" />
                            </div>
                            <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1rem] font-black uppercase tracking-widest shadow-[0_8px_20px_rgb(99,102,241,0.3)] hover:shadow-[0_12px_25px_rgb(99,102,241,0.4)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 mt-4">Initialize Workspace</Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-12">
                    {/* Primary Stats Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="relative border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Student Body</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{workspace.students.length}</div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Enrollees</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="relative border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Command Staff</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                                    <Users className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{workspace.teachers.length}</div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Faculty Seats</p>
                            </CardContent>
                        </Card>

                        <Card className="relative border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Exam Repository</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
                                    <ClipboardList className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{workspace.exams.length}</div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Published Sets</p>
                            </CardContent>
                        </Card>

                        <Card className={cn(
                            "relative border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-500",
                            workspace.aiUnlimited ? "bg-slate-950 text-white" : "bg-white dark:bg-zinc-900"
                        )}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest",
                                    workspace.aiUnlimited ? "text-slate-400" : "text-slate-400"
                                )}>AI Compute</CardTitle>
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    workspace.aiUnlimited ? "bg-primary/10 text-primary" : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600"
                                )}>
                                    <Zap className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-4xl font-bold tracking-tight">
                                        {workspace.aiUnlimited ? "∞" : workspace.aiGenerationsCount}
                                    </div>
                                    {!workspace.aiUnlimited && (
                                        <div className="text-base text-slate-400 font-medium">/ {workspace.aiLimit}</div>
                                    )}
                                </div>
                                <p className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest mt-1",
                                    workspace.aiUnlimited ? "text-primary" : "text-slate-500"
                                )}>
                                    {workspace.aiUnlimited ? "Unlimited Protocol" : "Resource Tracking"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bento Grid: Core Intelligence */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr">
                        {/* Participation Mastery */}
                        <div className="lg:col-span-2">
                            <Card className="relative border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden h-full flex flex-col">
                                <CardHeader className="p-8 pb-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardDescription className="text-primary font-bold uppercase tracking-[0.2em] text-[10px]">Academic Velocity</CardDescription>
                                            <CardTitle className="text-2xl font-bold tracking-tight">Exam Participation</CardTitle>
                                        </div>
                                        <Badge variant="secondary" className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-zinc-800 text-[10px] font-bold">LATEST 30 DAYS</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 pt-4 flex-1">
                                    {examEngagementData.length > 0 ? (
                                        <div className="h-[300px] w-full">
                                            <EntityBarChart
                                                data={examEngagementData}
                                                title=""
                                                description=""
                                                dataKey="count"
                                                nameKey="date"
                                                color="#6366f1"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-300">
                                                <Activity className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-400">No participation data available yet para current cycle.</p>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="px-8 pb-8 pt-4 border-t border-slate-50 dark:border-zinc-800/50 mt-auto">
                                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                        <span>Current Performance Delta</span>
                                        <span className="text-emerald-500">+12% vs last cycle</span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Security Sentinel */}
                        <div className="lg:col-span-1">
                            <Card className="relative border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] bg-slate-950 text-white rounded-3xl overflow-hidden h-full flex flex-col">
                                <div className="absolute top-0 right-0 p-8 pointer-events-none">
                                    <ShieldAlert className="w-24 h-24 text-white/5" />
                                </div>
                                <CardHeader className="p-8 pb-4">
                                    <CardDescription className="text-primary font-bold uppercase tracking-[0.2em] text-[10px]">Security Matrix</CardDescription>
                                    <CardTitle className="text-2xl font-bold tracking-tight">Institutional Sentinel</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8 flex-1">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle className={cn("w-5 h-5", totalTabSwitches > 0 ? "text-amber-500" : "text-emerald-500")} />
                                                <span className="text-xs font-bold uppercase tracking-tight">Proctoring Alerts</span>
                                            </div>
                                            <span className="text-lg font-black">{totalTabSwitches}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="flex items-center gap-3">
                                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                                <span className="text-xs font-bold uppercase tracking-tight text-emerald-400">Node Status</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Verified</span>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-300/60">
                                            <span>Compute Health</span>
                                            <span>99.9%</span>
                                        </div>
                                        <Progress value={99.9} className="h-1.5 bg-white/10 [&>div]:bg-indigo-400" />
                                        <p className="text-[9px] font-medium text-slate-400 leading-relaxed italic">All system shards and shifter nodes are operating within optimal latency parameters.</p>
                                    </div>
                                </CardContent>
                                <div className="p-8 mt-auto border-t border-white/5">
                                    <Button variant="outline" className="w-full rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest h-12">View Security Logs</Button>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Secondary Row: Intelligence & Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Intelligence Feed */}
                        <div className="lg:col-span-2">
                             <Card className="relative border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden h-full">
                                <Tabs defaultValue="students" className="w-full">
                                    <CardHeader className="p-8 pb-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div>
                                                <CardDescription className="text-primary font-bold uppercase tracking-[0.2em] text-[10px]">Real-time Intelligence</CardDescription>
                                                <CardTitle className="text-2xl font-bold tracking-tight">Institutional Activity</CardTitle>
                                            </div>
                                            <TabsList className="bg-slate-50 dark:bg-zinc-800 p-1 rounded-xl h-auto self-start md:self-center">
                                                <TabsTrigger value="students" className="px-5 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm text-[10px] font-bold uppercase tracking-widest transition-all">Recent Enrollees</TabsTrigger>
                                                <TabsTrigger value="notices" className="px-5 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm text-[10px] font-bold uppercase tracking-widest transition-all">Global Notices</TabsTrigger>
                                            </TabsList>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0">
                                        <TabsContent value="students" className="mt-0 space-y-4">
                                            {recentStudents.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {recentStudents.map((student) => (
                                                        <div key={student.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800/50 hover:border-primary/20 transition-all cursor-default">
                                                            <Avatar className="h-10 w-10 border border-primary/20">
                                                                <AvatarImage src={student.imageUrl || ""} />
                                                                <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs uppercase tracking-tight">{student.firstName?.[0]}{student.lastName?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{student.firstName} {student.lastName}</p>
                                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{formatDistanceToNow(student.createdAt)} ago</p>
                                                            </div>
                                                            <ArrowUpRight className="w-3 h-3 text-slate-300" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center space-y-4">
                                                    <div className="w-12 h-12 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                                                        <UserPlus className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-400">No students have enrolled in your workspace yet.</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="notices" className="mt-0 space-y-3">
                                            {recentNotices.length > 0 ? (
                                                <div className="space-y-3">
                                                    {recentNotices.map((notice) => (
                                                        <div key={notice.id} className="group p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800/50 hover:bg-white dark:hover:bg-zinc-900 transition-all">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{notice.title}</h5>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDistanceToNow(notice.createdAt)} ago</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Bell className="w-2.5 h-2.5 text-primary" />
                                                                <p className="text-[10px] font-medium text-slate-500 italic truncate max-w-[400px]">From: {notice.sender.firstName} {notice.sender.lastName}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center space-y-4">
                                                    <div className="w-12 h-12 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-400">No notices have been broadcasted recently.</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </CardContent>
                                </Tabs>
                             </Card>
                        </div>

                        {/* Quick Action Orbital */}
                        <div className="lg:col-span-1">
                            <Card className="relative border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden h-full flex flex-col">
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <Settings className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <CardDescription className="text-primary font-bold uppercase tracking-[0.2em] text-[10px]">Command Center</CardDescription>
                                            <CardTitle className="text-xl font-bold tracking-tight">Rapid Actions</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 pt-4 flex-1">
                                    <div className="grid grid-cols-1 gap-3">
                                        <Link href="/admin/exams" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800/50 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Plus className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">New Exam Cycle</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                        </Link>
                                        <Link href="/admin/users" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800/50 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Users className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Manage Workforce</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                        </Link>
                                        <Link href="/admin/invitations" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800/50 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <QrCode className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Expansion Link</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                        </Link>
                                        <Link href="/admin/billing" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800/50 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Zap className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Renew & Scale</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                        </Link>
                                    </div>
                                </CardContent>
                                <div className="p-8 pt-4 mt-auto">
                                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400/60 pb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span>Command Protocol Active</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Bottom Section: Institutional Harmony & Configuration */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Resource Harmony Monitoring */}
                        <div className="lg:col-span-1">
                            <Card className="relative border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden h-full flex flex-col">
                                <CardHeader className="p-8 pb-4">
                                    <CardDescription className="text-primary font-bold uppercase tracking-[0.2em] text-[10px]">Operational Harmony</CardDescription>
                                    <CardTitle className="text-2xl font-bold tracking-tight">Institutional Capacity</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8 flex-1">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            <span>Staff Slots</span>
                                            <span>{workspace.teachers.length} / {workspace.maxTeachers}</span>
                                        </div>
                                        <Progress value={(workspace.teachers.length / workspace.maxTeachers) * 100} className="h-2 bg-emerald-50 dark:bg-emerald-950 [&>div]:bg-emerald-500" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            <span>Student Enclaves</span>
                                            <span>{workspace.students.length} / {workspace.maxStudents}</span>
                                        </div>
                                        <Progress value={(workspace.students.length / workspace.maxStudents) * 100} className="h-2 bg-indigo-50 dark:bg-indigo-950 [&>div]:bg-indigo-500" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            <span>Exam Inventory</span>
                                            <span>{workspace.exams.length} / {workspace.maxExams}</span>
                                        </div>
                                        <Progress value={(workspace.exams.length / workspace.maxExams) * 100} className="h-2 bg-amber-50 dark:bg-amber-950 [&>div]:bg-amber-500" />
                                    </div>
                                </CardContent>
                                <div className="p-8 mt-auto border-t border-slate-50 dark:border-zinc-800/50">
                                    <p className="text-[10px] font-medium text-slate-400 italic leading-relaxed">System automatically flags when capacity thresholds exceed 90% optimization.</p>
                                </div>
                            </Card>
                        </div>

                        {/* Configuration Accordion */}
                        <div className="lg:col-span-2">
                             <Card className="relative border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden h-full">
                                <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-zinc-800/50">
                                    <CardDescription className="text-primary font-bold uppercase tracking-[0.2em] text-[10px]">Infrastructure Protocol</CardDescription>
                                    <CardTitle className="text-2xl font-bold tracking-tight">Institutional Configuration</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="profile" className="border-b border-slate-50 dark:border-zinc-800/50 px-8 py-2">
                                            <AccordionTrigger className="hover:no-underline py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                                                        <Rocket className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Enterprise Profile</p>
                                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none">Brand Name & Tagline</p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-8 pt-4">
                                                <form action={createOrUpdateWorkspace} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Institute Name</Label>
                                                        <Input id="name" name="name" defaultValue={workspace.name} required className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border-none font-bold" />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Public Description</Label>
                                                        <Input id="description" name="description" defaultValue={workspace.description || ""} className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border-none" />
                                                    </div>
                                                    <div className="md:col-span-2 pt-4">
                                                        <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm tracking-wide">Sync Profile Data</Button>
                                                    </div>
                                                </form>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="contact" className="border-none px-8 py-2">
                                            <AccordionTrigger className="hover:no-underline py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                                                        <Bell className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Communication Vault</p>
                                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none">Contact Details & Physical Node</p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-8 pt-4">
                                                <form action={createOrUpdateWorkspace} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="contactEmail" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Institutional Email</Label>
                                                        <Input id="contactEmail" name="contactEmail" defaultValue={workspace.contactEmail || ""} type="email" className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border-none" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="contactPhone" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Verified Mobile</Label>
                                                        <Input id="contactPhone" name="contactPhone" defaultValue={workspace.contactPhone || ""} className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border-none" />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor="address" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Physical Presence Node (Address)</Label>
                                                        <Input id="address" name="address" defaultValue={workspace.address || ""} className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border-none" />
                                                    </div>
                                                    <div className="md:col-span-2 pt-4">
                                                        <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm tracking-wide">Update Vault Details</Button>
                                                    </div>
                                                </form>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </CardContent>
                             </Card>
                        </div>
                    </div>
                </div>

            )}
        </div>
    )
}
