import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Trophy, Clock, PlayCircle, Star, TrendingUp, ArrowRight, Zap, Sparkles, Building2, Map } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { suggestMockExamsForStudent } from "@/lib/ai";
import { cn } from "@/lib/utils";
import { InterestsSelector } from "@/components/shared/InterestsSelector";

export default async function StudentDashboard() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
            studentWorkspaces: true,
            examResults: {
                include: { exam: true },
                orderBy: { createdAt: "desc" }
            }
        }
    });

    if (!dbUser) return <div>User not found.</div>;

    const totalExamsTaken = dbUser.examResults.length;
    const passedExams = dbUser.examResults.filter(r => r.score >= r.exam.passMarks).length;
    const passRate = totalExamsTaken > 0 ? Math.round((passedExams / totalExamsTaken) * 100) : 0;

    // Smart Recommendations based on interests
    let publicExams: any[] = await (db.exam as any).findMany({
        where: { isPublic: true, status: "ACTIVE" },
        include: { workspace: true, _count: { select: { questions: true } } },
        orderBy: { createdAt: "desc" },
    });

    const definedUser = dbUser as any;
    if (definedUser.interests && definedUser.interests.length > 0) {
        publicExams = publicExams.filter(e =>
            definedUser.interests.some((interest: string) =>
                e.title.toLowerCase().includes(interest.toLowerCase()) ||
                (e.description && e.description.toLowerCase().includes(interest.toLowerCase())) ||
                e.workspace.name.toLowerCase().includes(interest.toLowerCase())
            )
        );
    }
    publicExams = publicExams.slice(0, 4); // Take top 4

    return (
        <div className="space-y-10 pb-16">
            <div className="flex flex-col gap-3 relative z-10 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                        Learning <span className="text-primary">Journey</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">Your progress matters. Track your growth and master new skills.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/student/exams">
                        <Button className="h-11 px-6 rounded-full font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg group transition-all">
                            Available Exams
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: "Total Attempts", value: totalExamsTaken, label: "Tests participated", icon: Target, styles: { line: "bg-primary", bg: "bg-primary/10", icon: "text-primary" } },
                    { title: "Mastery Level", value: passedExams, label: "Assessments cleared", icon: Trophy, styles: { line: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-emerald-600 dark:text-emerald-400" } },
                    { title: "Efficiency", value: `${passRate}%`, label: "Pass-to-fail ratio", icon: TrendingUp, styles: { line: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-600 dark:text-amber-400" } },
                    { title: "Affiliations", value: dbUser.studentWorkspaces.length, label: "Active workspaces", icon: Star, styles: { line: "bg-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20", icon: "text-rose-600 dark:text-rose-400" } }
                ].map((stat) => (
                    <Card key={stat.title} className="border border-slate-100 dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden group">
                        <div className={cn("h-1.5 w-full", stat.styles.line)} />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.title}</CardTitle>
                            <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-105", stat.styles.bg)}>
                                <stat.icon className={cn("h-4 w-4", stat.styles.icon)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))
                }
            </div>

            {/* SAAS Cross-Sell Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 dark:bg-zinc-900 shadow-xl border border-slate-800 p-8 md:p-12 mb-10 flex flex-col md:flex-row items-center justify-between gap-8 group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary/20 rounded-xl text-primary">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Need to Conduct Exams?</h2>
                    </div>
                    <p className="text-slate-400 font-medium">ABCD Exam Hub is a complete SAAS platform. Create your own dedicated workspace to host, manage, and analyze examinations for your institution or coaching center seamlessly.</p>
                </div>
                <div className="relative z-10 flex-shrink-0">
                    <Link href="/services">
                        <Button className="h-14 px-8 rounded-full font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all">
                            Make Your Own Workspace
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-8">
                    <div>
                        <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 mb-2 font-sans">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            Domain-Matched Missions
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium mb-6">Missions curated precisely for the career paths and domains you've selected.</p>

                        <InterestsSelector currentInterests={dbUser.interests || []} />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 mt-8">
                        {publicExams.length === 0 ? (
                            <div className="col-span-full p-16 text-center rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 mt-4">
                                <Map className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">No matching missions found.</h4>
                                <p className="text-sm text-muted-foreground mt-2">Try updating your target domains above.</p>
                            </div>
                        ) : (
                            publicExams.map((exam) => (
                                <Card key={exam.id} className="border border-slate-200/60 dark:border-zinc-800 bg-white/50 backdrop-blur-xl dark:bg-zinc-900/80 rounded-[2rem] overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] transition-all duration-500 relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <CardContent className="p-6 relative z-10 flex flex-col h-full">
                                        <div className="mb-4">
                                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 border-none rounded mb-3">
                                                {exam.workspace?.name}
                                            </Badge>
                                            <h4 className="font-extrabold text-lg leading-snug line-clamp-2 text-slate-900 dark:text-white group-hover:text-primary transition-colors">{exam.title}</h4>
                                        </div>
                                        <div className="flex items-center gap-4 py-3 border-y border-slate-100 dark:border-zinc-800 mb-6 mt-auto">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Duration</span>
                                                <span className="text-sm font-bold">{exam.duration}m</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Questions</span>
                                                <span className="text-sm font-bold">{exam._count?.questions || 0}</span>
                                            </div>
                                        </div>
                                        <Link href={`/student/exams/${exam.id}/start`} className="block w-full">
                                            <Button className="w-full h-11 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-primary hover:text-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-primary dark:hover:text-slate-900 transition-all group-hover:-translate-y-1">
                                                Accept Mission
                                                <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            </Button>
                                        </Link>
                                    </CardContent>
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-8">
                    <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 font-sans">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                        </div>
                        Activity <span className="text-indigo-600">Log</span>
                    </h3>
                    <Card className="border border-slate-200 dark:border-zinc-800 shadow-xl shadow-slate-200/20 dark:shadow-none bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-zinc-800/30 px-6 py-5 border-b border-slate-100 dark:border-zinc-800">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Personal Achievement Record</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {dbUser.examResults.length === 0 ? (
                                <div className="p-20 text-center">
                                    <p className="text-sm text-muted-foreground font-black uppercase tracking-widest opacity-20 italic">No missions recorded.</p>
                                </div>
                            ) : (
                                <div className="divide-y dark:divide-zinc-800">
                                    {dbUser.examResults.slice(0, 5).map((result) => {
                                        const isPassed = result.score >= result.exam.passMarks;
                                        return (
                                            <div key={result.id} className="px-8 py-6 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <h5 className="font-black text-sm uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">{result.exam.title}</h5>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(result.createdAt))}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <div className="text-xl font-black flex items-baseline gap-1">
                                                        {result.score}
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Pts</span>
                                                    </div>
                                                    <Badge
                                                        className={cn(
                                                            "font-black text-[9px] tracking-[0.1em] border-none px-2.5 py-1 rounded-lg uppercase shadow-sm",
                                                            isPassed ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
                                                        )}
                                                    >
                                                        {isPassed ? "Successful" : "Re-attempt Needed"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
