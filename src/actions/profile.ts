"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function completeProfile(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    if (!firstName || !lastName || !phoneNumber) {
        throw new Error("Missing required fields");
    }

    await (db as any).user.update({
        where: { clerkId: userId },
        data: {
            firstName,
            lastName,
            phoneNumber,
            isProfileComplete: true
        }
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
}
