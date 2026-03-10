"use server"

import { db } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

// Check authorization helper
async function requireSuperAdmin() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        select: { role: true }
    });

    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
        throw new Error("Must be Super Admin to perform this action");
    }
}

export async function deleteUserAction(targetId: string) {
    try {
        await requireSuperAdmin();

        await db.user.delete({
            where: { id: targetId }
        })
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function updateUserRoleAction(targetId: string, newRole: "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT") {
    try {
        await requireSuperAdmin();

        if (newRole === "SUPER_ADMIN") {
            const { userId } = await auth();
            const dbActor = await db.user.findUnique({
                where: { clerkId: userId! },
                select: { email: true }
            });
            const developerEmail = process.env.DEVELOPER_EMAIL || "developer@abcd.com";

            if (!dbActor || dbActor.email.toLowerCase() !== developerEmail.toLowerCase()) {
                throw new Error("Only the developer can grant SUPER_ADMIN privileges");
            }
        }

        await db.user.update({
            where: { id: targetId },
            data: { role: newRole }
        })
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}
