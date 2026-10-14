"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendWorkspaceRequestConfirmation, sendWorkspaceApprovalNotification, sendWorkspaceRejectionNotification } from "@/lib/email";
import { RequestStatus, Role, WorkspaceStatus } from "@prisma/client";
import { applyPricingPlanToWorkspace } from "./financial-actions";
import { auth } from "@clerk/nextjs/server";

export async function getLatestWorkspaceRequest(clerkUserId: string) {
    try {
        const user = await db.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) return null;

        return await db.workspaceRequest.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error("GET_LATEST_REQUEST_ERROR", error);
        return null;
    }
}
export async function createWorkspaceRequest(data: {
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    whatsappNo?: string;
    workspaceName: string;
    planId: string;
    planDuration: string;
    userId: string; // Now required
    address?: string; // New field
}) {
    try {
        // Enforce single active request (Pending only)
        // Approved ones are now REVOKED on deletion, so they won't block new ones
        const existing = await db.workspaceRequest.findFirst({
            where: { userId: data.userId, status: 'PENDING' }
        });


        if (existing) {
            return { success: false, error: "You already have a pending workspace request." };
        }

        const request = await db.workspaceRequest.create({
            data: {
                ...data,
                status: 'PENDING'
            }
        });

        // Send Confirmation Email
        await sendWorkspaceRequestConfirmation(data.adminEmail, data.adminName);

        return { success: true, id: request.id };
    } catch (error) {
        console.error("CREATE_WORKSPACE_REQUEST_ERROR", error);
        return { success: false, error: "Failed to submit request." };
    }
}

export async function getWorkspaceRequests(
    status?: RequestStatus,
    options?: { page?: number; pageSize?: number; q?: string }
) {
    try {
        const { page, pageSize, q } = options || {};
        const skip = page && pageSize ? (page - 1) * pageSize : undefined;
        const take = pageSize || undefined;

        const where: any = status ? { status } : {};
        if (q && q.trim()) {
            const query = q.trim();
            where.OR = [
                { workspaceName: { contains: query, mode: 'insensitive' } },
                { adminName: { contains: query, mode: 'insensitive' } },
                { adminEmail: { contains: query, mode: 'insensitive' } },
                { adminPhone: { contains: query, mode: 'insensitive' } },
                { planId: { contains: query, mode: 'insensitive' } },
            ];
        }

        return await db.workspaceRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
            include: { 
                user: true,
                processedBy: true
            }
        });
    } catch (error) {
        console.error("GET_WORKSPACE_REQUESTS_ERROR", error);
        return [];
    }
}

export async function getWorkspaceRequestCounts(q?: string) {
    try {
        const buildWhere = (status?: RequestStatus) => {
            const where: any = status ? { status } : {};
            if (q && q.trim()) {
                const query = q.trim();
                where.OR = [
                    { workspaceName: { contains: query, mode: 'insensitive' } },
                    { adminName: { contains: query, mode: 'insensitive' } },
                    { adminEmail: { contains: query, mode: 'insensitive' } },
                    { adminPhone: { contains: query, mode: 'insensitive' } },
                    { planId: { contains: query, mode: 'insensitive' } },
                ];
            }
            return where;
        };

        const [pending, approved, rejected] = await Promise.all([
            db.workspaceRequest.count({ where: buildWhere('PENDING') }).catch(() => 0),
            db.workspaceRequest.count({ where: buildWhere('APPROVED') }).catch(() => 0),
            db.workspaceRequest.count({ where: buildWhere('REJECTED') }).catch(() => 0),
        ]);
        return { pending, approved, rejected, total: pending + approved + rejected };
    } catch (error) {
        console.error("GET_WORKSPACE_REQUEST_COUNTS_ERROR", error);
        return { pending: 0, approved: 0, rejected: 0, total: 0 };
    }
}

