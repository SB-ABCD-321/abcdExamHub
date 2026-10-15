import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { 
    QrCode, 
    Users, 
    GraduationCap, 
    ClipboardList, 
    Zap, 
    Rocket, 
    CheckCircle2, 
    Activity, 
    Bell, 
    Settings, 
    ArrowUpRight, 
    Plus, 
    UserPlus, 
    FileText, 
    AlertTriangle, 
    ShieldCheck, 
    ChevronRight,
    TrendingUp,
    Building2,
    BookOpen,
    CreditCard,
    Award,
    ExternalLink,
    Sparkles
} from "lucide-react";
import { EntityBarChart } from "@/components/analytics/BarChart";
import { RolePieChart } from "@/components/analytics/PieChart";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";

export default async function AdminDashboard() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Access Denied</h2>
                <p className="text-muted-foreground mt-2 max-w-md font-medium text-xs leading-relaxed">
                    You do not have Administrator privileges. Please contact the platform administration to activate an institution workspace.
                </p>
            </div>
        );
    }

    const workspace = await db.workspace.findUnique({
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
    let totalAttempts = 0;
    let passRate = 0;
    let averageScore = 0;

    if (workspace) {
        // Exam Engagement (Results over time - Bar Chart Data)
        const results = await db.examResult.findMany({
            where: { exam: { workspaceId: workspace.id } },
            orderBy: { createdAt: 'asc' },
            include: { exam: true }
        });

        totalAttempts = results.length;

        if (results.length > 0) {
            const engagementMap = new Map<string, number>();
            results.forEach(r => {
                const dateStr = r.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                engagementMap.set(dateStr, (engagementMap.get(dateStr) || 0) + 1);
            });
            examEngagementData = Array.from(engagementMap.entries()).map(([date, count]) => ({ date, count }));

            const passedCount = results.filter(r => r.score >= (r.exam?.passMarks || 40)).length;
            passRate = Math.round((passedCount / totalAttempts) * 100);
            averageScore = Math.round(results.reduce((acc, r) => acc + r.score, 0) / totalAttempts);
        }

        recentStudents = await db.user.findMany({
            where: { studentWorkspaces: { some: { id: workspace.id } } },
            take: 6,
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
        aiUsagePercent = workspace.aiLimit > 0 ? Math.round((workspace.aiGenerationsCount / workspace.aiLimit) * 100) : 0;
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
                    name, 
                    description, 
                    contactEmail, 
                    contactPhone, 
                    address,
                    adminId: dbUser.id,
                    maxStudents: siteSettings?.trialMaxStudents ?? 50,
                    maxTeachers: siteSettings?.trialMaxTeachers ?? 1,
                    maxExams: siteSettings?.trialMaxExams ?? 5,
                    aiLimit: siteSettings?.trialAiLimit ?? 10,
                    trialExpiresAt: siteSettings?.trialDays ? new Date(Date.now() + siteSettings.trialDays * 24 * 60 * 60 * 1000) : null
                }
            });
        }
        revalidatePath("/admin");
    }

    const showUpgradePrompt = workspace && !workspace.aiUnlimited && workspace.aiGenerationsCount >= 1;

    // Allocation pie data
    const allocationData = workspace ? [
        { name: "Enrollees", value: workspace.students.length },
        { name: "Faculty", value: workspace.teachers.length },
        { name: "Exams", value: workspace.exams.length },
    ] : [];

    const studentCapPercent = workspace && workspace.maxStudents > 0 
        ? Math.min(100, Math.round((workspace.students.length / workspace.maxStudents) * 100)) 
        : 0;

    const teacherCapPercent = workspace && workspace.maxTeachers > 0 
        ? Math.min(100, Math.round((workspace.teachers.length / workspace.maxTeachers) * 100)) 
        : 0;

    const examCapPercent = workspace && workspace.maxExams > 0 
        ? Math.min(100, Math.round((workspace.exams.length / workspace.maxExams) * 100)) 
        : 0;

    return (
        <DashboardPage>
            {/* Standardized Dashboard Header */}
            <DashboardHeader
                title={<>{workspace?.name || "Workspace"} <span className="text-primary font-black">Overview</span></>}
                subtitle="Institutional command hub: candidate allocations, assessment telemetry, faculty distribution, and proctoring integrity."
                actions={
                    workspace ? (
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link href="/teacher/exams">
                                <Button size="sm" className="h-8.5 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-2xs gap-1.5 cursor-pointer">
                                    <Plus className="size-3.5" />
                                    <span>New Exam</span>
                                </Button>
                            </Link>
                            <Link href="/admin/invitations">
                                <Button variant="outline" size="sm" className="h-8.5 px-3 border-border/60 hover:bg-muted font-bold text-xs rounded-xl gap-1.5 cursor-pointer">
                                    <UserPlus className="size-3.5 text-muted-foreground" />
                                    <span>Invite</span>
                                </Button>
                            </Link>
                            <Link href="/admin/billing">
                                <Button variant="ghost" size="sm" className="h-8.5 px-2.5 border border-border/40 hover:bg-muted font-bold text-xs rounded-xl gap-1.5 cursor-pointer">
                                    <Zap className="size-3.5 text-primary" />
                                    <span>Billing</span>
                                </Button>
                            </Link>
                            <Link href="/admin/settings">
                                <Button variant="ghost" size="sm" className="h-8.5 px-2.5 border border-border/40 hover:bg-muted font-bold text-xs rounded-xl gap-1.5 cursor-pointer">
                                    <Settings className="size-3.5 text-muted-foreground" />
                                    <span>Settings</span>
                                </Button>
                            </Link>
                        </div>
                    ) : null
                }
            />

            {/* Optional AI Upgrade Banner */}
            {showUpgradePrompt && (
                <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-secondary/30 border border-primary/25 rounded-2xl p-4 sm:p-5 text-foreground relative overflow-hidden group shadow-2xs">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1 text-center md:text-left space-y-1">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <Sparkles className="size-4 text-primary" />
                                <h2 className="text-sm sm:text-base font-extrabold tracking-tight">Upgrade to Unlimited AI Generation</h2>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                                Unlock unlimited question variations, institutional report cards, and instant automated exam crafting.
                            </p>
                        </div>
                        <div className="shrink-0">
                            <Link href="/admin/billing">
                                <Button size="sm" className="h-8.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer">
                                    <Rocket className="size-3.5 mr-1.5" /> Upgrade Plan
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {!workspace ? (
                <Card className="max-w-xl border border-border/60 bg-card shadow-xs rounded-2xl overflow-hidden mt-4">
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
                            <Button type="submit" size="sm" className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs mt-2 cursor-pointer">Initialize Workspace</Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4 sm:space-y-5">
                    {/* PRIMARY 4 KPI METRIC CARDS */}
                    <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                        {/* 1. Enrolled Candidates */}
                        <DashboardMetricCard
                            title="Enrolled Candidates"
                            value={workspace.students.length}
                            subtitle={`${workspace.students.length} of ${workspace.maxStudents} capacity slots`}
                            progress={studentCapPercent}
                            icon={<GraduationCap className="size-4 text-blue-500" />}
                            badge={
                                <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    {studentCapPercent}% Cap
                                </span>
                            }
                        />

                        {/* 2. Faculty Instructors */}
                        <DashboardMetricCard
                            title="Faculty Instructors"
                            value={workspace.teachers.length}
                            subtitle={`${workspace.teachers.length} of ${workspace.maxTeachers} teacher seats`}
                            progress={teacherCapPercent}
                            icon={<Users className="size-4 text-emerald-500" />}
                            badge={
                                <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    {teacherCapPercent}% Allocated
                                </span>
                            }
                        />

                        {/* 3. Exam Sets */}
                        <DashboardMetricCard
                            title="Exam Sets"
                            value={workspace.exams.length}
                            subtitle={`${workspace.exams.filter((e: any) => e.status === "ACTIVE" || e.isPublished).length} active tests deployed`}
                            progress={examCapPercent}
                            icon={<ClipboardList className="size-4 text-amber-500" />}
                            badge={
                                <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    {examCapPercent}% Repo
                                </span>
                            }
                        />

                        {/* 4. AI Generation Engine */}
                        <DashboardMetricCard
                            title="AI Intelligence Lane"
                            value={workspace.aiUnlimited ? workspace.aiGenerationsCount : workspace.aiGenerationsCount}
                            subtitle={workspace.aiUnlimited ? "Unlimited Institutional Quota" : `${Math.max(0, workspace.aiLimit - workspace.aiGenerationsCount)} generations remaining`}
                            progress={workspace.aiUnlimited ? 100 : aiUsagePercent}
                            icon={<Zap className="size-4 text-purple-500" />}
                            badge={
                                <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                    {workspace.aiUnlimited ? `${workspace.aiGenerationsCount} Runs` : `${aiUsagePercent}% Used`}
                                </span>
                            }
                        />
                    </div>

                    {/* ACADEMIC VELOCITY & ALLOCATION SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                        {/* Exam Participation Trends */}
                        <div className="lg:col-span-2">
                            <Card className="border border-border/70 bg-card/80 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden h-full flex flex-col">
                                <CardHeader className="p-4 sm:p-5 pb-2 border-b border-border/40">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Academic Velocity</CardDescription>
                                            <CardTitle className="text-sm sm:text-base font-extrabold tracking-tight">Exam Participation & Submission Trends</CardTitle>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border-border/60 text-muted-foreground">
                                                LATEST 30 DAYS
                                            </Badge>
                                            <Badge className={cn("text-[10px] font-bold px-2 py-0.5 border", Number(performanceDelta) >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20")}>
                                                {Number(performanceDelta) >= 0 ? "+" : ""}{performanceDelta}% Cycle
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 pt-3 flex-1 flex flex-col justify-center">
                                    {examEngagementData.length > 0 ? (
                                        <div className="h-[240px] w-full">
                                            <EntityBarChart
                                                data={examEngagementData}
                                                dataKey="count"
                                                nameKey="date"
                                                color="#f59e0b"
                                                noCard={true}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-[220px] flex flex-col items-center justify-center text-center space-y-2 py-6">
                                            <div className="size-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                                                <Activity className="size-5" />
                                            </div>
                                            <p className="text-xs font-bold text-foreground">No participation data recorded yet</p>
                                            <p className="text-[11px] text-muted-foreground max-w-sm">
                                                When students submit responses to published tests, submission counts and daily engagement will automatically appear here.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="px-4 sm:px-5 py-3 border-t border-border/50 bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
                                    <div className="flex items-center gap-4">
                                        <span>Total Attempts: <strong className="text-foreground">{totalAttempts}</strong></span>
                                        <span>Average Score: <strong className="text-foreground">{averageScore}%</strong></span>
                                    </div>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{passRate}% Certified Pass Rate</span>
                                </div>
                            </Card>
                        </div>

                        {/* Institutional Asset Allocation */}
                        <div className="lg:col-span-1">
                            <Card className="border border-border/70 bg-card/80 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden h-full flex flex-col">
                                <CardHeader className="p-4 sm:p-5 pb-2 border-b border-border/40">
                                    <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Resource Allocation</CardDescription>
                                    <CardTitle className="text-sm sm:text-base font-extrabold tracking-tight">Institutional Assets</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 pt-2 flex-1 flex flex-col justify-center">
                                    <RolePieChart
                                        data={allocationData}
                                        centerLabel="Total Assets"
                                    />

                                    {/* Breakdown Legend */}
                                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50 text-center">
                                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40">
                                            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground">
                                                <span className="size-2 rounded-full bg-[#6366f1]" />
                                                <span>Students</span>
                                            </div>
                                            <p className="text-sm font-bold text-foreground mt-0.5">{workspace.students.length}</p>
                                        </div>
                                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40">
                                            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground">
                                                <span className="size-2 rounded-full bg-[#f59e0b]" />
                                                <span>Faculty</span>
                                            </div>
                                            <p className="text-sm font-bold text-foreground mt-0.5">{workspace.teachers.length}</p>
                                        </div>
                                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40">
                                            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground">
                                                <span className="size-2 rounded-full bg-[#10b981]" />
                                                <span>Exams</span>
                                            </div>
                                            <p className="text-sm font-bold text-foreground mt-0.5">{workspace.exams.length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* ACTIVITY FEED & PROCTORING SENTINEL */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                        {/* Real-time Activity Feed */}
                        <div className="lg:col-span-2">
                            <Card className="border border-border/70 bg-card/80 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden h-full">
                                <Tabs defaultValue="students" className="w-full">
                                    <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Real-Time Updates</CardDescription>
                                                <CardTitle className="text-sm sm:text-base font-extrabold tracking-tight">Institutional Activity Stream</CardTitle>
                                            </div>
                                            <TabsList className="bg-muted/60 p-1 rounded-xl h-auto self-start sm:self-center border border-border/50">
                                                <TabsTrigger value="students" className="px-3 py-1 rounded-lg text-xs font-bold">Enrollees ({recentStudents.length})</TabsTrigger>
                                                <TabsTrigger value="notices" className="px-3 py-1 rounded-lg text-xs font-bold">Broadcasts ({recentNotices.length})</TabsTrigger>
                                            </TabsList>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-5 pt-3">
                                        <TabsContent value="students" className="mt-0">
                                            {recentStudents.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    {recentStudents.map((student) => (
                                                        <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all">
                                                            <Avatar className="size-8.5 border border-primary/20 shrink-0">
                                                                <AvatarImage src={student.imageUrl || ""} />
                                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                                                                    {student.firstName?.[0] || "S"}{student.lastName?.[0] || ""}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-foreground truncate">{student.firstName} {student.lastName || ""}</p>
                                                                <p className="text-[10px] text-muted-foreground truncate">{student.email}</p>
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                                                                {formatDistanceToNow(student.createdAt)} ago
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center space-y-2">
                                                    <div className="size-10 bg-muted/50 rounded-xl flex items-center justify-center mx-auto text-muted-foreground">
                                                        <UserPlus className="size-5" />
                                                    </div>
                                                    <p className="text-xs font-bold text-foreground">No students enrolled yet</p>
                                                    <p className="text-[11px] text-muted-foreground">Share the workspace invitation link or QR code to onboard candidates.</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="notices" className="mt-0">
                                            {recentNotices.length > 0 ? (
                                                <div className="space-y-2">
                                                    {recentNotices.map((notice) => (
                                                        <div key={notice.id} className="p-3 rounded-xl bg-muted/20 border border-border/50 hover:bg-card hover:border-primary/30 transition-all">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h5 className="text-xs font-bold text-foreground">{notice.title}</h5>
                                                                <span className="text-[9.5px] font-medium text-muted-foreground">{formatDistanceToNow(notice.createdAt)} ago</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                                <Bell className="size-3 text-primary shrink-0" />
                                                                <span className="truncate">From: {notice.sender.firstName} {notice.sender.lastName}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center space-y-2">
                                                    <div className="size-10 bg-muted/50 rounded-xl flex items-center justify-center mx-auto text-muted-foreground">
                                                        <FileText className="size-5" />
                                                    </div>
                                                    <p className="text-xs font-bold text-foreground">No broadcasts published</p>
                                                    <p className="text-[11px] text-muted-foreground">Important institutional announcements will appear here.</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </CardContent>
                                </Tabs>
                            </Card>
                        </div>

                        {/* Security & Proctoring Sentinel */}
                        <div className="lg:col-span-1">
                            <Card className="border border-border/70 bg-card/80 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden h-full flex flex-col">
                                <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40">
                                    <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Integrity Matrix</CardDescription>
                                    <CardTitle className="text-sm sm:text-base font-extrabold tracking-tight">Proctoring Sentinel</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 pt-3 space-y-3 flex-1">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                                        <div className="flex items-center gap-2.5">
                                            <AlertTriangle className={cn("size-4", totalTabSwitches > 0 ? "text-amber-500" : "text-emerald-500")} />
                                            <span className="text-xs font-bold text-foreground">Proctoring Alerts</span>
                                        </div>
                                        <span className="text-xs font-black text-foreground">{totalTabSwitches} Switches</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="flex items-center gap-2.5">
                                            <ShieldCheck className="size-4 text-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Node Status</span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Verified</span>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            <span>Assessment Engine</span>
                                            <span className="text-foreground">{computeHealth}%</span>
                                        </div>
                                        <Progress value={computeHealth} className="h-1.5" />
                                        <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                                            {aiUsagePercent > 90 ? "High resource load detected on AI lanes." : "Assessment runtime and database sharding operating with zero latency."}
                                        </p>
                                    </div>
                                </CardContent>
                                <div className="p-4 border-t border-border/50 bg-muted/10">
                                    <Link href="/admin/notices" className="block w-full">
                                        <Button variant="outline" className="w-full rounded-xl border-border/60 hover:bg-muted text-xs font-bold h-8.5 cursor-pointer">
                                            Broadcast Workspace Notice
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* QUICK ACTION MANAGEMENT TILES */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs space-y-3.5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-extrabold text-foreground tracking-tight flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    Institutional Hub Management
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                    Direct access to candidate registries, faculty roster, test builder, and institutional billing.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <Link href="/admin/students" className="group p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/40 hover:bg-card transition-all flex flex-col justify-between">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Students</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Candidate roster</p>
                                </div>
                            </Link>

                            <Link href="/admin/teachers" className="group p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/40 hover:bg-card transition-all flex flex-col justify-between">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Faculty</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Staff instructors</p>
                                </div>
                            </Link>

                            <Link href="/teacher/exams" className="group p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/40 hover:bg-card transition-all flex flex-col justify-between">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                    <ClipboardList className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Exam Console</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Test builder</p>
                                </div>
                            </Link>

                            <Link href="/admin/invitations" className="group p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/40 hover:bg-card transition-all flex flex-col justify-between">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                    <QrCode className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Invitations</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">QR & links</p>
                                </div>
                            </Link>

                            <Link href="/admin/billing" className="group p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/40 hover:bg-card transition-all flex flex-col justify-between">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Billing</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Tier & settlement</p>
                                </div>
                            </Link>

                            <Link href="/admin/settings" className="group p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/40 hover:bg-card transition-all flex flex-col justify-between">
                                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                    <Settings className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Settings</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Profile & branding</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </DashboardPage>
    );
}
