"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
    getAvailableSlots as getSlots,
    bookAppointment,
} from "@/actions/bookings";

export async function submitSupportInquiry(formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const whatsapp = formData.get("whatsapp") as string;
        const subject = formData.get("subject") as string;
        const message = formData.get("message") as string;

        // Save as Inquiry
        await db.inquiry.create({
            data: {
                name,
                email,
                phone,
                whatsapp,
                subject,
                message,
            }
        });

        revalidatePath("/", "layout");
        revalidatePath("/super-admin/inquiries");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function bookCallAppointment(formData: FormData) {
    return await bookAppointment(formData);
}

export async function getAvailableSlots(dateStr: string) {
    return await getSlots(dateStr);
}

export async function getSupportSettings() {
    try {
        const settings = await db.siteSetting.findFirst();
        return {
            location: settings?.location || "Kolkata, India (HQ)",
            whatsappNo: settings?.whatsappNo || "918944899747",
        };
    } catch (error) {
        console.error("Failed to fetch support settings:", error);
        return {
            location: "Kolkata, India (HQ)",
            whatsappNo: "918944899747",
        };
    }
}
