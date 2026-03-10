"use server"

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTeacherAiLimitAction(workspaceId: string, teacherId: string, newLimit: number) {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
        if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
            return { success: false, error: "Unauthorized" };
        }

        const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
        if (!workspace || (dbUser.role !== "SUPER_ADMIN" && workspace.adminId !== dbUser.id)) {
            return { success: false, error: "Unauthorized workspace access" };
        }

        await db.teacherWorkspaceUsage.upsert({
            where: {
                workspaceId_teacherId: {
                    workspaceId,
                    teacherId,
                }
            },
            update: {
                aiLimit: newLimit,
            },
            create: {
                workspaceId,
                teacherId,
                aiLimit: newLimit,
                aiGenerationsCount: 0,
            }
        });

        revalidatePath("/admin/teachers");
        return { success: true };
    } catch (error) {
        console.error("Failed to update teacher AI limit:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
