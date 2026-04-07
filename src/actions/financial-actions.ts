"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentStatus, TransactionType } from "@prisma/client";

/**
 * Internal helper to apply a pricing plan's infrastructure limits to a workspace.
 * This is used by both new workspace approvals and manual renewals.
 */
export async function applyPricingPlanToWorkspace(
    workspaceId: string,
    planId: string,
    duration: string, // '1M', '6M', '12M'
    paymentMethod: string = "Cash",
    customAmount?: number,
    customPaymentDate?: Date
) {
    try {
        const [workspace, plan, settings] = await Promise.all([
            db.workspace.findUnique({ where: { id: workspaceId } }),
            db.pricingPlan.findUnique({ where: { id: planId } }),
            db.siteSetting.findFirst()
        ]);

        if (!workspace || !plan) throw new Error("Workspace or Plan not found");

        const paymentDate = customPaymentDate || new Date();
        let baseAmount = 0;
        let daysToAdd = 30;
        let maxStudents = 0;
        let maxTeachers = 0;
        let maxExams = 0;
        let aiLimit = 0;

        // Extract limits based on duration
        if (duration === '1M') {
            baseAmount = plan.price1Month;
            daysToAdd = 30;
            maxStudents = plan.maxStudents1Month;
            maxTeachers = plan.maxTeachers1Month;
            maxExams = plan.maxExams1Month;
            aiLimit = plan.aiLimit1Month;
        } else if (duration === '6M') {
            baseAmount = plan.price6Month;
            daysToAdd = 180;
            maxStudents = plan.maxStudents6Month;
            maxTeachers = plan.maxTeachers6Month;
            maxExams = plan.maxExams6Month;
            aiLimit = plan.aiLimit6Month;
        } else if (duration === '12M') {
            baseAmount = plan.price12Month;
            daysToAdd = 365;
            maxStudents = plan.maxStudents12Month;
            maxTeachers = plan.maxTeachers12Month;
            maxExams = plan.maxExams12Month;
            aiLimit = plan.aiLimit12Month;
        }

        // Allow manual amount override (for cash discounts, etc.)
        if (customAmount !== undefined) {
            baseAmount = customAmount;
        }

        // Calculate GST
        let gstAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let totalAmount = baseAmount;

        if (settings?.isGstEnabled) {
            const gstRate = settings.gstRate || 18;
            gstAmount = baseAmount * (gstRate / 100);
            cgstAmount = gstAmount / 2;
            sgstAmount = gstAmount / 2;
            totalAmount = baseAmount + gstAmount;
        }

        const expiryDate = new Date(paymentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        const receiptNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Execute as a transaction to ensure data integrity
        return await db.$transaction(async (tx) => {
            // 1. Create Ledger Entry (Income)
            const transactionRecord = await tx.accountingTransaction.create({
                data: {
                    type: TransactionType.INCOME,
                    category: 'Subscription',
                    amount: totalAmount,
                    date: paymentDate,
                    description: `Plan: ${plan.name} (${duration}) - Workspace: ${workspace.name}`,
                    workspaceId: workspace.id,
                }
            });

            // 2. Create Payment/Receipt Record
            const paymentRecord = await tx.workspacePayment.create({
                data: {
                    workspaceId: workspace.id,
                    amount: totalAmount,
                    baseAmount,
                    gstAmount,
                    cgstAmount,
                    sgstAmount,
                    totalAmount,
                    planName: plan.name,
                    duration,
                    paymentDate,
                    expiryDate,
                    status: PaymentStatus.PAID,
                    transactionId: transactionRecord.id,
                    receiptNumber,
                    paymentMethod,
                    billingAddressSnapshot: workspace.address
                }
            });

            // 3. Update Workspace Infrastructure Limits & Status
            await tx.workspace.update({
                where: { id: workspace.id },
                data: {
                    status: 'ACTIVE', // Reactivate if suspended
                    maxStudents,
                    maxTeachers,
                    maxExams,
                    aiLimit,
                    trialExpiresAt: null, // Clear trial once they pay
                }
            });

            return paymentRecord;
        });

    } catch (error: any) {
        console.error("APPLY_PLAN_ERROR", error);
        throw error;
    }
}

/**
 * Public action for Super Admins to record a manual payment.
 */
export async function recordManualPayment(data: {
    workspaceId: string;
    planId: string;
    duration: string;
    customAmount?: number;
    paymentDate?: Date;
    paymentMethod?: string;
}) {
    try {
        const payment = await applyPricingPlanToWorkspace(
            data.workspaceId,
            data.planId,
            data.duration,
            data.paymentMethod || "Cash",
            data.customAmount,
            data.paymentDate
        );

        revalidatePath("/super-admin/payments");
        revalidatePath("/admin/billing");
        return { success: true, id: payment.id };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to record payment." };
    }
}

/**
 * Fetches workspaces for selection in the manual entry form.
 */
export async function getWorkspacesForSelection() {
    try {
        return await db.workspace.findMany({
            select: { id: true, name: true, contactEmail: true },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error("GET_WORKSPACES_FOR_SELECTION_ERROR", error);
        return [];
    }
}

/**
 * Fetches pricing plans for selection.
 */
export async function getPricingPlansForSelection() {
    try {
        return await db.pricingPlan.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });
    } catch (error) {
        console.error("GET_PLANS_FOR_SELECTION_ERROR", error);
        return [];
    }
}
