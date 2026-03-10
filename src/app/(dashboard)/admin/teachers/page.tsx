import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddUserModal } from "@/components/workspace/AddUserModal";
import { UniversalDeleteAction } from "@/components/shared/UniversalDeleteAction";
import { EditTeacherAiLimitModal } from "@/components/workspace/EditTeacherAiLimitModal";
import { Mail, Calendar, BookOpen, ClipboardList, TrendingUp, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminTeachersPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    const workspace = await db.workspace.findUnique({
        where: { adminId: dbUser.id },
    });

    if (!workspace) {
        return (
            <div className="p-12 text-center text-muted-foreground bg-slate-50 dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-zinc-800">
                <p className="font-bold text-lg">Infrastructure Missing</p>
                <p className="text-sm">Please initialize your workspace profile on the dashboard first.</p>
            </div>
        )
    }

    const workspaceWithTeachers = await db.workspace.findUnique({
        where: { id: workspace.id },
        include: {
            teachers: {
                orderBy: { createdAt: 'desc' },
                include: {
                    authoredQuestions: { select: { id: true } },
                    authoredExams: {
                        include: {
                            _count: { select: { results: true } }
                        }
                    },
                    workspaceAiUsages: {
                        where: { workspaceId: workspace.id }
                    }
                }
            }
        }
    });

    if (!workspaceWithTeachers) {
        return (
            <div className="p-12 text-center text-muted-foreground bg-slate-50 dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-zinc-800">
                <p className="font-bold text-lg">Infrastructure Missing</p>
                <p className="text-sm">Please initialize your workspace profile on the dashboard first.</p>
            </div>
        )
    }

    const { teachers } = workspaceWithTeachers;



    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                        Faculty <span className="text-primary">Management</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                        Monitor performance and manage staff for {workspaceWithTeachers.name}.
                    </p>
                </div>
                <AddUserModal roleType="TEACHER" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {teachers.length === 0 ? (
                    <div className="col-span-full p-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold">No Faculty Members Yet</h3>
                        <p className="text-sm text-muted-foreground mb-6">Start building your team by inviting educators to your workspace.</p>
                        <AddUserModal roleType="TEACHER" />
                    </div>
                ) : (
                    teachers.map((teacher: any) => {
                        const questionsCount = teacher.authoredQuestions.length;
                        const examsCreated = teacher.authoredExams.length;
                        const totalParticipations = teacher.authoredExams.reduce((acc: any, curr: any) => acc + curr._count.results, 0);

                        const usageRecord = teacher.workspaceAiUsages?.[0];
                        const teacherAiLimit = usageRecord?.aiLimit ?? 5; // Default limit
                        const teacherAiUsage = usageRecord?.aiGenerationsCount ?? 0;

                        return (
                            <Card key={teacher.id} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden group hover:ring-2 hover:ring-indigo-600/20 transition-all duration-300">
                                <div className="h-2 w-full bg-indigo-600" />
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <Avatar className="w-16 h-16 rounded-2xl border-2 border-white dark:border-zinc-800 shadow-lg">
                                            <AvatarImage src={teacher.imageUrl || ""} />
                                            <AvatarFallback className="bg-indigo-600 text-white font-black text-xl">
                                                {teacher.firstName?.[0] || teacher.email[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <UniversalDeleteAction
                                            type="TEACHER"
                                            id={teacher.id}
                                            name={`${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.email}
                                            workspaceId={workspaceWithTeachers.id}
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <h4 className="font-bold text-xl tracking-tight truncate">{teacher.firstName} {teacher.lastName}</h4>
                                        <div className="flex items-center text-xs text-muted-foreground font-bold mt-1">
                                            <Mail className="w-3 h-3 mr-1.5" />
                                            {teacher.email}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Created</p>
                                            <div className="flex items-center gap-2">
                                                <ClipboardList className="w-4 h-4 text-indigo-600" />
                                                <span className="text-lg font-black">{examsCreated} Exams</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Authoring</p>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-emerald-600" />
                                                <span className="text-lg font-black">{questionsCount} Qs</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                                            <span className="text-[10px] font-black uppercase text-indigo-600">Total Engagement</span>
                                        </div>
                                        <span className="text-sm font-black text-indigo-700 dark:text-indigo-400">{totalParticipations} Participations</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Usage</p>
                                                <p className="text-sm font-bold">{teacherAiUsage} / {teacherAiLimit}</p>
                                            </div>
                                        </div>
                                        <EditTeacherAiLimitModal
                                            workspaceId={workspaceWithTeachers.id}
                                            teacherId={teacher.id}
                                            teacherName={`${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.email}
                                            currentLimit={teacherAiLimit}
                                            currentUsage={teacherAiUsage}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <Calendar className="w-3 h-3 mr-1.5" />
                                            Joined {new Date(teacher.createdAt).toLocaleDateString()}
                                        </div>
                                        <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 font-bold border-none px-3 py-1 rounded-lg uppercase text-[9px]">Verified Faculty</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    );
}
