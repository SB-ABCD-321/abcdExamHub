"use server"

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPricingPlans() {
    try {
        const plans = await db.pricingPlan.findMany({
            orderBy: { order: 'asc' },
            where: { isActive: true }
        });
        return plans;
    } catch (error: any) {
        console.error("DEBUG: Pricing fetch failed:", error);
        // Important: return an empty array on error so UI doesn't crash
        // but the error is logged.
        return [];
    }
}

export async function getAllPricingPlans() {
    return await db.pricingPlan.findMany({
        orderBy: { order: 'asc' }
    });
}

export async function getPricingSettings() {
    const settings = await db.siteSetting.findFirst();
    return {
        pricingTitle: settings?.pricingTitle || "Invest in Academic Excellence",
        pricingSubtitle: settings?.pricingSubtitle || "Smart plans crafted to grow with digital education.",
        freeMaxStudents: settings?.freeMaxStudents || 50,
        freeMaxTeachers: settings?.freeMaxTeachers || 1,
        freeMaxExams: settings?.freeMaxExams || 3,
        freeMaxStudentsPerExam: settings?.freeMaxStudentsPerExam || 20,
        freeAiLimit: settings?.freeAiLimit || 3,
        freeAiQuestionsPerRequest: settings?.freeAiQuestionsPerRequest || 10,
        freeMaxQuestions: settings?.freeMaxQuestions || 100,
        freeMaxConcurrentExams: settings?.freeMaxConcurrentExams || 20,
    };
}

export async function upsertPricingPlan(data: any) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (dbUser?.role !== "SUPER_ADMIN") throw new Error("Forbidden");

    const { id, ...rest } = data;
    if (id) {
        await db.pricingPlan.update({
            where: { id },
            data: rest
        });
    } else {
        await db.pricingPlan.create({
            data: rest
        });
    }
    revalidatePath("/pricing");
    revalidatePath("/super-admin/pricing");
}

export async function deletePricingPlan(id: string) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (dbUser?.role !== "SUPER_ADMIN") throw new Error("Forbidden");

    await db.pricingPlan.deleteMany({
        where: { id }
    });
    revalidatePath("/pricing");
    revalidatePath("/super-admin/pricing");
}

export async function updatePricingSettings(data: { title: string, subtitle: string }) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (dbUser?.role !== "SUPER_ADMIN") throw new Error("Forbidden");

    const settings = await db.siteSetting.findFirst();
    if (settings) {
        await db.siteSetting.update({
            where: { id: settings.id },
            data: {
                pricingTitle: data.title,
                pricingSubtitle: data.subtitle
            }
        });
    } else {
        await db.siteSetting.create({
            data: {
                pricingTitle: data.title,
                pricingSubtitle: data.subtitle
            }
        });
    }
    revalidatePath("/pricing");
    revalidatePath("/super-admin/settings");
}
