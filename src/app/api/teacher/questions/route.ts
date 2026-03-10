import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const questionSchema = z.object({
    text: z.string().min(5),
    topicId: z.string().min(1),
    workspaceId: z.string().min(1),
    isPublic: z.boolean().default(false),
    options: z.array(z.string().min(1)).min(2),
    correctAnswer: z.string().min(1)
});

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const payload = questionSchema.parse(body);

        // Verify user is valid staff
        const dbUser = await db.user.findUnique({
            where: { clerkId: userId },
            include: { teacherWorkspaces: true }
        });

        if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Verify the user is authorized to create questions in this workspace
        const hasAccess = dbUser.role === "SUPER_ADMIN"
            || (dbUser.role === "ADMIN" && dbUser.id === payload.workspaceId) // Wait, workspace mapping check below
            || dbUser.teacherWorkspaces.some(w => w.id === payload.workspaceId);

        // Accurate admin check:
        let isAuthorized = false;
        if (dbUser.role === "SUPER_ADMIN") isAuthorized = true;
        if (dbUser.role === "ADMIN") {
            const adminSpace = await db.workspace.findUnique({ where: { adminId: dbUser.id } });
            if (adminSpace?.id === payload.workspaceId) isAuthorized = true;
        }
        if (dbUser.teacherWorkspaces.some(w => w.id === payload.workspaceId)) isAuthorized = true;

        if (!isAuthorized) {
            return new NextResponse("Not authorized for this workspace", { status: 403 });
        }

        const question = await db.question.create({
            data: {
                text: payload.text,
                options: payload.options,
                correctAnswer: payload.correctAnswer,
                isPublic: payload.isPublic,
                topicId: payload.topicId,
                workspaceId: payload.workspaceId,
                authorId: dbUser.id // Track the creator!
            }
        });

        return NextResponse.json({ success: true, question });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(error.issues[0]?.message || "Invalid request data", { status: 422 });
        }
        console.error("[QUESTION_CREATE]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
