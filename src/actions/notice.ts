"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NoticeTargetType } from "@prisma/client";

export async function sendNotice(
    title: string,
    content: string,
    targetType: NoticeTargetType,
    targetWorkspaceId?: string | null,
    targetEmail?: string | null
) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const sender = await db.user.findUnique({ where: { clerkId: userId } });
    if (!sender) throw new Error("User not found");

    if (!["SUPER_ADMIN", "ADMIN", "TEACHER"].includes(sender.role)) {
        throw new Error("You do not have permission to send notices");
    }

    // Resolve SPECIFIC_USER by email to get user ID (never trust client-side IDs)
    let targetUserId: string | null = null;
    if (targetType === "SPECIFIC_USER") {
        if (!targetEmail?.trim()) throw new Error("Please provide the recipient's email");
        const target = await db.user.findUnique({
            where: { email: targetEmail.trim().toLowerCase() }
        });
        if (!target) throw new Error(`No user found with email: ${targetEmail}`);
        targetUserId = target.id;
    }

    // --- ENFORCE WORKSPACE AUTHORIZATION & IDOR PREVENTION ---
    // If a workspace is targeted, ensure the sender belongs to it (unless Super Admin)
    if (targetWorkspaceId && sender.role !== "SUPER_ADMIN") {
        const hasAccess = await db.workspace.findFirst({
            where: {
                id: targetWorkspaceId,
                OR: [
                    { adminId: sender.id },
                    { teachers: { some: { id: sender.id } } }
                ]
            }
        });

        if (!hasAccess) {
            throw new Error("Unauthorized: You cannot broadcast to a workspace you do not belong to.");
        }
    }

    await db.notice.create({
        data: {
            title: title.trim(),
            content: content.trim(),
            targetType,
            senderId: sender.id,
            targetWorkspaceId: targetWorkspaceId || null,
            targetUserId,
        }
    });

    return { success: true };
}

export async function markAsRead(noticeId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkId: userId } });
    if (!user) throw new Error("User not found");

    await db.noticeRead.upsert({
        where: { noticeId_userId: { noticeId, userId: user.id } },
        update: { readAt: new Date() },
        create: { noticeId, userId: user.id }
    });

    return { success: true };
}

export async function getInbox() {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
            adminWorkspace: { select: { id: true } },
            teacherWorkspaces: { select: { id: true } },
            studentWorkspaces: { select: { id: true } },
        }
    });
    if (!user) return [];

    // Collect all workspace IDs this user is part of, by role context
    const adminWorkspaceIds: string[] = user.adminWorkspace ? [user.adminWorkspace.id] : [];
    const teacherWorkspaceIds: string[] = user.teacherWorkspaces.map(w => w.id);
    const studentWorkspaceIds: string[] = user.studentWorkspaces.map(w => w.id);
    const allWorkspaceIds = [...adminWorkspaceIds, ...teacherWorkspaceIds, ...studentWorkspaceIds];

    // Build OR conditions based on role
    const orConditions: any[] = [
        // Always include direct messages to this user
        { targetType: "SPECIFIC_USER", targetUserId: user.id }
    ];

    // SUPER_ADMIN and ADMIN receive ALL_ADMINS
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        orConditions.push({ targetType: "ALL_ADMINS" });
    }

    // ADMIN receives WORKSPACE_ADMINS targeted at their workspace
    if (user.role === "ADMIN" && adminWorkspaceIds.length > 0) {
        orConditions.push({
            targetType: "WORKSPACE_ADMINS",
            targetWorkspaceId: { in: adminWorkspaceIds }
        });
    }

    // TEACHER receives ALL_TEACHERS and WORKSPACE_TEACHERS
    if (user.role === "TEACHER") {
        orConditions.push({ targetType: "ALL_TEACHERS" });
        if (teacherWorkspaceIds.length > 0) {
            orConditions.push({
                targetType: "WORKSPACE_TEACHERS",
                targetWorkspaceId: { in: teacherWorkspaceIds }
            });
        }
    }

    // STUDENT receives ALL_STUDENTS and WORKSPACE_STUDENTS
    if (user.role === "STUDENT") {
        orConditions.push({ targetType: "ALL_STUDENTS" });
        if (studentWorkspaceIds.length > 0) {
            orConditions.push({
                targetType: "WORKSPACE_STUDENTS",
                targetWorkspaceId: { in: studentWorkspaceIds }
            });
        }
    }

    const notices = await db.notice.findMany({
        where: { OR: orConditions },
        include: {
            sender: {
                select: { firstName: true, lastName: true, email: true, role: true }
            },
            reads: {
                where: { userId: user.id },
                select: { id: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return notices.map(n => ({ ...n, isRead: n.reads.length > 0 }));
}

export async function getSentBox() {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await db.user.findUnique({ where: { clerkId: userId } });
    if (!user) return [];

    const sentNotices = await db.notice.findMany({
        where: { senderId: user.id },
        include: {
            _count: { select: { reads: true } },
            targetWorkspace: { select: { name: true } },
            targetUser: { select: { firstName: true, lastName: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return sentNotices.map(n => {
        let expectedTargetText = "";
        switch (n.targetType) {
            case "ALL_ADMINS": expectedTargetText = "All Admins (Platform-wide)"; break;
            case "ALL_TEACHERS": expectedTargetText = "All Teachers (Platform-wide)"; break;
            case "ALL_STUDENTS": expectedTargetText = "All Students (Platform-wide)"; break;
            case "WORKSPACE_ADMINS": expectedTargetText = "Workspace Admin"; break;
            case "WORKSPACE_TEACHERS": expectedTargetText = "Workspace Teachers"; break;
            case "WORKSPACE_STUDENTS": expectedTargetText = "Workspace Students"; break;
            case "SPECIFIC_USER": {
                const u = n.targetUser;
                expectedTargetText = u
                    ? `${(u.firstName || "") + " " + (u.lastName || "")}`.trim() || u.email
                    : "Specific User";
                break;
            }
        }
        return {
            ...n,
            readCount: n._count.reads,
            expectedTargetText
        };
    });
}
