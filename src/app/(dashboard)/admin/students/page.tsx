import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddUserModal } from "@/components/workspace/AddUserModal";
import { PromoteTeacherModal } from "@/components/workspace/PromoteTeacherModal";
import { UniversalDeleteAction } from "@/components/shared/UniversalDeleteAction";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

export default async function AdminStudentsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    const workspace = await db.workspace.findUnique({
        where: { adminId: dbUser.id },
        include: { students: { orderBy: { createdAt: 'desc' } } }
    });

    if (!workspace) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Workspace Required</h2>
                <p className="text-muted-foreground mt-2 max-w-md font-medium italic">Please create your workspace profile on the dashboard first to manage students.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                        Student <span className="text-primary">Directory</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                        Enrolled scholars at {workspace.name}.
                    </p>
                </div>
                <AddUserModal roleType="STUDENT" />
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-800/30 p-8 border-b dark:border-zinc-800 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Institute Scholars</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium italic">Directory of students with access to private assessments.</p>
                    </div>
                    <Badge className="bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 border-none shadow-lg shadow-indigo-600/20">
                        {workspace.students.length} Registered
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-zinc-800/20 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-5">Scholar</th>
                                    <th className="px-8 py-5">Email Address</th>
                                    <th className="px-8 py-5 text-center">Enrollment Date</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-zinc-800">
                                {workspace.students.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center">
                                            <GraduationCap className="w-12 h-12 text-slate-200 dark:text-zinc-800 mx-auto mb-4" />
                                            <p className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em]">Zero Scholars Found</p>
                                            <p className="text-xs text-muted-foreground mt-2 font-medium italic">No students are currently enrolled in your workspace.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    workspace.students.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="w-10 h-10 border-2 border-indigo-50 dark:border-indigo-900/40 rounded-2xl">
                                                        <AvatarImage src={student.imageUrl || ""} />
                                                        <AvatarFallback className="bg-indigo-600 text-white font-black text-xs rounded-2xl">
                                                            {student.firstName?.[0] || student.email[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="text-sm font-bold tracking-tight">{student.firstName} {student.lastName}</div>
                                                        <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-tighter mt-1 h-4">Scholar</Badge>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-xs font-bold text-slate-500">{student.email}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                                                    {format(new Date(student.createdAt), "dd/MM/yyyy")}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PromoteTeacherModal
                                                        studentId={student.id}
                                                        studentName={`${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email}
                                                        studentEmail={student.email}
                                                        workspaceId={workspace.id}
                                                    />
                                                    <UniversalDeleteAction
                                                        type="STUDENT"
                                                        id={student.id}
                                                        name={`${student.firstName} ${student.lastName}`}
                                                        workspaceId={workspace.id}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
