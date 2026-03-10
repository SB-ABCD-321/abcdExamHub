import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
    studentId: z.string(),
});

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { studentId } = inputSchema.parse(body);

        // Verify the current user is an admin of a workspace
        const dbUser = await db.user.findUnique({
            where: { clerkId: userId },
            include: { adminWorkspace: true }
        });

        if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN") || !dbUser.adminWorkspace) {
            return new NextResponse("Forbidden - You do not own a workspace", { status: 403 });
        }

        const workspaceId = dbUser.adminWorkspace.id;

        // Verify the target user exists and is actually a student in this workspace
        const targetStudent = await db.user.findUnique({
            where: { id: studentId },
            include: { studentWorkspaces: true }
        });

        if (!targetStudent) {
            return new NextResponse("Target user not found", { status: 404 });
        }

        const isEnrolled = targetStudent.studentWorkspaces.some(w => w.id === workspaceId);
        if (!isEnrolled) {
            return new NextResponse("User is not a student in your workspace", { status: 400 });
        }

        // Transaction: Upgrade their role (if needed) and move them from workspace.students to workspace.teachers
        await db.$transaction(async (tx) => {
            if (targetStudent.role === "STUDENT") {
                await tx.user.update({
                    where: { id: studentId },
                    data: { role: "TEACHER" }
                });
            }

            // Disconnect from students array, connect to teachers array
            await tx.workspace.update({
                where: { id: workspaceId },
                data: {
                    students: {
                        disconnect: { id: studentId }
                    },
                    teachers: {
                        connect: { id: studentId }
                    }
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 422 });
        }
        console.error("[PROMOTE_TEACHER]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
