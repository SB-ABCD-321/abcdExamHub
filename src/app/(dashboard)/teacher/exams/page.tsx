import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ClipboardList, Clock, CheckCircle2, Trophy, Edit3, Eye, MoreVertical, CalendarClock } from "lucide-react";
import Link from "next/link";
import { UniversalDeleteAction } from "@/components/shared/UniversalDeleteAction";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExamQuickActions } from "./ExamQuickActions";

export default async function TeacherExamsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { teacherWorkspaces: true }
    });

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    const workspaceIds = dbUser.teacherWorkspaces.map(w => w.id);
    if (dbUser.role === "ADMIN") {
        const adminWorkspace = await db.workspace.findUnique({ where: { adminId: dbUser.id } });
        if (adminWorkspace) workspaceIds.push(adminWorkspace.id);
    }

    const isPureTeacher = dbUser.role === "TEACHER";
    const examFilter = isPureTeacher ? { authorId: dbUser.id } : {};

    const exams = await db.exam.findMany({
        where: { workspaceId: { in: workspaceIds }, ...examFilter },
        include: {
            _count: { select: { questions: true, results: true } },
            workspace: { select: { name: true } },
            author: { select: { firstName: true, lastName: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] uppercase font-bold tracking-widest rounded-lg px-2.5 py-1">Active</Badge>;
            case 'PAUSED':
                return <Badge variant="secondary" className="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] uppercase font-bold tracking-widest rounded-lg px-2.5 py-1">Paused</Badge>;
            case 'INACTIVE':
                return <Badge variant="secondary" className="bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400 border-slate-200 dark:border-zinc-700 text-[10px] uppercase font-bold tracking-widest rounded-lg px-2.5 py-1">Disabled</Badge>;
            default:
                return null;
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "No Limit";
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(date);
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                        Exam <span className="text-primary">Portfolio</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                        Architect and manage professional assessments.
                    </p>
                </div>
                <Link href="/teacher/exams/new">
                    <Button className="flex items-center gap-2 h-11 px-5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground">
                        <PlusCircle className="w-4 h-4" />
                        New Assessment
                    </Button>
                </Link>
            </div>

            <div className="mt-8">
                {exams.length === 0 ? (
                    <div className="p-20 text-center rounded-[2.5rem] border border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-zinc-900/30 shadow-inner">
                        <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-3xl shadow-xl shadow-indigo-500/10 flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                            <ClipboardList className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-slate-100 mb-2">No Exams Found</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 font-medium italic">You haven't designed any exams yet. Start by defining your curriculum questions.</p>
                        <Link href="/teacher/questions">
                            <Button variant="outline" className="rounded-xl font-bold">Manage Question Bank</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        {exams.map((exam) => (
                            <Card key={exam.id} className="group relative border border-slate-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/90 rounded-[1.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <CardHeader className="p-6 pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 hover:dark:bg-indigo-900/50 transition-colors text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                                                {exam.workspace.name}
                                            </Badge>
                                            {getStatusBadge(exam.status)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {exam.isPublic ? (
                                                <Badge variant="default" className="flex items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-none border-none text-[10px] uppercase font-bold tracking-widest rounded-lg px-2.5 py-1">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" /> Global
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="flex items-center text-slate-500 dark:text-slate-400 border-slate-200 dark:border-zinc-800 text-[10px] uppercase font-bold tracking-widest rounded-lg px-2.5 py-1">
                                                    Private
                                                </Badge>
                                            )}
                                            <ExamQuickActions examId={exam.id} examTitle={exam.title} examStatus={exam.status} />
                                        </div>
                                    </div>
                                    <div className="mt-1">
                                        <CardTitle className="text-xl font-bold line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {exam.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-2">
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                By {exam.author?.firstName || exam.author?.lastName ? `${exam.author.firstName || ''} ${exam.author.lastName || ''}`.trim() : exam.author?.email || 'Unknown'}
                                            </p>
                                            <span className="text-muted-foreground/30">•</span>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                Edited {formatDate(exam.updatedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-4 gap-x-4 mt-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-zinc-800/80 flex items-center justify-center shrink-0">
                                                <Clock className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Duration</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{exam.duration} Mins</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-zinc-800/80 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Pass Marks</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{exam.passMarks} Pts</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-zinc-800/80 flex items-center justify-center shrink-0">
                                                <CalendarClock className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Starts</p>
                                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{formatDate(exam.startTime)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-zinc-800/80 flex items-center justify-center shrink-0">
                                                <CalendarClock className="w-4 h-4 text-rose-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Ends</p>
                                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{formatDate(exam.endTime)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-0 space-y-6">
                                    <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-zinc-800 rounded-t-2xl overflow-hidden border border-b-0 border-slate-100 dark:border-zinc-800">
                                        <div className="bg-slate-50 dark:bg-zinc-900/80 p-3 text-center">
                                            <p className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:scale-105 transition-transform">{exam._count.questions}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Questions</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-zinc-900/80 p-3 text-center">
                                            <p className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:scale-105 transition-transform">{exam.marksPerQuestion}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Pts / Q</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-zinc-900/80 p-3 text-center">
                                            <p className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:scale-105 transition-transform">{exam._count.questions * (exam.marksPerQuestion ?? 1)}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Total Marks</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-zinc-800 rounded-b-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 mb-2">
                                        <div className="bg-slate-50 dark:bg-zinc-900/80 p-3 text-center">
                                            <p className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:scale-105 transition-transform">{exam._count.results}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Participants</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-zinc-900/80 p-3 text-center">
                                            <p className={`text-lg font-black ${exam.negativeMarksEnabled ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'} group-hover:scale-105 transition-transform`}>
                                                {exam.negativeMarksEnabled ? `-${exam.negativeMarksValue}` : 'None'}
                                            </p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Negative Pts</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <Link href={`/teacher/exams/${exam.id}/edit`} className="flex-1">
                                            <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-colors h-11 rounded-xl font-bold shadow-none active:scale-[0.98]">
                                                <Edit3 className="w-4 h-4 mr-2" /> Modify
                                            </Button>
                                        </Link>
                                        <div className="flex-1">
                                            <UniversalDeleteAction
                                                type="EXAM"
                                                id={exam.id}
                                                name={exam.title}
                                                variant="button"
                                                className="w-full h-11 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white flex justify-center items-center gap-2 active:scale-[0.98] transition-all shadow-none"
                                            />
                                        </div>
                                        <Link href={`/teacher/exams/${exam.id}/results`} className="flex-shrink-0">
                                            <Button variant="outline" className="h-11 px-4 rounded-xl border-slate-200 dark:border-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group/trophy active:scale-[0.98]">
                                                <Trophy className="w-4 h-4 group-hover/trophy:scale-110 transition-transform" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
