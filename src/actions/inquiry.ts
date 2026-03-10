"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitInquiry(formData: FormData) {
    try {
        // Honeypot check for spam protection
        const honeypot = formData.get("address") as string;
        if (honeypot) {
            // Silently fail or return success to fool bots
            return { success: true, spam: true };
        }

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const subject = formData.get("subject") as string;
        const message = formData.get("message") as string;

        if (!name || !email || !message) {
            throw new Error("Name, Email, and Message are required.");
        }

        await db.inquiry.create({
            data: {
                name,
                email,
                phone,
                subject,
                message,
                status: "PENDING",
            }
        });

        revalidatePath("/super-admin/inquiries");
        return { success: true };
    } catch (error: any) {
        console.error("Inquiry submission error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateInquiryStatus(id: string, status: string) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };
    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (dbUser?.role !== "SUPER_ADMIN") return { success: false, error: "Forbidden" };

    try {
        await db.inquiry.update({
            where: { id },
            data: { status }
        });
        revalidatePath("/", "layout");
        revalidatePath("/super-admin/inquiries");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteInquiry(id: string) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };
    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (dbUser?.role !== "SUPER_ADMIN") return { success: false, error: "Forbidden" };

    try {
        await db.inquiry.delete({
            where: { id }
        });
        revalidatePath("/super-admin/inquiries");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
