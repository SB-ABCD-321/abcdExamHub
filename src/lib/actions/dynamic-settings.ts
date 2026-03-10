"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Site Settings ---
export async function updateSiteSettings(formData: FormData) {
    try {
        let settings = await db.siteSetting.findFirst();
        if (!settings) {
            settings = await db.siteSetting.create({ data: {} });
        }

        const data = {
            siteName: formData.get("siteName") as string,
            siteDescription: formData.get("siteDescription") as string,
            logoUrl: formData.get("logoUrl") as string,
            faviconUrl: formData.get("faviconUrl") as string,
            primaryColor: formData.get("primaryColor") as string,
            secondaryColor: formData.get("secondaryColor") as string,
            bannerText: formData.get("bannerText") as string,
            mobileNo: formData.get("mobileNo") as string,
            whatsappNo: formData.get("whatsappNo") as string,
            email: formData.get("email") as string,
            location: formData.get("location") as string,
            facebookUrl: formData.get("facebookUrl") as string,
            twitterUrl: formData.get("twitterUrl") as string,
            linkedinUrl: formData.get("linkedinUrl") as string,
            instagramUrl: formData.get("instagramUrl") as string,
            youtubeUrl: formData.get("youtubeUrl") as string,
            heroTitle: formData.get("heroTitle") as string,
            heroSubtitle: formData.get("heroSubtitle") as string,
            heroVideoUrl: formData.get("heroVideoUrl") as string,
            aboutUsTitle: formData.get("aboutUsTitle") as string,
            aboutUsText: formData.get("aboutUsText") as string,
            aboutUsImageUrl: formData.get("aboutUsImageUrl") as string,
            whyUsText: formData.get("whyUsText") as string,
            footerText: formData.get("footerText") as string,
        };

        await db.siteSetting.update({
            where: { id: settings.id },
            data,
        });

        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Banners ---
export async function addBanner(data: { imageUrl: string; title?: string; subtitle?: string; linkUrl?: string; order?: number }) {
    try {
        await db.banner.create({ data });
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteBanner(id: string) {
    try {
        await db.banner.delete({ where: { id } });
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- FAQs ---
export async function addFAQ(data: { question: string; answer: string; order?: number; isDefault?: boolean }) {
    try {
        await db.faq.create({ data });
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteFAQ(id: string) {
    try {
        await db.faq.delete({ where: { id } });
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Pricing Plans ---
export async function addPricingPlan(data: { name: string; price: number; duration: string; features: string[]; isPopular?: boolean; order?: number }) {
    try {
        await db.pricingPlan.create({ data });
        revalidatePath("/pricing");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deletePricingPlan(id: string) {
    try {
        await db.pricingPlan.delete({ where: { id } });
        revalidatePath("/pricing");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Inquiries ---
export async function submitInquiry(data: { name: string; email: string; phone?: string; whatsapp?: string; subject?: string; message: string }) {
    try {
        await db.inquiry.create({ data });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Call Bookings ---
export async function bookCall(data: { name: string; email: string; phone: string; date: Date; timeSlot: string }) {
    try {
        await db.callBooking.create({ data });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
