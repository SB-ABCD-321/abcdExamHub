import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QuestionForm } from "@/components/teacher/QuestionForm";
import { DashboardPage, DashboardHeader } from "@/components/layout/DashboardTemplate";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function EditQuestionPage(props: { params: Promise<{ questionId: string }> }) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // Next 15 dynamic router params
    const params = await props.params;
    const questionId = params.questionId;

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { teacherWorkspaces: true, adminWorkspace: true }
    });

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    // Fetch the question directly to ensure it exists and belongs to a workspace this user can access
    const question = await db.question.findUnique({
        where: { id: questionId },
        include: { topic: true, workspace: true }
    });

    if (!question) {
        redirect(dbUser.role === "ADMIN" ? "/admin/questions" : "/teacher/questions");
    }

    // Security Verification: Can they edit this?
    if (dbUser.role === "TEACHER" && question.authorId !== dbUser.id) {
        redirect("/teacher/questions");
    }

    // Define workspace context for the dropdown options
    let workspaceIds = dbUser.teacherWorkspaces.map(w => w.id);
    if (dbUser.role === "ADMIN" && dbUser.adminWorkspace) {
        if (!workspaceIds.includes(dbUser.adminWorkspace.id)) {
            workspaceIds.push(dbUser.adminWorkspace.id);
        }
    }

    if (!workspaceIds.includes(question.workspaceId!)) {
        redirect(dbUser.role === "ADMIN" ? "/admin/questions" : "/teacher/questions");
    }

    const topics = await db.topic.findMany({
        where: { workspaceId: { in: workspaceIds } },
        orderBy: { name: 'asc' }
    });

    const workspaces = await db.workspace.findMany({
        where: { id: { in: workspaceIds } }
    });

    const backHref = dbUser.role === "ADMIN" ? "/admin/questions" : "/teacher/questions";

    return (
        <DashboardPage>
            <div className="max-w-5xl mx-auto w-full pt-1 space-y-4">
                <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Editing Curriculum Item</span>
                        <span className="text-xs font-semibold text-foreground bg-muted/40 px-2.5 py-1 rounded-xl border border-border/60">
                            {question.topic?.name || "General Chapter"}
                        </span>
                    </div>

                    <Link href={backHref}>
                        <Button variant="outline" size="sm" className="h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 border-border/70 text-foreground hover:bg-muted/50">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Question Bank</span>
                        </Button>
                    </Link>
                </div>

                <QuestionForm
                    topics={topics}
                    workspaces={workspaces}
                    initialData={question}
                    backHref={backHref}
                />
            </div>
        </DashboardPage>
    );
}