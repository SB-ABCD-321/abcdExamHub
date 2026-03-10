"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateStudentInterests(interests: string[]) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await db.user.update({
            where: { clerkId: userId },
            data: { interests }
        });

        revalidatePath("/student");
        return { success: true };
    } catch (error) {
        console.error("Failed to update interests:", error);
        return { success: false, error: "Failed to update interests" };
    }
}

export async function submitWorkspaceApplication(data: any) {
    // In a real SAAS, this would create an Application record or send an email.
    // For now, we simulate success for the UI demo.
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true };
}
