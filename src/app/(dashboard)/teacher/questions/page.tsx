import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, Layers, ImageIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { AiQuestionGenerator } from "./AiGenerator";
import { QuestionListClient } from "@/components/teacher/QuestionListClient";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";

export default async function TeacherQuestionsPage() {
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
        if (adminWorkspace && !workspaceIds.includes(adminWorkspace.id)) {
            workspaceIds.push(adminWorkspace.id);
        }
    }

    // Explicitly fetch the primary workspace configuration to get AI quotas
    const primaryWorkspace = workspaceIds.length > 0 
        ? await db.workspace.findUnique({ where: { id: workspaceIds[0] } })
        : null;

    // Filter questions if the user is only a Teacher (not an Admin)
    const isPureTeacher = dbUser.role === "TEACHER";
    const questionFilter = isPureTeacher ? { authorId: dbUser.id } : {};

    let effectiveLimit = (primaryWorkspace as any)?.aiLimit || 10;
    let effectiveUsage = primaryWorkspace?.aiGenerationsCount || 0;

    if (isPureTeacher && primaryWorkspace) {
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

    // Fetch topics containing full question metadata (including affiliated and public curriculum items)
    const topics = await db.topic.findMany({
        where: {
            OR: [
                { workspaceId: { in: workspaceIds } },
                { workspaceId: null },
                { isGlobal: true },
                { questions: { some: { isPublic: true } } }
            ]
        },
        include: {
            questions: {
                where: {
                    OR: [
                        { workspaceId: { in: workspaceIds } },
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

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Question <span className="text-primary font-black">Bank</span></>}
                subtitle="Centralized curriculum repository, item authoring, and assessment taxonomy pipelines."
                actions={
                    <div className="flex items-center gap-2.5">
                        {primaryWorkspace && (
                            <AiQuestionGenerator
                                topics={topics}
                                workspaceId={primaryWorkspace.id}
                                aiGenerationsCount={effectiveUsage}
                                aiLimit={effectiveLimit}
                                aiUnlimited={primaryWorkspace.aiUnlimited}
                            />
                        )}
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
                    title="Repository Pool"
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
                    subtitle="Organized curriculum topics"
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
                    subtitle={primaryWorkspace?.aiUnlimited ? "Unlimited generations plan" : `${Math.max(0, effectiveLimit - effectiveUsage)} quota remaining`}
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
