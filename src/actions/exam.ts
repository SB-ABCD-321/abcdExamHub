"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function verifyExamPassword(examId: string, passwordCandidate: string) {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({
        where: { clerkId },
        include: { studentWorkspaces: true }
    });
    if (!dbUser) throw new Error("User not found");

    const exam = await db.exam.findUnique({
        where: { id: examId }
    });

    if (!exam) throw new Error("Exam not found");
    if (!(exam as any).password) return { success: true };

    if ((exam as any).password !== passwordCandidate) {
        return { success: false, error: "Invalid password" };
    }

    // Password correct! 
    // Now check if user is in workspace. If not, join them.
    const isMember = dbUser.studentWorkspaces.some(w => w.id === exam.workspaceId);
    
    if (!isMember) {
        await db.workspace.update({
            where: { id: exam.workspaceId },
            data: {
                students: {
                    connect: { id: dbUser.id }
                }
            }
        });
    }

    // Also connect to the exam's allowedStudents if it's private
    if (!exam.isPublic) {
        await db.exam.update({
            where: { id: exam.id },
            data: {
                allowedStudents: {
                    connect: { id: dbUser.id }
                }
            }
        });
    }

    revalidatePath(`/exam/${examId}`);
    return { success: true };
}
