"use server"

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function joinWorkspaceAction(formData: FormData) {
    const workspaceId = formData.get("workspaceId") as string;
    const userId = formData.get("userId") as string;

    if (!workspaceId || !userId) {
        throw new Error("Missing required fields");
    }

    try {
        // Update the workspace to include this user in the students array
        await db.workspace.update({
            where: { id: workspaceId },
            data: {
                students: {
                    connect: { id: userId }
                }
            }
        });

        revalidatePath(`/join/${workspaceId}`);
        revalidatePath("/student");
    } catch (error) {
        console.error("Error joining workspace:", error);
        throw new Error("Failed to join workspace.");
    }

    // Redirect to the student dashboard upon success
    redirect("/student");
}
