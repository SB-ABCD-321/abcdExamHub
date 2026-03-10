"use server"

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function promoteStudentToTeacherAction(studentId: string, workspaceId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const adminUser = await db.user.findUnique({
            where: { clerkId: userId },
            include: { adminWorkspace: true }
        });

        if (!adminUser || !adminUser.adminWorkspace || adminUser.adminWorkspace.id !== workspaceId) {
            return { success: false, error: "Unauthorized: You must be the admin of this workspace." };
        }

        const targetUser = await db.user.findUnique({
            where: { id: studentId },
            include: { studentWorkspaces: true, teacherWorkspaces: true }
        });

        if (!targetUser) {
            return { success: false, error: "Target user not found." };
        }

        // Technically, a user can be both a student of ONE workspace and a teacher of ANOTHER.
        // But for this workspace, we move them from student -> teacher.

        await db.$transaction([
            // Update role to at least TEACHER if they are currently just a STUDENT
            db.user.update({
                where: { id: studentId },
                data: {
                    role: targetUser.role === "STUDENT" ? "TEACHER" : targetUser.role
                }
            }),
            // Connect to teacherWorkspaces and disconnect from studentWorkspaces for this specific workspace
            db.workspace.update({
                where: { id: workspaceId },
                data: {
                    teachers: { connect: { id: studentId } },
                    students: { disconnect: { id: studentId } }
                }
            })
        ]);

        revalidatePath("/admin/students");
        revalidatePath("/admin/teachers");
        return { success: true };

    } catch (error: any) {
        console.error("Promotion error:", error);
        return { success: false, error: "Failed to promote user." };
    }
}
