import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QuestionForm } from "@/components/teacher/QuestionForm";
import { BulkQuestionForm } from "@/components/teacher/BulkQuestionForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Layers } from "lucide-react";

export default async function NewQuestionPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { teacherWorkspaces: true }
    });

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    const workspaces = dbUser.teacherWorkspaces;
    if (dbUser.role === "ADMIN") {
        const adminWorkspace = await db.workspace.findUnique({ where: { adminId: dbUser.id } });
        if (adminWorkspace && !workspaces.find(w => w.id === adminWorkspace.id)) {
            workspaces.push(adminWorkspace);
        }
    }

    if (workspaces.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                You must be assigned to at least one institute workspace to create questions.
            </div>
        )
    }

    const topics = await db.topic.findMany({
        where: { OR: [{ workspaceId: { in: workspaces.map(w => w.id) } }, { isGlobal: true }] }
    });

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Knowledge Generation</h1>
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Expand your institute&apos;s digital question bank</p>
            </div>

            <Tabs defaultValue="single" className="w-full">
                <div className="flex items-center justify-between gap-4 mb-8">
                    <TabsList className="bg-slate-100/50 dark:bg-zinc-800/50 p-1 h-auto rounded-2xl border border-slate-200 dark:border-zinc-800">
                        <TabsTrigger value="single" className="rounded-xl px-6 py-2.5 text-xs font-bold tracking-tight data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-sm flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> Standard Creation
                        </TabsTrigger>
                        <TabsTrigger value="bulk" className="rounded-xl px-6 py-2.5 text-xs font-bold tracking-tight data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-sm flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Bulk Import
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="single" className="mt-0 outline-none">
                    <div className="max-w-3xl">
                        <QuestionForm topics={topics} workspaces={workspaces} />
                    </div>
                </TabsContent>

                <TabsContent value="bulk" className="mt-0 outline-none">
                    <BulkQuestionForm topics={topics} workspaces={workspaces} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
