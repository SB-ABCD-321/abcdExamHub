"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function reAllowStudent(resultId: string, examId: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        return { success: false, error: "Permission denied" };
    }

    try {
        await db.examResult.delete({ where: { id: resultId } });

        revalidatePath(`/teacher/exams/${examId}/results`);
        revalidatePath("/student/exams");
        revalidatePath("/student");

        return { success: true };
    } catch (error) {
        console.error("Re-allow Error:", error);
        return { success: false, error: "Failed to re-allow student" };
    }
}
