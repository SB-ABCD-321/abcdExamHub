"use server"

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTopicAction(name: string, workspaceId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const dbUser = await db.user.findUnique({
            where: { clerkId: userId },
            include: { adminWorkspace: true, teacherWorkspaces: true }
        });

        if (!dbUser) {
            return { success: false, error: "User not found" };
        }

        // Validate access to workspace
        const hasAccess = dbUser.adminWorkspace?.id === workspaceId ||
            dbUser.teacherWorkspaces.some(w => w.id === workspaceId);

        if (!hasAccess) {
            return { success: false, error: "You do not have permission to add topics to this workspace." };
        }

        const newTopic = await db.topic.create({
            data: {
                name,
                workspaceId,
                isGlobal: false,
                authorId: dbUser.id
            }
        });

        revalidatePath("/teacher/topics");
        revalidatePath("/teacher/questions");

        return { success: true, topic: { id: newTopic.id, name: newTopic.name } };

    } catch (error: any) {
        console.error("Topic creation error:", error);
        return { success: false, error: "Failed to create topic." };
    }
}

export async function updateTopicAction(topicId: string, newName: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        const dbUser = await db.user.findUnique({
            where: { clerkId: userId },
            include: { adminWorkspace: true, teacherWorkspaces: true }
        });

        if (!dbUser) return { success: false, error: "User not found" };

        const topic = await db.topic.findUnique({ where: { id: topicId } });
        if (!topic) return { success: false, error: "Topic not found" };

        // Must be the author OR an admin of the workspace to edit it
        const isAuthor = topic.authorId === dbUser.id;
        const isAdmin = dbUser.adminWorkspace?.id === topic.workspaceId;

        if (!isAuthor && !isAdmin) {
            return { success: false, error: "You only have permission to edit topics you created." };
        }

        const updatedTopic = await db.topic.update({
            where: { id: topicId },
            data: { name: newName }
        });

        revalidatePath("/teacher/topics");
        revalidatePath("/teacher/questions");
        revalidatePath("/teacher/exams/new");

        return { success: true, topic: { id: updatedTopic.id, name: updatedTopic.name } };
    } catch (error: any) {
        console.error("Topic update error:", error);
        return { success: false, error: "Failed to rename topic." };
    }
}
