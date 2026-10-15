import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Target, 
    Trophy, 
    Clock, 
    PlayCircle, 
    TrendingUp, 
    ArrowRight, 
    Zap, 
    Sparkles, 
    Building2, 
    Map, 
    XCircle, 
    Bell, 
    Megaphone,
    FileQuestion,
    CheckCircle2,
    ShieldAlert,
    ChevronRight,
    FileText,
    Compass
} from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InterestsSelector } from "@/components/shared/InterestsSelector";
import { getLatestWorkspaceRequest } from "@/actions/workspace-request";
import { getInbox } from "@/actions/notice";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";

export default async function StudentDashboard() {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) redirect("/sign-in");

    const [dbUser, latestRequest, inbox] = await Promise.all([
        db.user.findUnique({
            where: { clerkId: clerkUserId },
            include: {
                studentWorkspaces: true,
                examResults: {
                    include: { 
                        exam: { 
                            include: { workspace: true } 
                        } 
                    },
                    orderBy: { createdAt: "desc" }
                }
            }
        }),
        getLatestWorkspaceRequest(clerkUserId),
        getInbox()
    ]);

    if (!dbUser) return <div>User not found.</div>;

    const unreadNotices = inbox.filter((n: any) => !n.isRead);
    const latestNotice = inbox[0] || null;

    const totalExamsTaken = dbUser.examResults.length;
    const passedExams = dbUser.examResults.filter((r: any) => r.score >= r.exam.passMarks).length;
    const passRate = totalExamsTaken > 0 ? Math.round((passedExams / totalExamsTaken) * 100) : 0;

    const totalScoreSum = dbUser.examResults.reduce((acc: number, r: any) => acc + (r.score || 0), 0);
    const averageScore = totalExamsTaken > 0 ? Math.round((totalScoreSum / totalExamsTaken) * 10) / 10 : 0;

    // Get IDs of exams already completed by this student
    const completedExamIds = dbUser.examResults.map((r: any) => r.examId);

    // Query active exams available to the student
    let publicExams: any[] = await (db.exam as any).findMany({
        where: {
            AND: [
                {
                    OR: [
                        { isPublic: true },
                        { allowedStudents: { some: { id: dbUser.id } } },
                        { workspace: { students: { some: { id: dbUser.id } } } }
                    ]
                },
                { status: "ACTIVE" },
                { id: { notIn: completedExamIds } }
            ]
        },
        include: { workspace: true, _count: { select: { questions: true } } },
        orderBy: { createdAt: "desc" },
    });

    const definedUser = dbUser as any;
    if (definedUser.interests && definedUser.interests.length > 0) {
        publicExams = publicExams.filter(e =>
            definedUser.interests.some((interest: string) =>
                e.title.toLowerCase().includes(interest.toLowerCase()) ||
                (e.description && e.description.toLowerCase().includes(interest.toLowerCase())) ||
                e.workspace?.name.toLowerCase().includes(interest.toLowerCase())
            )
        );
    }
    publicExams = publicExams.slice(0, 4); // Take top 4 recommended

    // Dynamic Greeting Context
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const firstName = dbUser.firstName || "Scholar";
    const achievementSummary = passedExams > 0 
        ? `You have cleared ${passedExams} of ${totalExamsTaken} assessments with an average score of ${averageScore} pts. Keep up the high standard!`
        : "Welcome to your digital exam hub! Review your target domains below to discover mock exams and assessments.";
    
    const isAlreadyAdmin = dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN";

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Student <span className="text-primary font-black">Portal</span></>}
                subtitle="Track academic progress, review past test results, and take available examinations."
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/student/notices">
                            <Button variant="outline" size="sm" className="h-8.5 px-3 rounded-xl font-semibold text-xs border-border/60 hover:bg-muted/50 gap-1.5 relative">
                                <Bell className="size-3.5 text-primary" />
                                <span>Notices</span>
                                {unreadNotices.length > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                                        {unreadNotices.length}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        <Link href="/student/exams">
                            <Button size="sm" className="h-8.5 px-3.5 rounded-xl font-semibold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs group transition-all gap-1.5">
                                <span>Available Exams</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Dynamic Greeting Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card/95 to-primary/5 p-5 sm:p-7 shadow-xs">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" />
                                <span>Academic Dashboard</span>
                            </Badge>
                            {dbUser.studentWorkspaces.length > 0 && (
                                <Badge variant="secondary" className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full">
                                    {dbUser.studentWorkspaces.length} Enrolled {dbUser.studentWorkspaces.length === 1 ? "Workspace" : "Workspaces"}
                                </Badge>
                            )}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
                            {greeting}, <span className="text-primary">{firstName}</span>!
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm font-medium leading-relaxed">
                            {achievementSummary}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                        <Link href="/student/exams">
                            <Button className="h-9.5 px-4 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs group transition-all gap-1.5">
                                <PlayCircle className="w-4 h-4" />
                                <span>Browse Assessments</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/student/results">
                            <Button variant="outline" className="h-9.5 px-4 rounded-xl font-semibold text-xs border-border/80 hover:bg-muted/60 transition-all gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Merit Vault</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Standardized Metric Cards Grid */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Total Attempts"
                    value={totalExamsTaken}
                    subtitle="Assessments taken"
                    icon={<Target className="size-4 text-primary" />}
                    badge={
                        <Badge variant="outline" className="text-[9.5px] font-bold bg-primary/10 text-primary border-primary/20">
                            Tests
                        </Badge>
                    }
                />
                <DashboardMetricCard
                    title="Mastery Cleared"
                    value={passedExams}
                    subtitle={`${passedExams} of ${totalExamsTaken} cleared`}
                    icon={<Trophy className="size-4 text-emerald-500" />}
                    badge={
                        <Badge variant="outline" className="text-[9.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                            Passed
                        </Badge>
                    }
                />
                <DashboardMetricCard
                    title="Pass Rate"
                    value={`${passRate}%`}
                    subtitle="Success efficiency"
                    icon={<TrendingUp className="size-4 text-amber-500" />}
                    progress={passRate}
                />
                <DashboardMetricCard
                    title="Avg. Score"
                    value={`${averageScore} pts`}
                    subtitle={totalExamsTaken > 0 ? "Overall average" : "No tests taken"}
                    icon={<Zap className="size-4 text-blue-500" />}
                    badge={
                        <Badge variant="outline" className="text-[9.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            Points
                        </Badge>
                    }
                />
            </div>

            {/* Live Broadcast Notice Bulletin */}
            {latestNotice && (
                <div className={cn(
                    "relative overflow-hidden rounded-2xl border transition-all p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                    unreadNotices.length > 0
                        ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30 shadow-xs"
                        : "bg-muted/30 border-border/50"
                )}>
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            unreadNotices.length > 0
                                ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25 animate-pulse"
                                : "bg-muted text-muted-foreground"
                        )}>
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                                    {unreadNotices.length > 0 ? `${unreadNotices.length} New Broadcast` : `${inbox.length} Bulletins`}
                                </span>
                                {latestNotice.sender?.role && (
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                        From {latestNotice.sender.role.replace("_", " ")}
                                    </span>
                                )}
                            </div>
                            <h4 className="text-sm font-bold text-foreground truncate max-w-md sm:max-w-xl">
                                {latestNotice.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-lg">
                                {latestNotice.content}
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0 self-end sm:self-center">
                        <Link href="/student/notices">
                            <Button size="sm" variant={unreadNotices.length > 0 ? "default" : "outline"} className="h-8.5 px-3.5 rounded-xl text-xs font-semibold gap-1.5">
                                <span>Open Notices Hub</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Workspace Request Status Alert */}
            {latestRequest && latestRequest.status !== 'APPROVED' && (
                <div className={cn(
                    "relative overflow-hidden rounded-2xl border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all",
                    latestRequest.status === 'PENDING' 
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200" 
                        : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs",
                            latestRequest.status === 'PENDING' ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                        )}>
                            {latestRequest.status === 'PENDING' ? <Clock className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="text-base font-bold tracking-tight text-foreground">
                                    Workspace Request {latestRequest.status === 'PENDING' ? "Under Verification" : "Declined"}
                                </h3>
                                <Badge className={cn(
                                    "border-none text-[9.5px] uppercase font-bold tracking-wider px-2 py-0.5",
                                    latestRequest.status === 'PENDING' ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                                )}>
                                    {latestRequest.planId}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium max-w-xl">
                                {latestRequest.status === 'PENDING' 
                                    ? `Your application for "${latestRequest.workspaceName}" is being verified. Verification typically takes up to 24 hours.`
                                    : `Your request for "${latestRequest.workspaceName}" could not be approved. Please contact support for assistance.`
                                }
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0 flex gap-2">
                        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl px-4 text-xs font-semibold border-border/80 bg-background/80 hover:bg-background">
                            <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer">
                                Contact Support
                            </a>
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content: Recommended Missions Grid + Activity Sidebar */}
            <div className="grid lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Domain Curation & Recommended Exams */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                                    <span>Curated Assessments</span>
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Assessments curated based on your selected domains and enrolled workspaces.
                                </p>
                            </div>
                            <Link href="/student/exams">
                                <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-primary hover:text-primary/80 gap-1 px-2.5">
                                    <span>View All</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        </div>

                        {/* Interests Preference Selector */}
                        <InterestsSelector currentInterests={dbUser.interests || []} />
                    </div>

                    {/* Available Exams Grid */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        {publicExams.length === 0 ? (
                            <div className="col-span-full p-10 text-center rounded-2xl border border-dashed border-border/80 bg-card/50">
                                <Map className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                                <h4 className="text-sm font-bold text-foreground">No matching exams right now</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                    Try selecting different target domains above, or check all general exams in the available catalog.
                                </p>
                                <Link href="/student/exams" className="inline-block mt-4">
                                    <Button size="sm" variant="outline" className="h-8.5 rounded-xl text-xs font-semibold gap-1.5">
                                        <Compass className="w-3.5 h-3.5 text-primary" />
                                        <span>Explore All Exams</span>
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            publicExams.map((exam) => (
                                <Card key={exam.id} className="border border-border/70 bg-card/90 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between group">
                                    <CardContent className="p-4.5 sm:p-5 flex flex-col h-full space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-md truncate max-w-[160px]">
                                                    {exam.workspace?.name || "Global Exam"}
                                                </Badge>
                                                <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-muted-foreground">
                                                    Pass: {exam.passMarks} pts
                                                </Badge>
                                            </div>
                                            <h4 className="font-bold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                                {exam.title}
                                            </h4>
                                            {exam.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {exam.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-2 mt-auto space-y-3">
                                            <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-xl bg-muted/40 text-[11px] font-medium text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                                    <span>{exam.duration} mins</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <FileQuestion className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                                    <span>{exam._count?.questions || 0} Questions</span>
                                                </div>
                                            </div>

                                            <Link href={`/student/exams/${exam.id}/start`} className="block w-full">
                                                <Button size="sm" className="w-full h-9 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground transition-all gap-1.5 shadow-2xs">
                                                    <span>Start Assessment</span>
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Recent Activity Log & Testing Guidelines */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Performance & Activity Record Card */}
                    <Card className="border border-border/70 bg-card rounded-2xl overflow-hidden shadow-2xs">
                        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-0.5">
                                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-primary" />
                                    <span>Recent Performance</span>
                                </CardTitle>
                                <p className="text-[11px] text-muted-foreground">Your latest recorded assessment outcomes</p>
                            </div>
                            <Link href="/student/results">
                                <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary hover:text-primary/80 px-2">
                                    <span>View Vault</span>
                                </Button>
                            </Link>
                        </CardHeader>

                        <CardContent className="p-0">
                            {dbUser.examResults.length === 0 ? (
                                <div className="p-8 text-center space-y-2">
                                    <p className="text-xs text-muted-foreground font-medium">No assessment attempts recorded yet.</p>
                                    <Link href="/student/exams">
                                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-xl">
                                            Take Your First Test
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {dbUser.examResults.slice(0, 5).map((result: any) => {
                                        const isPassed = result.score >= result.exam.passMarks;
                                        return (
                                            <Link 
                                                key={result.id} 
                                                href={`/student/results/${result.id}`}
                                                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors group block"
                                            >
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate max-w-[120px]">
                                                            {result.exam.workspace?.name || "Exam"}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">•</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short' }).format(new Date(result.createdAt))}
                                                        </span>
                                                    </div>
                                                    <h5 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                        {result.exam.title}
                                                    </h5>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="text-right">
                                                        <div className="text-xs sm:text-sm font-extrabold text-foreground">
                                                            {result.score} <span className="text-[10px] font-normal text-muted-foreground">pts</span>
                                                        </div>
                                                        <Badge
                                                            className={cn(
                                                                "text-[9px] font-bold px-1.5 py-0.2 rounded-md border-none",
                                                                isPassed 
                                                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" 
                                                                    : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                                            )}
                                                        >
                                                            {isPassed ? "Cleared" : "Needs Review"}
                                                        </Badge>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Examination Readiness & Integrity Guide */}
                    <Card className="border border-border/70 bg-card rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-primary" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                Proctoring & Exam Guidelines
                            </h4>
                        </div>
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span><strong>Strict Proctoring:</strong> Full-screen integrity checks monitor tab switches and window unfocus during active tests.</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span><strong>Offline Resilience:</strong> Answers synchronize locally to prevent data loss in case of momentary connection drops.</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span><strong>Instant Verification:</strong> Detailed score breakdowns and solution keys are unlocked immediately post-submission.</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* SAAS Workspace Cross-Sell Banner */}
            {!isAlreadyAdmin && (
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 dark:bg-zinc-900 border border-slate-800 p-6 sm:p-8 mt-4 text-white shadow-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-transparent to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-2xl">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/20 rounded-lg text-primary">
                                    <Building2 className="w-4.5 h-4.5" />
                                </div>
                                <span className="text-[11px] font-bold tracking-wider uppercase text-primary">
                                    Institutional Workspace
                                </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                Need to Conduct Exams for Your Own Organization?
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                                Launch a dedicated workspace to manage student batches, generate question banks with AI, host secure proctored tests, and review automated analytics.
                            </p>
                        </div>
                        <div className="shrink-0">
                            <Link href="/pricing">
                                <Button className="h-10 px-5 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all">
                                    Create Exam Workspace
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </DashboardPage>
    );
}
