"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getBookingSettings() {
    try {
        let settings = await db.bookingSetting.findFirst();
        if (!settings) {
            settings = await db.bookingSetting.create({
                data: {
                    workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
                    startTime: "09:00",
                    endTime: "17:00",
                    slotDuration: 30,
                    autoApprove: true,
                }
            });
        }
        return settings;
    } catch (error) {
        console.error("Failed to fetch booking settings:", error);
        return null;
    }
}

export async function updateBookingSettings(data: any) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (dbUser?.role !== "SUPER_ADMIN") return { success: false, error: "Forbidden" };

    try {
        const settings = await db.bookingSetting.findFirst();
        if (settings) {
            await db.bookingSetting.update({
                where: { id: settings.id },
                data: {
                    workingDays: data.workingDays,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    slotDuration: data.slotDuration,
                    autoApprove: data.autoApprove,
                }
            });
        }
        revalidatePath("/super-admin/bookings/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAvailableSlots(dateString: string) {
    try {
        const selectedDate = new Date(dateString);
        const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

        const settings = await getBookingSettings();
        if (!settings || !settings.workingDays.includes(dayName)) {
            return [];
        }

        const slots: string[] = [];
        let current = new Date(`${dateString}T${settings.startTime}`);
        const end = new Date(`${dateString}T${settings.endTime}`);

        // Fetch existing bookings for this date
        const startOfDay = new Date(dateString);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateString);
        endOfDay.setHours(23, 59, 59, 999);

        const existingBookings = await db.callBooking.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: { not: "CANCELLED" }
            }
        });

        const bookedSlots = existingBookings.map(b => b.timeSlot);

        while (current < end) {
            const timeString = current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            if (!bookedSlots.includes(timeString)) {
                slots.push(timeString);
            }
            current = new Date(current.getTime() + settings.slotDuration * 60000);
        }

        return slots;
    } catch (error) {
        console.error("Failed to calculate slots:", error);
        return [];
    }
}

export async function bookAppointment(formData: FormData) {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Authentication required. Please login to book a session." };

    try {
        const user = await db.user.findUnique({ where: { clerkId } });
        if (!user) return { success: false, error: "User profile not found." };

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const dateStr = formData.get("date") as string;
        const timeSlot = formData.get("timeSlot") as string;
        const notes = formData.get("notes") as string;

        await db.callBooking.create({
            data: {
                name,
                email,
                phone,
                userId: user.id,
                date: new Date(dateStr),
                timeSlot,
                notes,
            }
        });

        revalidatePath("/", "layout");
        revalidatePath("/support");
        revalidatePath("/super-admin/bookings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllBookings() {
    const { userId } = await auth();
    if (!userId) return [];

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (dbUser?.role !== "SUPER_ADMIN") return [];

    return await db.callBooking.findMany({
        orderBy: { date: 'desc' },
        include: { user: true }
    });
}

export async function updateBookingStatus(id: string, status: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };
    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (dbUser?.role !== "SUPER_ADMIN") return { success: false, error: "Forbidden" };

    try {
        await db.callBooking.update({
            where: { id },
            data: { status }
        });
        revalidatePath("/super-admin/bookings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function markBookingAsRead(id: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };
    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (dbUser?.role !== "SUPER_ADMIN") return { success: false, error: "Forbidden" };

    try {
        await db.callBooking.update({
            where: { id },
            data: { isRead: true }
        });
        revalidatePath("/", "layout");
        revalidatePath("/super-admin/bookings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteBooking(id: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };
    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (dbUser?.role !== "SUPER_ADMIN") return { success: false, error: "Forbidden" };

    try {
        await db.callBooking.delete({
            where: { id }
        });
        revalidatePath("/super-admin/bookings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
