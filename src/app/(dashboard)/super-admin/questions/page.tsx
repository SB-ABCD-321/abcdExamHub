import { db } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trash2 } from "lucide-react";
import { GlobalDeleteButton } from "@/components/shared/GlobalDeleteButton";
import { deleteGlobalQuestionAction } from "@/actions/super-admin-crud";

export default async function GlobalQuestionBankPage() {
    const questions = await db.question.findMany({
        include: {
            workspace: true,
            author: true,
            topic: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Global <span className="text-primary">Question Bank</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Full oversight of the entire intellectual property of the platform.
                </p>
            </div>

            <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
                <CardHeader className="border-b border-slate-100 dark:border-zinc-800 p-8 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-row items-center justify-between relative z-10">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Global Repository</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Audit and manage every question across all topics and workspaces.</p>
                    </div>
                    <Badge className="bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 border-none shadow-lg rounded-xl">
                        {questions.length} Questions Stored
                    </Badge>
                </CardHeader>
                <CardContent className="p-0 relative z-10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-zinc-800/20 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 dark:border-zinc-800">
                                <tr>
                                    <th className="px-8 py-5">Question Content</th>
                                    <th className="px-8 py-5">Topic</th>
                                    <th className="px-8 py-5">Origin (Workspace)</th>
                                    <th className="px-8 py-5">Author</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {questions.map((question) => (
                                    <tr key={question.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group/row">
                                        <td className="px-8 py-6 max-w-md">
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 mt-1 rounded-lg bg-amber-50/80 dark:bg-amber-900/40 flex items-center justify-center font-black text-amber-600 dark:text-amber-400 text-xs shadow-sm border border-amber-100/50 dark:border-amber-800/50">
                                                    Q
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2">{question.text}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1">{new Date(question.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant="outline" className="font-bold border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400">
                                                {question.topic.name}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{question.workspace?.name || "Global"}</div>
                                            <div className="text-[10px] text-muted-foreground font-medium">ID: {question.workspace?.id.slice(0, 8) || "N/A"}...</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold">{question.author?.firstName} {question.author?.lastName}</div>
                                            <div className="text-[10px] text-muted-foreground font-medium">{question.author?.email}</div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <GlobalDeleteButton id={question.id} resourceName="Question" action={deleteGlobalQuestionAction} />
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
