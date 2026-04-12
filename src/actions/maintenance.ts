"use server";

import { db } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { deleteFromCloudinary } from "@/app/actions/upload";
import { subDays } from "date-fns";

/**
 * Executes a full system maintenance cycle.
 * Targets: Expired notices, abandoned exam drafts, and old payment proofs.
 */
export async function runSystemMaintenance() {
    console.log("[MAINTENANCE] Starting system maintenance cycle...");
    const stats = {
        notices: 0,
        drafts: 0,
        paymentProofs: 0,
    };

    try {
        const fourteenDaysAgo = subDays(new Date(), 14);
        const sevenDaysAgo = subDays(new Date(), 7);

        // 1. Cleanup Expired Notices (14+ days old)
        const expiredNotices = await db.notice.deleteMany({
            where: {
                createdAt: { lt: fourteenDaysAgo }
            }
        });
        stats.notices = expiredNotices.count;

        // 2. Cleanup Abandoned Exam Drafts (Not updated in 7+ days)
        const abandonedDrafts = await db.examDraft.deleteMany({
            where: {
                updatedAt: { lt: sevenDaysAgo }
            }
        });
        stats.drafts = abandonedDrafts.count;

        // 3. Cleanup Expired Payment Proof Images (14+ days old)
        // Find payments (PAID or REJECTED) with proofs
        const expiredPayments = await db.workspacePayment.findMany({
            where: {
                submittedAt: { lt: fourteenDaysAgo },
                proofImageUrl: { not: null },
                status: { in: [PaymentStatus.PAID, PaymentStatus.REJECTED] }
            },
            select: { id: true, proofImageUrl: true }
        });

        for (const payment of expiredPayments) {
            if (payment.proofImageUrl) {
                // Delete from Cloudinary
                await deleteFromCloudinary(payment.proofImageUrl).catch(e => 
                    console.error(`[MAINTENANCE] Cloudinary deletion failed for ${payment.id}`, e)
                );
                
                // Clear association in DB
                await db.workspacePayment.update({
                    where: { id: payment.id },
                    data: { proofImageUrl: null }
                });
                stats.paymentProofs++;
            }
        }

        console.log(`[MAINTENANCE] Success: ${JSON.stringify(stats)}`);
        return { success: true, stats };
    } catch (error) {
        console.error("[MAINTENANCE] System maintenance failed", error);
        return { success: false, error: "Maintenance cycle encountered errors." };
    }
}
