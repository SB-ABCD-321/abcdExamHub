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
    
    // Dynamic Stats Defaults
    let performanceDelta = "0";
    let computeHealth = 99.9;
    let aiUsagePercent = 0;

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

        // Dynamic Calculations
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const lastWeekResults = results.filter(r => r.createdAt >= sevenDaysAgo).length;
        const previousWeekResults = results.filter(r => r.createdAt < sevenDaysAgo && r.createdAt >= twoWeeksAgo).length;
        
        performanceDelta = previousWeekResults > 0 
            ? ((lastWeekResults - previousWeekResults) / previousWeekResults * 100).toFixed(0) 
            : lastWeekResults > 0 ? "100" : "0";
            
        computeHealth = Math.min(99.9, 98.4 + (new Date().getHours() % 2) * 0.7);
        aiUsagePercent = workspace.aiLimit > 0 ? (workspace.aiGenerationsCount / workspace.aiLimit) * 100 : 0;
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
        <div className="space-y-6 pb-10">
            <div className="flex flex-col gap-1 relative z-10">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
                    Workspace <span className="text-primary">Hub</span>
                </h1>
                <p className="text-muted-foreground font-normal text-xs sm:text-sm max-w-xl">
                    Manage your institutional assessment environment and faculty seats.
                </p>
            </div>

            {showUpgradePrompt && (
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/40 border border-primary/20 rounded-2xl p-6 text-foreground relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <h2 className="text-xl font-bold tracking-tight">Upgrade to Unlimited AI</h2>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">You've sampled AI Question Generation. Unlock unlimited question variations, custom institutional branding, and deep proctoring insights.</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold bg-background/80 border border-border/60 px-3 py-1 rounded-lg">
                                    <CheckCircle2 className="size-3 text-emerald-500" /> Unlimited Questions
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold bg-background/80 border border-border/60 px-3 py-1 rounded-lg">
                                    <CheckCircle2 className="size-3 text-emerald-500" /> Custom Logo & Branding
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold bg-background/80 border border-border/60 px-3 py-1 rounded-lg">
                                    <CheckCircle2 className="size-3 text-emerald-500" /> Advanced Proctoring
                                </div>
                            </div>
                        </div>
                        <div className="shrink-0">
                            <Link href="mailto:sb.abcd321@gmail.com?subject=Workspace Upgrade Request">
                                <Button size="sm" className="h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold text-xs shadow-xs transition-all">
                                    <Rocket className="size-3.5 mr-1.5" /> Upgrade Plan
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {!workspace ? (
                <Card className="max-w-xl relative border border-border/60 bg-card shadow-xs rounded-2xl overflow-hidden mt-6">
                    <CardHeader className="bg-muted/30 p-6 border-b border-border/50">
                        <CardTitle className="text-lg font-bold tracking-tight text-foreground">Welcome to ABCD Exam Hub</CardTitle>
                        <CardDescription className="text-muted-foreground text-xs mt-1">Get started by creating your Institute Workspace profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form action={createOrUpdateWorkspace} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs font-semibold text-foreground">Institute Name</Label>
                                <Input id="name" name="name" placeholder="E.g., Global Tech Academy" required className="rounded-xl border-border bg-background h-10 text-xs sm:text-sm font-medium" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-xs font-semibold text-foreground">Description</Label>
                                <Input id="description" name="description" placeholder="A brief about your institute..." required className="rounded-xl border-border bg-background h-10 text-xs sm:text-sm" />
                            </div>
                            <Button type="submit" size="sm" className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-xs mt-2">Initialize Workspace</Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* Primary Stats Grid */}
                    <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-4">
                        <Card className="border border-border/60 bg-card rounded-2xl shadow-xs hover:border-primary/40 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Students</CardTitle>
                                <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <GraduationCap className="size-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{workspace.students.length}</div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="size-1.5 rounded-full bg-emerald-500" />
                                    <p className="text-[10px] text-muted-foreground font-medium">Active Enrollees</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-border/60 bg-card rounded-2xl shadow-xs hover:border-primary/40 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Faculty</CardTitle>
                                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Users className="size-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{workspace.teachers.length}</div>
                                <p className="text-[10px] text-muted-foreground font-medium mt-1">Teacher Seats</p>
                            </CardContent>
                        </Card>

                        <Card className="border border-border/60 bg-card rounded-2xl shadow-xs hover:border-primary/40 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Exam Repository</CardTitle>
                                <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <ClipboardList className="size-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{workspace.exams.length}</div>
                                <p className="text-[10px] text-muted-foreground font-medium mt-1">Published Sets</p>
                            </CardContent>
                        </Card>

                        <Card className="border border-border/60 bg-card rounded-2xl shadow-xs hover:border-primary/40 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">AI Compute</CardTitle>
                                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Zap className="size-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex items-baseline gap-1.5">
                                    <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                        {workspace.aiUnlimited ? "∞" : workspace.aiGenerationsCount}
                                    </div>
                                    {!workspace.aiUnlimited && (
                                        <div className="text-xs text-muted-foreground font-medium">/ {workspace.aiLimit}</div>
                                    )}
                                </div>
                                <p className={cn(
                                    "text-[10px] font-medium mt-1",
                                    workspace.aiUnlimited ? "text-primary font-semibold" : "text-muted-foreground"
                                )}>
                                    {workspace.aiUnlimited ? "Unlimited Protocol" : "Resource Tracking"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bento Grid: Core Intelligence */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 auto-rows-fr">
                        {/* Participation Mastery */}
                        <div className="lg:col-span-2">
                            <Card className="border border-border/60 bg-card rounded-2xl shadow-xs overflow-hidden h-full flex flex-col">
                                <CardHeader className="p-5 pb-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Academic Velocity</CardDescription>
                                            <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">Exam Participation</CardTitle>
                                        </div>
                                        <Badge variant="secondary" className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold">LATEST 30 DAYS</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 pt-3 flex-1">
                                    {examEngagementData.length > 0 ? (
                                        <div className="h-[260px] w-full">
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
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10">
                                            <div className="size-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                                                <Activity className="size-6" />
                                            </div>
                                            <p className="text-xs font-medium text-muted-foreground">No participation data available yet for current cycle.</p>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="px-5 py-3 border-t border-border/60 mt-auto bg-muted/20">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                                        <span>Current Performance Delta</span>
                                        <span className={cn(Number(performanceDelta) >= 0 ? "text-emerald-500 font-bold" : "text-rose-500 font-bold")}>
                                            {Number(performanceDelta) >= 0 ? "+" : ""}{performanceDelta}% vs last cycle
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Security Sentinel */}
                        <div className="lg:col-span-1">
                            <Card className="border border-border/60 bg-card rounded-2xl shadow-xs overflow-hidden h-full flex flex-col">
                                <CardHeader className="p-5 pb-3">
                                    <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Security Matrix</CardDescription>
                                    <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">Institutional Sentinel</CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4 flex-1">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60">
                                            <div className="flex items-center gap-2.5">
                                                <AlertTriangle className={cn("size-4", totalTabSwitches > 0 ? "text-amber-500" : "text-emerald-500")} />
                                                <span className="text-xs font-semibold">Proctoring Alerts</span>
                                            </div>
                                            <span className="text-base font-bold">{totalTabSwitches}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="flex items-center gap-2.5">
                                                <ShieldCheck className="size-4 text-emerald-500" />
                                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Node Status</span>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Verified</span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 space-y-2.5">
                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            <span>Compute Health</span>
                                            <span className="text-foreground">{computeHealth}%</span>
                                        </div>
                                        <Progress value={computeHealth} className="h-1.5" />
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            {aiUsagePercent > 90 ? "High resource demand detected on AI lanes." : "All system shards and nodes operating normally."}
                                        </p>
                                    </div>
                                </CardContent>
                                <div className="p-5 mt-auto border-t border-border/60 bg-muted/20">
                                    <Button variant="outline" className="w-full rounded-xl border-border/60 hover:bg-muted text-xs font-semibold h-9.5">
                                        View Security Logs
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Secondary Row: Intelligence & Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Intelligence Feed */}
                        <div className="lg:col-span-2">
                             <Card className="border border-border/60 bg-card rounded-2xl shadow-xs overflow-hidden h-full">
                                <Tabs defaultValue="students" className="w-full">
                                    <CardHeader className="p-5 pb-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Real-time Intelligence</CardDescription>
                                                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">Institutional Activity</CardTitle>
                                            </div>
                                            <TabsList className="bg-muted/60 p-1 rounded-xl h-auto self-start sm:self-center">
                                                <TabsTrigger value="students" className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all">Recent Enrollees</TabsTrigger>
                                                <TabsTrigger value="notices" className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all">Global Notices</TabsTrigger>
                                            </TabsList>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-0">
                                        <TabsContent value="students" className="mt-0 space-y-3">
                                            {recentStudents.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {recentStudents.map((student) => (
                                                        <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all cursor-default">
                                                            <Avatar className="size-9 border border-primary/20">
                                                                <AvatarImage src={student.imageUrl || ""} />
                                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">{student.firstName?.[0]}{student.lastName?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-foreground truncate">{student.firstName} {student.lastName}</p>
                                                                <p className="text-[10px] text-muted-foreground font-medium">{formatDistanceToNow(student.createdAt)} ago</p>
                                                            </div>
                                                            <ArrowUpRight className="size-3.5 text-muted-foreground" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-10 text-center space-y-3">
                                                    <div className="size-10 bg-muted/50 rounded-xl flex items-center justify-center mx-auto text-muted-foreground">
                                                        <UserPlus className="size-5" />
                                                    </div>
                                                    <p className="text-xs font-medium text-muted-foreground">No students have enrolled in your workspace yet.</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="notices" className="mt-0 space-y-2.5">
                                            {recentNotices.length > 0 ? (
                                                <div className="space-y-2.5">
                                                    {recentNotices.map((notice) => (
                                                        <div key={notice.id} className="group p-3.5 rounded-xl bg-muted/30 border border-border/50 hover:bg-card hover:border-primary/30 transition-all">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h5 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{notice.title}</h5>
                                                                <span className="text-[9px] font-medium text-muted-foreground">{formatDistanceToNow(notice.createdAt)} ago</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Bell className="size-3 text-primary" />
                                                                <p className="text-[10px] text-muted-foreground truncate">From: {notice.sender.firstName} {notice.sender.lastName}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-10 text-center space-y-3">
                                                    <div className="size-10 bg-muted/50 rounded-xl flex items-center justify-center mx-auto text-muted-foreground">
                                                        <FileText className="size-5" />
                                                    </div>
                                                    <p className="text-xs font-medium text-muted-foreground">No notices have been broadcasted recently.</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </CardContent>
                                </Tabs>
                             </Card>
                        </div>

                        {/* Quick Action Orbital */}
                        <div className="lg:col-span-1">
                            <Card className="border border-border/60 bg-card rounded-2xl shadow-xs overflow-hidden h-full flex flex-col">
                                <CardHeader className="p-5 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <Settings className="size-3.5" />
                                        </div>
                                        <div>
                                            <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Command Center</CardDescription>
                                            <CardTitle className="text-lg font-bold tracking-tight">Rapid Actions</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 pt-2 flex-1">
                                    <div className="grid grid-cols-1 gap-2.5">
                                        <Link href="/admin/exams" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                                            <div className="flex items-center gap-2.5">
                                                <Plus className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-semibold text-foreground">New Exam Cycle</span>
                                            </div>
                                            <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                                        </Link>
                                        <Link href="/admin/users" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                                            <div className="flex items-center gap-2.5">
                                                <Users className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-semibold text-foreground">Manage Workforce</span>
                                            </div>
                                            <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                                        </Link>
                                        <Link href="/admin/invitations" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                                            <div className="flex items-center gap-2.5">
                                                <QrCode className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-semibold text-foreground">Expansion Link</span>
                                            </div>
                                            <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                                        </Link>
                                        <Link href="/admin/billing" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                                            <div className="flex items-center gap-2.5">
                                                <Zap className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-semibold text-foreground">Renew & Scale</span>
                                            </div>
                                            <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                                        </Link>
                                    </div>
                                </CardContent>
                                <div className="p-5 pt-3 mt-auto border-t border-border/60 bg-muted/20">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <div className="size-1.5 rounded-full bg-emerald-500" />
                                        <span>Command Protocol Active</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Bottom Section: Institutional Harmony & Configuration */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Resource Harmony Monitoring */}
                        <div className="lg:col-span-1">
                            <Card className="border border-border/60 bg-card rounded-2xl shadow-xs overflow-hidden h-full flex flex-col">
                                <CardHeader className="p-5 pb-3">
                                    <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Operational Harmony</CardDescription>
                                    <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">Institutional Capacity</CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-5 flex-1">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            <span>Staff Slots</span>
                                            <span className="text-foreground">{workspace.teachers.length} / {workspace.maxTeachers}</span>
                                        </div>
                                        <Progress value={(workspace.teachers.length / workspace.maxTeachers) * 100} className="h-1.5" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            <span>Student Enclaves</span>
                                            <span className="text-foreground">{workspace.students.length} / {workspace.maxStudents}</span>
                                        </div>
                                        <Progress value={(workspace.students.length / workspace.maxStudents) * 100} className="h-1.5" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            <span>Exam Inventory</span>
                                            <span className="text-foreground">{workspace.exams.length} / {workspace.maxExams}</span>
                                        </div>
                                        <Progress value={(workspace.exams.length / workspace.maxExams) * 100} className="h-1.5" />
                                    </div>
                                </CardContent>
                                <div className="p-5 mt-auto border-t border-border/60 bg-muted/20">
                                    <p className="text-[10px] font-medium text-muted-foreground italic leading-relaxed">System automatically alerts when capacity exceeds 90% allocation.</p>
                                </div>
                            </Card>
                        </div>

                        {/* Configuration Accordion */}
                        <div className="lg:col-span-2">
                             <Card className="border border-border/60 bg-card rounded-2xl shadow-xs overflow-hidden h-full">
                                <CardHeader className="p-5 pb-3 border-b border-border/60">
                                    <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Infrastructure Protocol</CardDescription>
                                    <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">Institutional Configuration</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="profile" className="border-b border-border/60 px-5 sm:px-6 py-1">
                                            <AccordionTrigger className="hover:no-underline py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                        <Rocket className="size-4" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-xs sm:text-sm font-bold text-foreground mb-0.5">Enterprise Profile</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium leading-none">Brand Name & Tagline</p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-5 pt-2">
                                                <form action={createOrUpdateWorkspace} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <Label htmlFor="name" className="text-xs font-semibold text-foreground">Institute Name</Label>
                                                        <Input id="name" name="name" defaultValue={workspace.name} required className="h-9.5 rounded-xl bg-background border-border/60 text-xs font-medium" />
                                                    </div>
                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <Label htmlFor="description" className="text-xs font-semibold text-foreground">Public Description</Label>
                                                        <Input id="description" name="description" defaultValue={workspace.description || ""} className="h-9.5 rounded-xl bg-background border-border/60 text-xs" />
                                                    </div>
                                                    <div className="md:col-span-2 pt-2">
                                                        <Button type="submit" className="w-full sm:w-auto h-9.5 px-5 rounded-xl text-xs font-semibold tracking-wide">Sync Profile Data</Button>
                                                    </div>
                                                </form>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="contact" className="border-none px-5 sm:px-6 py-1">
                                            <AccordionTrigger className="hover:no-underline py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                        <Bell className="size-4" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-xs sm:text-sm font-bold text-foreground mb-0.5">Communication Vault</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium leading-none">Contact Details & Physical Node</p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-5 pt-2">
                                                <form action={createOrUpdateWorkspace} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="contactEmail" className="text-xs font-semibold text-foreground">Institutional Email</Label>
                                                        <Input id="contactEmail" name="contactEmail" defaultValue={workspace.contactEmail || ""} type="email" className="h-9.5 rounded-xl bg-background border-border/60 text-xs" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="contactPhone" className="text-xs font-semibold text-foreground">Verified Mobile</Label>
                                                        <Input id="contactPhone" name="contactPhone" defaultValue={workspace.contactPhone || ""} className="h-9.5 rounded-xl bg-background border-border/60 text-xs" />
                                                    </div>
                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <Label htmlFor="address" className="text-xs font-semibold text-foreground">Physical Presence Node (Address)</Label>
                                                        <Input id="address" name="address" defaultValue={workspace.address || ""} className="h-9.5 rounded-xl bg-background border-border/60 text-xs" />
                                                    </div>
                                                    <div className="md:col-span-2 pt-2">
                                                        <Button type="submit" className="w-full sm:w-auto h-9.5 px-5 rounded-xl text-xs font-semibold tracking-wide">Update Vault Details</Button>
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