export async function approveWorkspaceRequest(requestId: string, limits?: { 
    maxStudents: number, 
    maxTeachers: number, 
    maxExams: number 
}) {
    try {
        const request = await db.workspaceRequest.findUnique({
            where: { id: requestId },
            include: { user: true }
        });

        if (!request) throw new Error("Request not found");

        let targetUserId = request.userId;
        
        if (!targetUserId) {
            const existingUser = await db.user.findUnique({ where: { email: request.adminEmail } });
            if (existingUser) {
                targetUserId = existingUser.id;
            } else {
                throw new Error("User must be registered with this email to become a Workspace Admin.");
            }
        }

        // 1. Create the Workspace infrastructure (minimal)
        const workspace = await db.workspace.create({
            data: {
                name: request.workspaceName,
                contactEmail: request.adminEmail,
                contactPhone: request.adminPhone,
                address: request.address, // Populate from request
                adminId: targetUserId,
                status: 'ACTIVE',
            }
        });

        // 2. Update User Role to ADMIN
        await db.user.update({
            where: { id: targetUserId },
            data: { role: 'ADMIN' }
        });

        // 3. Apply the Pricing Plan & Record the Initial Payment
        // This helper handles limits, GST, Transactions, and the Receipt.
        await applyPricingPlanToWorkspace(
            workspace.id,
            request.planId,
            request.planDuration,
            "On-boarding Approval"
        );

        // 4. Finalize the Request
        const { userId: clerkId } = await auth();
        const processor = clerkId ? await db.user.findUnique({ where: { clerkId } }) : null;

        await db.workspaceRequest.update({
            where: { id: requestId },
            data: { 
                status: 'APPROVED',
                processedById: processor?.id,
                processedAt: new Date(),
            }
        });

        await sendWorkspaceApprovalNotification(request.adminEmail, request.adminName, request.workspaceName);

        revalidatePath("/super-admin/requests");
        revalidatePath("/super-admin/payments");
        return { success: true };
    } catch (error: any) {
        console.error("APPROVE_WORKSPACE_REQUEST_ERROR", error);
        return { success: false, error: error.message || "Failed to approve request." };
    }
}


export async function rejectWorkspaceRequest(requestId: string, reason: string) {
    try {
        const { userId: clerkId } = await auth();
        const processor = clerkId ? await db.user.findUnique({ where: { clerkId } }) : null;

        const request = await db.workspaceRequest.update({
            where: { id: requestId },
            data: { 
                status: 'REJECTED',
                rejectionReason: reason,
                processedById: processor?.id,
                processedAt: new Date(),
            },
            include: { user: true }
        });

        await sendWorkspaceRejectionNotification(request.adminEmail, request.adminName, reason);

        revalidatePath("/super-admin/requests");
        return { success: true };
    } catch (error) {
        console.error("REJECT_WORKSPACE_REQUEST_ERROR", error);
        return { success: false, error: "Failed to reject request." };
    }
}

export async function deleteWorkspaceRequest(requestId: string) {
    try {
        await db.workspaceRequest.delete({
            where: { id: requestId }
        });
        revalidatePath("/super-admin/requests");
        return { success: true };
    } catch (error) {
        console.error("DELETE_WORKSPACE_REQUEST_ERROR", error);
        return { success: false, error: "Failed to delete request." };
    }
}

export async function getUserRequestHistory(userId: string) {
    try {
        return await db.workspaceRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error("GET_USER_HISTORY_ERROR", error);
        return [];
    }
}

export async function getBatchUserRequestHistories(userIds: string[]) {
    try {
        const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
        if (uniqueUserIds.length === 0) return {};

        const allHistories = await db.workspaceRequest.findMany({
            where: { userId: { in: uniqueUserIds } },
            orderBy: { createdAt: 'desc' }
        });

        const historyMap: Record<string, any[]> = {};
        for (const history of allHistories) {
            if (history.userId) {
                if (!historyMap[history.userId]) {
                    historyMap[history.userId] = [];
                }
                historyMap[history.userId].push(history);
            }
        }
        return historyMap;
    } catch (error) {
        console.error("GET_BATCH_USER_HISTORIES_ERROR", error);
        return {};
    }
}


