"use server"; // Documentation Item Sync Trigger

import { db } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { DEFAULT_GUIDES } from "@/lib/guide-defaults";
import { revalidatePath } from "next/cache";

export async function getGuideByRole(role: Role) {
    try {
        const guide = await (db as any).userGuide.findUnique({
            where: { role },
            include: {
                items: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!guide) {
            return DEFAULT_GUIDES[role];
        }

        return guide;
    } catch (error) {
        console.error("Error fetching guide:", error);
        return DEFAULT_GUIDES[role];
    }
}

export async function upsertGuide(data: {
    role: Role;
    title: string;
    description?: string;
    icon?: string;
    items: { title: string; description: string }[];
}) {
    try {
        const result = await (db as any).$transaction(async (tx: any) => {
            // First upsert the guide
            const guide = await tx.userGuide.upsert({
                where: { role: data.role },
                update: {
                    title: data.title,
                    description: data.description,
                    icon: data.icon,
                },
                create: {
                    role: data.role,
                    title: data.title,
                    description: data.description,
                    icon: data.icon,
                },
            });

            // Delete existing items to replace with new ones
            await tx.userGuideItem.deleteMany({
                where: { guideId: guide.id }
            });

            // Create new items
            if (data.items.length > 0) {
                await tx.userGuideItem.createMany({
                    data: data.items.map((item, idx) => ({
                        guideId: guide.id,
                        title: item.title,
                        description: item.description,
                        order: idx,
                    })),
                });
            }

            return guide;
        });

        revalidatePath("/super-admin/settings");
        revalidatePath(`/${data.role.toLowerCase().replace('_', '-')}/guide`);
        return { success: true, guide: result };
    } catch (error) {
        console.error("Error upserting guide:", error);
        return { success: false, error: "Failed to save guide" };
    }
}

export async function deleteUserGuide(role: Role) {
    try {
        await (db as any).userGuide.delete({
            where: { role }
        });
        revalidatePath("/super-admin/settings");
        revalidatePath(`/${role.toLowerCase().replace('_', '-')}/guide`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting guide:", error);
        return { success: false, error: "Failed to delete guide" };
    }
}

export async function getAllDynamicGuides() {
    try {
        return await (db as any).userGuide.findMany({
            include: { items: true }
        });
    } catch (error) {
        console.error("Error fetching all guides:", error);
        return [];
    }
}
