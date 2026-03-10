import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QuestionForm } from "@/components/teacher/QuestionForm";

export default async function EditQuestionPage(props: { params: Promise<{ questionId: string }> }) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // We await params due to Next 15 dynamic router changes
    const params = await props.params;
    const questionId = params.questionId;

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { teacherWorkspaces: true }
    });

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        return <div>Unauthorized</div>;
    }

    // Fetch the question directly to ensure it exists and belongs to a workspace this user can access
    const question = await db.question.findUnique({
        where: { id: questionId },
        include: { topic: true }
    });

    if (!question) {
        return <div>Question not found.</div>;
    }

    // Security Verification: Can they edit this?
    // If Admin/Super Admin -> yes. If purely Teacher -> only if authorId matches.
    if (dbUser.role === "TEACHER" && question.authorId !== dbUser.id) {
        return <div className="p-8 text-center text-red-500 font-semibold">Access Denied: You did not author this question.</div>;
    }

    // Define workspace context for the dropdown options
    let workspaceIds = dbUser.teacherWorkspaces.map(w => w.id);
    if (dbUser.role === "ADMIN") {
        const adminWorkspace = await db.workspace.findUnique({ where: { adminId: dbUser.id } });
        if (adminWorkspace) workspaceIds.push(adminWorkspace.id);
    }

    // Safety fallback - if somehow the logic allows an editor entirely outside the workspace
    if (!workspaceIds.includes(question.workspaceId!)) {
        return <div>Access Denied: Workspace mismatch.</div>;
    }

    const topics = await db.topic.findMany({
        where: { workspaceId: { in: workspaceIds } },
        orderBy: { name: 'asc' }
    });

    const workspaces = await db.workspace.findMany({
        where: { id: { in: workspaceIds } }
    });

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Edit Question</h1>
                <p className="text-muted-foreground">Modify the details of your existing question.</p>
            </div>

            <div className="mt-8">
                <QuestionForm
                    topics={topics}
                    workspaces={workspaces}
                    initialData={question}
                />
            </div>
        </div>
    )
}