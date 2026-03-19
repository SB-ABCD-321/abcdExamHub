import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const bulkSchema = z.object({
    questions: z.array(z.object({
        text: z.string().min(1),
        options: z.array(z.string().min(1)).min(2),
        correctAnswer: z.string().min(1),
        topicId: z.string().min(1),
        workspaceId: z.string().min(1),
        isPublic: z.boolean().default(false),
    }))
});

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { questions } = bulkSchema.parse(body);

        if (questions.length === 0) return NextResponse.json({ success: true, count: 0 });

        // Verify user
        const dbUser = await db.user.findUnique({
            where: { clerkId: userId },
            include: { teacherWorkspaces: true }
        });

        if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // We assume all questions in one bulk request belong to the same workspace for authorization simplicity,
        // or we check each. Let's check the first one's workspace as they are usually the same.
        const targetWorkspaceId = questions[0].workspaceId;

        let isAuthorized = false;
        if (dbUser.role === "SUPER_ADMIN") isAuthorized = true;
        if (dbUser.role === "ADMIN") {
            const adminSpace = await db.workspace.findUnique({ where: { adminId: dbUser.id } });
            if (adminSpace?.id === targetWorkspaceId) isAuthorized = true;
        }
        if (dbUser.teacherWorkspaces.some(w => w.id === targetWorkspaceId)) isAuthorized = true;

        if (!isAuthorized) {
            return new NextResponse("Not authorized for the selected workspace", { status: 403 });
        }

        // Check workspace status — block if PAUSED or SUSPENDED
        const targetWorkspace = await (db as any).workspace.findUnique({
            where: { id: targetWorkspaceId },
            select: { status: true, name: true }
        });
        if (!targetWorkspace) return new NextResponse("Workspace not found", { status: 404 });
        const wsStatus = (targetWorkspace as any).status;
        if (wsStatus === "SUSPENDED") {
            return new NextResponse("This workspace has been suspended. Contact the platform administrator.", { status: 403 });
        }
        if (wsStatus === "PAUSED") {
            return new NextResponse("This workspace is currently paused. Creating new content is disabled.", { status: 403 });
        }

        // Create questions in bulk
        const createdCount = await db.question.createMany({
            data: questions.map(q => ({
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                topicId: q.topicId,
                workspaceId: q.workspaceId,
                isPublic: q.isPublic,
                authorId: dbUser.id
            }))
        });

        return NextResponse.json({ success: true, count: createdCount.count });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(error.issues[0]?.message || "Invalid request data", { status: 422 });
        }
        console.error("[QUESTIONS_BULK_CREATE]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
