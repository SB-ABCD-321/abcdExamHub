"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentStatus, TransactionType } from "@prisma/client";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { deleteFromCloudinary } from "@/app/actions/upload";
import { subDays } from "date-fns";

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
    customPaymentDate?: Date,
    referenceNumber?: string,
    proofImageUrl?: string
) {
    try {
        const [workspace, plan, settings] = await Promise.all([
            db.workspace.findUnique({ 
                where: { id: workspaceId },
                include: { admin: true }
            }),
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

        // 3. Execute as a transaction to ensure data integrity
        const result = await db.$transaction(async (tx) => {
            // ... (rest of transaction remains same)
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
                    referenceNumber: referenceNumber || undefined,
                    proofImageUrl: proofImageUrl || undefined,
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

        // 4. Send Receipt Email (After Transaction)
        const recipientEmail = workspace!.contactEmail || workspace!.admin?.email;
        if (recipientEmail) {
            await sendPaymentReceiptEmail({
                email: recipientEmail,
                name: `${workspace!.admin?.firstName || 'Admin'} ${workspace!.admin?.lastName || ''}`.trim(),
                workspaceName: workspace!.name,
                planName: plan!.name,
                duration,
                baseAmount,
                gstAmount,
                totalAmount,
                receiptNumber,
                expiryDate
            }).catch(e => console.error("RECEIPT_EMAIL_SEND_FAILED", e));
        }

        return result;
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
    referenceNumber?: string;
}) {
    try {
        const payment = await applyPricingPlanToWorkspace(
            data.workspaceId,
            data.planId,
            data.duration,
            data.paymentMethod || "Cash",
            data.customAmount,
            data.paymentDate,
            data.referenceNumber
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
export async function getWorkspacesForSelection(search?: string) {
    try {
        return await db.workspace.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { contactEmail: { contains: search, mode: 'insensitive' } }
                ]
            } : {},
            select: { id: true, name: true, contactEmail: true },
            orderBy: { name: 'asc' },
            take: 50
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

/**
 * Deletes a manual payment entry.
 */
export async function deleteManualPayment(paymentId: string) {
    try {
        const payment = await db.workspacePayment.findUnique({
            where: { id: paymentId }
        });
        if (!payment) throw new Error("Payment not found");

        await db.$transaction(async (tx) => {
            await tx.workspacePayment.delete({ where: { id: paymentId } });
            if (payment.transactionId) {
                await tx.accountingTransaction.delete({ where: { id: payment.transactionId } });
            }
        });
        
        revalidatePath("/super-admin/payments");
        revalidatePath("/admin/billing");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * NEW: Workspace Admin submits offline payment proof.
 */
export async function submitPaymentProof(data: {
    workspaceId: string;
    planId: string;
    duration: string;
    proofImageUrl: string;
    referenceNumber: string;
    amount: number;
}) {
    try {
        const { auth } = await import("@clerk/nextjs/server");
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { adminWorkspace: true }
        });

        if (!user || user.adminWorkspace?.id !== data.workspaceId) {
            throw new Error("Unauthorized workspace access");
        }

        // Anti-Spam: Check for existing pending verification
        const existingPending = await db.workspacePayment.findFirst({
            where: {
                workspaceId: data.workspaceId,
                status: PaymentStatus.PENDING_VERIFICATION
            }
        });

        if (existingPending) {
            throw new Error("You already have a payment pending verification. Please wait for our team to process it.");
        }

        const pricingPlan = await db.pricingPlan.findUnique({ where: { id: data.planId } });
        if (!pricingPlan) throw new Error("Pricing plan not found");

        const payment = await db.workspacePayment.create({
            data: {
                workspaceId: data.workspaceId,
                planName: pricingPlan.name,
                duration: data.duration,
                amount: data.amount,
                proofImageUrl: data.proofImageUrl,
                referenceNumber: data.referenceNumber,
                status: PaymentStatus.PENDING_VERIFICATION,
                expiryDate: new Date(), // Placeholder, updated on approval
            }
        });

        // Notify Super Admin
        await db.notice.create({
            data: {
                title: "New Payment Verification Request",
                content: `Workspace "${user.adminWorkspace.name}" has submitted a payment proof for the "${pricingPlan.name}" plan. Ref: ${data.referenceNumber}`,
                targetType: "SUPER_ADMINS",
                senderId: user.id
            }
        });

        revalidatePath("/admin/billing");
        revalidatePath("/super-admin/payments");
        return { success: true, id: payment.id };
    } catch (error: any) {
        console.error("SUBMIT_PAYMENT_PROOF_ERROR", error);
        return { success: false, error: error.message };
    }
}

/**
 * NEW: Super Admin verifies (approves/rejects) an offline payment.
 */
export async function verifyPaymentRequest(data: {
    paymentId: string;
    isApproved: boolean;
    rejectionReason?: string;
}) {
    try {
        const { auth } = await import("@clerk/nextjs/server");
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const superAdmin = await db.user.findFirst({
            where: { clerkId, role: "SUPER_ADMIN" }
        });
        if (!superAdmin) throw new Error("Forbidden: Super Admin only");

        const payment = await db.workspacePayment.findUnique({
            where: { id: data.paymentId },
            include: { workspace: { include: { admin: true } } }
        });

        if (!payment) throw new Error("Payment record not found");
        if (payment.status !== PaymentStatus.PENDING_VERIFICATION) {
            throw new Error("Payment is not in pending verification status.");
        }

        if (data.isApproved) {
            // Find the pricing plan ID from the name (or we could have stored ID in WorkspacePayment)
            // For robustness, let's assume the name is unique or we find the first active one.
            const plan = await db.pricingPlan.findFirst({
                where: { name: payment.planName, isActive: true }
            });

            if (!plan) throw new Error("Original pricing plan not found or inactive.");

            // 1. Apply the plan (this handles ledger, workspace limits, and email)
            await applyPricingPlanToWorkspace(
                payment.workspaceId,
                plan.id,
                payment.duration,
                payment.paymentMethod || "Offline/Manual",
                payment.amount, // use the submitted amount
                undefined, // default date
                payment.referenceNumber || undefined,
                payment.proofImageUrl || undefined
            );

            // 2. Delete the temporary "PENDING" payment record OR update it
            // Since applyPricingPlanToWorkspace creates a NEW PAID record, we should delete the verification one
            // to avoid duplicates in history, or update the existing one.
            // Actually, updating is better for ID consistency if we used it anywhere.
            // But applyPricingPlanToWorkspace is robust. Let's delete the pending one.
            await db.workspacePayment.delete({ where: { id: payment.id } });

            // Notify Workspace Admin
            await db.notice.create({
                data: {
                    title: "Subscription Activated",
                    content: `Your payment was verified and your workspace "${payment.workspace.name}" is now active.`,
                    targetType: "SPECIFIC_USER",
                    targetUserId: payment.workspace.adminId,
                    senderId: superAdmin.id
                }
            });
        } else {
            // Rejected
            await db.workspacePayment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.REJECTED,
                    rejectionReason: data.rejectionReason || "Payment proof could not be verified."
                }
            });

            // Notify Workspace Admin
            await db.notice.create({
                data: {
                    title: "Payment Verification Rejected",
                    content: `Your payment proof for "${payment.workspace.name}" was rejected. Reason: ${data.rejectionReason}`,
                    targetType: "SPECIFIC_USER",
                    targetUserId: payment.workspace.adminId,
                    senderId: superAdmin.id
                }
            });
        }

        revalidatePath("/super-admin/payments");
        revalidatePath("/admin/billing");
        return { success: true };
    } catch (error: any) {
        console.error("VERIFY_PAYMENT_REQUEST_ERROR", error);
        return { success: false, error: error.message };
    }
}

/**
 * Maintenance task to delete old payment proofs from Cloudinary and DB.
 * Targets records older than 14 days to free up storage.
 */
export async function cleanupExpiredPaymentProofs() {
    try {
        const twoWeeksAgo = subDays(new Date(), 14);

        // Find payments (PAID or REJECTED) with proofs older than 14 days
        const expiredPayments = await db.workspacePayment.findMany({
            where: {
                submittedAt: { lt: twoWeeksAgo },
                proofImageUrl: { not: null },
                status: { in: [PaymentStatus.PAID, PaymentStatus.REJECTED] }
            },
            select: { id: true, proofImageUrl: true }
        });

        if (expiredPayments.length === 0) return { success: true, count: 0 };

        let deletedCount = 0;
        for (const payment of expiredPayments) {
            if (payment.proofImageUrl) {
                // 1. Delete from Cloudinary
                const deleted = await deleteFromCloudinary(payment.proofImageUrl);
                
                // 2. Clear from DB (even if Cloudinary fails, we want to clear the association eventually)
                await db.workspacePayment.update({
                    where: { id: payment.id },
                    data: { proofImageUrl: null }
                });

                if (deleted) deletedCount++;
            }
        }

        console.log(`[CLEANUP] Deleted ${deletedCount} expired payment proofs.`);
        return { success: true, count: deletedCount };
    } catch (error) {
        console.error("CLEANUP_EXPIRED_PROOFS_ERROR", error);
        return { success: false, error: "Cleanup cycle failed." };
    }
}

