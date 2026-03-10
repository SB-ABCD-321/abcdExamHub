"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function verifySuperAdmin() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        select: { role: true }
    });

    if (!user || user.role !== "SUPER_ADMIN") {
        throw new Error("Forbidden: Super Admin access required");
    }
}

export async function deleteGlobalExamAction(examId: string) {
    try {
        await verifySuperAdmin();
        await db.exam.delete({
            where: { id: examId }
        });
        revalidatePath("/super-admin/exams");
        revalidatePath("/super-admin");
        return { success: true };
    } catch (error: any) {
        console.error("Delete Global Exam Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteGlobalQuestionAction(questionId: string) {
    try {
        await verifySuperAdmin();
        await db.question.delete({
            where: { id: questionId }
        });
        revalidatePath("/super-admin/questions");
        revalidatePath("/super-admin");
        return { success: true };
    } catch (error: any) {
        console.error("Delete Global Question Error:", error);
        return { success: false, error: error.message };
    }
}
