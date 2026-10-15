import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QuestionForm } from "@/components/teacher/QuestionForm";
import { BulkQuestionForm } from "@/components/teacher/BulkQuestionForm";
import { AiQuestionGeneratorTab } from "../AiGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Layers, Sparkles, ArrowLeft } from "lucide-react";
import { DashboardPage } from "@/components/layout/DashboardTemplate";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewQuestionPage(props: {
    searchParams?: Promise<{ tab?: string }>;
}) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const searchParams = props.searchParams ? await props.searchParams : {};
    const defaultTab = searchParams.tab === "bulk" ? "bulk" : searchParams.tab === "ai" ? "ai" : "single";

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { teacherWorkspaces: true, adminWorkspace: true }
    });

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    const workspaces = dbUser.teacherWorkspaces;
    if (dbUser.role === "ADMIN" && dbUser.adminWorkspace) {
        if (!workspaces.find(w => w.id === dbUser.adminWorkspace!.id)) {
            workspaces.push(dbUser.adminWorkspace);
        }
    }

    const backHref = dbUser.role === "ADMIN" ? "/admin/questions" : "/teacher/questions";

    if (workspaces.length === 0) {
        return (
            <DashboardPage>
                <div className="p-12 text-center rounded-2xl border border-dashed border-border/70 bg-card/60">
                    <p className="text-sm font-semibold text-muted-foreground">
                        You must be assigned to at least one institute workspace to author questions.
                    </p>
                </div>
            </DashboardPage>
        );
    }

    const topics = await db.topic.findMany({
        where: { OR: [{ workspaceId: { in: workspaces.map(w => w.id) } }, { isGlobal: true }] },
        orderBy: { name: "asc" }
    });

    // Evaluate AI Quotas for this teacher/workspace
    const primaryWorkspace = workspaces[0];
    let effectiveLimit = primaryWorkspace?.aiLimit || 10;
    let effectiveUsage = primaryWorkspace?.aiGenerationsCount || 0;
    let effectiveUnlimited = primaryWorkspace?.aiUnlimited || false;

    if (dbUser.role === "TEACHER" && primaryWorkspace) {
        const teacherUsage = await (db as any).teacherWorkspaceUsage.findUnique({
            where: {
                workspaceId_teacherId: {
                    workspaceId: primaryWorkspace.id,
                    teacherId: dbUser.id
                }
            }
        });
        if (teacherUsage) {
            effectiveLimit = teacherUsage.aiLimit;
            effectiveUsage = teacherUsage.aiGenerationsCount;
        } else {
            effectiveLimit = 5;
            effectiveUsage = 0;
        }
    }

    return (
        <DashboardPage>
            <div className="max-w-5xl mx-auto w-full pt-1">
                <Tabs defaultValue={defaultTab} className="w-full space-y-4">
                    {/* TOP CONTROLS BAR: TABS ON LEFT, BACK BUTTON ON RIGHT */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
                        <TabsList className="bg-muted/40 p-1 h-auto rounded-2xl border border-border/60">
                            <TabsTrigger
                                value="single"
                                className="rounded-xl px-4 sm:px-5 py-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-2xs flex items-center gap-2"
                            >
                                <Lightbulb className="w-3.5 h-3.5" />
                                <span>Single Question</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="bulk"
                                className="rounded-xl px-4 sm:px-5 py-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-2xs flex items-center gap-2"
                            >
                                <Layers className="w-3.5 h-3.5" />
                                <span>Bulk Import</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="ai"
                                className="rounded-xl px-4 sm:px-5 py-2 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 data-[state=active]:shadow-2xs flex items-center gap-2"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                                <span>Generate with AI</span>
                            </TabsTrigger>
                        </TabsList>

                        <Link href={backHref}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 border-border/70 text-foreground hover:bg-muted/50"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Back to Question Bank</span>
                            </Button>
                        </Link>
                    </div>

                    <TabsContent value="single" className="mt-0 outline-none">
                        <QuestionForm topics={topics} workspaces={workspaces} backHref={backHref} />
                    </TabsContent>

                    <TabsContent value="bulk" className="mt-0 outline-none">
                        <BulkQuestionForm topics={topics} workspaces={workspaces} />
                    </TabsContent>

                    <TabsContent value="ai" className="mt-0 outline-none">
                        <AiQuestionGeneratorTab
                            topics={topics}
                            workspaces={workspaces}
                            workspaceId={primaryWorkspace.id}
                            aiGenerationsCount={effectiveUsage}
                            aiLimit={effectiveLimit}
                            aiUnlimited={effectiveUnlimited}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardPage>
    );
}
