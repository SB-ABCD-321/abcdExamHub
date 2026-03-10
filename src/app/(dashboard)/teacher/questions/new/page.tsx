import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QuestionForm } from "@/components/teacher/QuestionForm";

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
        <div className="space-y-6 max-w-3xl">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Create a Question</h1>
                <p className="text-muted-foreground">Add a new multiple-choice question to your institute's question bank.</p>
            </div>

            <div className="mt-8">
                <QuestionForm topics={topics} workspaces={workspaces} />
            </div>
        </div>
    )
}
