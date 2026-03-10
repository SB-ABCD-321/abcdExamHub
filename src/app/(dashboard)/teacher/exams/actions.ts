"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ExamStatus } from "@prisma/client";

export async function updateExamStatus(examId: string, status: ExamStatus) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized");
    }

    try {
        await db.exam.update({
            where: { id: examId },
            data: { status }
        });

        revalidatePath("/teacher/exams");
        return { success: true };
    } catch (error) {
        console.error("Failed to update exam status:", error);
        return { success: false, error: "Failed to update exam status" };
    }
}

export async function clearExamHistory(examId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized");
    }

    try {
        // Delete all exam results and drafts for this specific exam
        await db.examResult.deleteMany({
            where: { examId }
        });

        await db.examDraft.deleteMany({
            where: { examId }
        });

        revalidatePath("/teacher/exams");
        return { success: true };
    } catch (error) {
        console.error("Failed to clear exam history:", error);
        return { success: false, error: "Failed to clear exam history" };
    }
}
