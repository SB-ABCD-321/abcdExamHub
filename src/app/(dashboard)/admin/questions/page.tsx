import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, Layers, ImageIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { AiQuestionGenerator } from "../../teacher/questions/AiGenerator";
import { QuestionListClient } from "@/components/teacher/QuestionListClient";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";

export default async function AdminQuestionsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { adminWorkspace: true, teacherWorkspaces: true }
    });

    if (!dbUser || dbUser.role !== "ADMIN" || !dbUser.adminWorkspace) {
        redirect("/dashboard");
    }

    const workspace = dbUser.adminWorkspace;
    const accessibleWorkspaceIds = [workspace.id, ...dbUser.teacherWorkspaces.map(w => w.id)];

    // Fetch topics containing questions from this workspace, affiliated teaching workspaces, and public platform questions
    const topics = await db.topic.findMany({
        where: { 
            OR: [
                { workspaceId: { in: accessibleWorkspaceIds } },
                { workspaceId: null },
                { isGlobal: true },
                { questions: { some: { isPublic: true } } }
            ]
        },
        include: {
            questions: {
                where: {
                    OR: [
                        { workspaceId: { in: accessibleWorkspaceIds } },
                        { workspaceId: null },
                        { authorId: dbUser.id },
                        { isPublic: true }
                    ]
                },
                include: {
                    author: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            imageUrl: true,
                        }
                    },
                    topic: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            author: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    // High-Density Metric Calculations (Strictly Numeric)
    const totalQuestions = topics.reduce((acc, t) => acc + t.questions.length, 0);
    const totalTopics = topics.length;
    const withImagesCount = topics.reduce((acc, t) => acc + t.questions.filter(q => !!q.imageUrl).length, 0);
    const effectiveUsage = workspace.aiGenerationsCount || 0;
    const effectiveLimit = workspace.aiLimit || 10;

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>{workspace.name} <span className="text-primary font-black">Question Bank</span></>}
                subtitle="Institutional question inventory, faculty authored items, and automated AI generation pipelines."
                actions={
                    <div className="flex items-center gap-2.5">
                        <AiQuestionGenerator
                            topics={topics}
                            workspaceId={workspace.id}
                            aiGenerationsCount={effectiveUsage}
                            aiLimit={effectiveLimit}
                            aiUnlimited={workspace.aiUnlimited}
                        />
                        <Link href="/teacher/questions/new">
                            <Button size="sm" className="h-9 px-3.5 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5 transition-all">
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Create Question</span>
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* HIGH-DENSITY ANALYTICAL NUMERIC KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Curated Questions"
                    value={totalQuestions}
                    subtitle={`${totalTopics} subject topics categorized`}
                    icon={<BookOpen className="size-4 text-primary" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {totalQuestions} Items
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Subject Chapters"
                    value={totalTopics}
                    subtitle="Institutional curriculum topics"
                    icon={<Layers className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {totalTopics} Topics
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Illustrated Items"
                    value={withImagesCount}
                    subtitle="Diagram & visual problem items"
                    icon={<ImageIcon className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {withImagesCount} Visuals
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="AI Generations"
                    value={effectiveUsage}
                    subtitle={workspace.aiUnlimited ? "Unlimited generations active" : `${Math.max(0, effectiveLimit - effectiveUsage)} remaining`}
                    icon={<Sparkles className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {effectiveUsage} Synthesized
                        </span>
                    }
                />
            </div>

            {/* ADVANCED MULTI-VIEW QUESTION LIST CLIENT */}
            <div className="w-full">
                <QuestionListClient topics={topics} />
            </div>
        </DashboardPage>
    );
}
