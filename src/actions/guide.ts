"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

export async function getUserGuides(role?: string) {
    try {
        const whereClause = role ? { role: role as Role } : {};
        const guides = await db.userGuide.findMany({
            where: whereClause,
            orderBy: [{ order: "asc" }],
        });
        return { success: true, data: guides };
    } catch (error) {
        console.error("Error fetching user guides:", error);
        return { success: false, error: "Failed to fetch user guides" };
    }
}

export async function createUserGuide(data: { role: Role; title: string; content: string; order: number }) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const user = await db.user.findUnique({ where: { clerkId: userId } });
        if (!user || user.role !== "SUPER_ADMIN" || user.email !== process.env.DEVELOPER_EMAIL) {
            return { success: false, error: "Unauthorized: Developer access required" };
        }

        const newGuide = await db.userGuide.create({
            data: {
                ...data,
            },
        });

        revalidatePath("/super-admin/settings");
        revalidatePath("/super-admin/guide");
        revalidatePath("/admin/guide");
        revalidatePath("/teacher/guide");
        revalidatePath("/student/guide");

        return { success: true, data: newGuide };
    } catch (error) {
        console.error("Error creating user guide:", error);
        return { success: false, error: "Failed to create user guide" };
    }
}

export async function updateUserGuide(id: string, data: { role?: Role; title?: string; content?: string; order?: number }) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const user = await db.user.findUnique({ where: { clerkId: userId } });
        if (!user || user.role !== "SUPER_ADMIN" || user.email !== process.env.DEVELOPER_EMAIL) {
            return { success: false, error: "Unauthorized: Developer access required" };
        }

        const updatedGuide = await db.userGuide.update({
            where: { id },
            data,
        });

        revalidatePath("/super-admin/settings");
        revalidatePath("/super-admin/guide");
        revalidatePath("/admin/guide");
        revalidatePath("/teacher/guide");
        revalidatePath("/student/guide");

        return { success: true, data: updatedGuide };
    } catch (error) {
        console.error("Error updating user guide:", error);
        return { success: false, error: "Failed to update user guide" };
    }
}

export async function deleteUserGuide(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const user = await db.user.findUnique({ where: { clerkId: userId } });
        if (!user || user.role !== "SUPER_ADMIN" || user.email !== process.env.DEVELOPER_EMAIL) {
            return { success: false, error: "Unauthorized: Developer access required" };
        }

        await db.userGuide.delete({
            where: { id },
        });

        revalidatePath("/super-admin/settings");
        revalidatePath("/super-admin/guide");
        revalidatePath("/admin/guide");
        revalidatePath("/teacher/guide");
        revalidatePath("/student/guide");

        return { success: true };
    } catch (error) {
        console.error("Error deleting user guide:", error);
        return { success: false, error: "Failed to delete user guide" };
    }
}
