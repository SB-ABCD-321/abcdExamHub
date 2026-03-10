import { db } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { deleteGlobalExamAction } from "@/actions/super-admin-crud";
import { toast } from "sonner";

import { GlobalDeleteButton } from "@/components/shared/GlobalDeleteButton";

export default async function GlobalExamsPage() {
    const exams = await db.exam.findMany({
        include: {
            workspace: true,
            author: true,
            _count: { select: { questions: true, results: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Global <span className="text-primary">Exams</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Full oversight of all assessments across every workspace.
                </p>
            </div>

            <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
                <CardHeader className="border-b border-slate-100 dark:border-zinc-800 p-8 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-row items-center justify-between relative z-10">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Assessment Manifest</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Monitor, view, and manage global exam inventory.</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest px-4 py-1.5 border-none shadow-lg rounded-xl">
                        {exams.length} Exams Recorded
                    </Badge>
                </CardHeader>
                <CardContent className="p-0 relative z-10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-zinc-800/20 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 dark:border-zinc-800">
                                <tr>
                                    <th className="px-8 py-5">Exam Details</th>
                                    <th className="px-8 py-5">Origin (Workspace)</th>
                                    <th className="px-8 py-5">Author</th>
                                    <th className="px-8 py-5 text-center">Status</th>
                                    <th className="px-8 py-5 text-center">Questions</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {exams.map((exam) => (
                                    <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group/row">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-[0.8rem] bg-rose-50/80 dark:bg-rose-900/40 flex items-center justify-center font-black text-rose-600 dark:text-rose-400 text-sm shadow-sm border border-rose-100/50 dark:border-rose-800/50">
                                                    <ClipboardList className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">{exam.title}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">{new Date(exam.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{exam.workspace.name}</div>
                                            <div className="text-[10px] text-muted-foreground font-medium">ID: {exam.workspace.id.slice(0, 8)}...</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold">{exam.author?.firstName} {exam.author?.lastName}</div>
                                            <div className="text-[10px] text-muted-foreground font-medium">{exam.author?.email}</div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <Badge variant={exam.status === "ACTIVE" ? "default" : "outline"} className={exam.status === "ACTIVE" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                                                {exam.status}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="text-sm font-black">{exam._count.questions}</div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/student/exams/${exam.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800">
                                                        <ExternalLink className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </Link>
                                                <GlobalDeleteButton id={exam.id} resourceName="Exam" action={deleteGlobalExamAction} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
