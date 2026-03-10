import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileQuestion } from "lucide-react";
import Link from "next/link";
import { AiQuestionGenerator } from "./AiGenerator";
import { QuestionListClient } from "@/components/teacher/QuestionListClient";

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
        if (adminWorkspace) workspaceIds.push(adminWorkspace.id);
    }

    // Explicitly fetch the primary workspace configuration to get AI quotas
    const primaryWorkspace = await db.workspace.findUnique({
        where: { id: workspaceIds[0] },
    });

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
            effectiveLimit = 5; // Default teacher limit
            effectiveUsage = 0;
        }
    }

    // Fetch topics containing their related questions so the teacher can see categorized accordion items
    const topics = await db.topic.findMany({
        where: { workspaceId: { in: workspaceIds } },
        include: {
            questions: {
                where: questionFilter,
                orderBy: { createdAt: 'desc' }
            }
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                        Question <span className="text-primary">Bank</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                        Manage your repository of questions for building exams.
                    </p>
                </div>
                <div className="flex items-center gap-3">
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
                        <Button className="flex items-center gap-2 h-11 px-5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground">
                            <PlusCircle className="w-4 h-4" />
                            Manual Creation
                        </Button>
                    </Link>
                </div>
            </div>

            <QuestionListClient topics={topics} />
        </div>
    );
}
