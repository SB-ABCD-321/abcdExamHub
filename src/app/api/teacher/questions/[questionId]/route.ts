import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { z } from "zod";

const updateQuestionSchema = z.object({
    text: z.string().min(5, "Question text must be at least 5 characters"),
    topicId: z.string().min(1, "Topic is required"),
    workspaceId: z.string().min(1, "Workspace is required"),
    isPublic: z.boolean().default(false),
    options: z.array(z.string().min(1, "Option cannot be empty")).length(4, "Exactly 4 options are required"),
    correctAnswer: z.string().min(1, "Correct answer is required")
});

export async function PUT(
    request: Request,
    context: any
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        // We await params due to Next 15 dynamic router changes
        const params = await context.params;
        const questionId = params.questionId;

        const dbUser = await db.user.findUnique({
            where: { clerkId: userId },
            include: { adminWorkspace: true }
        });

        if (!dbUser) {
            return new Response("User not found in DB", { status: 404 });
        }

        // Fetch existing question to check permissions
        const existingQuestion = await db.question.findUnique({
            where: { id: questionId }
        });

        if (!existingQuestion) {
            return new Response("Question not found", { status: 404 });
        }

        // Security check: Teacher can only edit their own. Admins can edit anything in their workspace.
        const isAdminOfThisWorkspace = dbUser.adminWorkspace?.id === existingQuestion.workspaceId;

        if (dbUser.role === "TEACHER" && (existingQuestion as any).authorId !== dbUser.id) {
            return new Response("Forbidden: You did not author this question.", { status: 403 });
        }

        if (dbUser.role === "ADMIN" && !isAdminOfThisWorkspace) {
            return new Response("Forbidden: Question belongs to a workspace you do not manage.", { status: 403 });
        }

        // Parse and validate the incoming update body
        const body = await request.json();
        const payload = updateQuestionSchema.parse(body);

        // Ensure the correct answer is actually one of the options
        if (!payload.options.includes(payload.correctAnswer)) {
            return new Response("Correct answer must exactly match one of the options", { status: 400 });
        }

        const updatedQuestion = await db.question.update({
            where: { id: questionId },
            data: {
                text: payload.text,
                options: payload.options,
                correctAnswer: payload.correctAnswer,
                isPublic: payload.isPublic,
                topicId: payload.topicId,
                workspaceId: payload.workspaceId
            }
        });

        return new Response(JSON.stringify(updatedQuestion), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const zErr = error as any;
            return new Response(zErr.errors[0].message, { status: 400 });
        }
        return new Response("Internal Server Error", { status: 500 });
    }
}