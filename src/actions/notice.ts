"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NoticeTargetType, Role } from "@prisma/client";

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

    // --- ENFORCE STRICT BROADCASTING RULES ---
    if (sender.role !== "SUPER_ADMIN") {
        const platformWideTargets: NoticeTargetType[] = ["ALL_ADMINS", "ALL_TEACHERS", "ALL_STUDENTS", "SUPER_ADMINS"];
        if (platformWideTargets.includes(targetType)) {
            throw new Error(`Unauthorized: Role ${sender.role} cannot send platform-wide notices.`);
        }
    }

    // --- ENFORCE WORKSPACE AUTHORIZATION & IDOR PREVENTION ---
    if (sender.role === "ADMIN" || sender.role === "TEACHER") {
        if (!targetWorkspaceId && targetType !== "SPECIFIC_USER") {
            throw new Error("Unauthorized: Workspace target required for this role.");
        }

        if (targetWorkspaceId) {
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

async function cleanupExpiredNotices() {
    try {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        await db.notice.deleteMany({
            where: {
                createdAt: {
                    lt: fourteenDaysAgo
                }
            }
        });
    } catch (error) {
        console.error("NOTICE_CLEANUP_ERROR", error);
    }
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

    const adminWorkspaceIds: string[] = user.adminWorkspace ? [user.adminWorkspace.id] : [];
    const teacherWorkspaceIds: string[] = user.teacherWorkspaces.map(w => w.id);
    const studentWorkspaceIds: string[] = user.studentWorkspaces.map(w => w.id);

    // Build hierarchical filters
    const orConditions: any[] = [
        { targetType: "SPECIFIC_USER", targetUserId: user.id }
    ];

    if (user.role === "SUPER_ADMIN") {
        orConditions.push({ targetType: "SUPER_ADMINS" });
        orConditions.push({ targetType: "ALL_ADMINS" });
        // Super admin can see platform-wide requests
        orConditions.push({ targetType: "ALL_TEACHERS" }); 
        orConditions.push({ targetType: "ALL_STUDENTS" });
    }

    if (user.role === "ADMIN") {
        // Only receive ALL_ADMINS if sent by a Super Admin
        orConditions.push({ 
            targetType: "ALL_ADMINS", 
            sender: { role: "SUPER_ADMIN" } 
        });
        
        if (adminWorkspaceIds.length > 0) {
            orConditions.push({
                targetType: "WORKSPACE_ADMINS",
                targetWorkspaceId: { in: adminWorkspaceIds }
            });
        }
    }

    if (user.role === "TEACHER") {
        orConditions.push({ 
            targetType: "ALL_TEACHERS",
            sender: { role: "SUPER_ADMIN" }
        });
        if (teacherWorkspaceIds.length > 0) {
            orConditions.push({
                targetType: "WORKSPACE_TEACHERS",
                targetWorkspaceId: { in: teacherWorkspaceIds }
            });
        }
    }

    if (user.role === "STUDENT") {
        orConditions.push({ 
            targetType: "ALL_STUDENTS",
            sender: { role: "SUPER_ADMIN" }
        });
        if (studentWorkspaceIds.length > 0) {
            orConditions.push({
                targetType: "WORKSPACE_STUDENTS",
                targetWorkspaceId: { in: studentWorkspaceIds }
            });
        }
    }

    const notices = await db.notice.findMany({
        where: { 
            AND: [
                { OR: orConditions },
                { senderId: { not: user.id } } // Strictly exclude sent items from Inbox
            ]
        },
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

export async function getUnreadCounts() {
    const { userId } = await auth();
    if (!userId) return { notices: 0, inquiries: 0, bookings: 0 };

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
            adminWorkspace: { select: { id: true } },
            teacherWorkspaces: { select: { id: true } },
            studentWorkspaces: { select: { id: true } },
        }
    });

    if (!user) return { notices: 0, inquiries: 0, bookings: 0 };

    // Reuse the same logic as getInbox for consistency
    const adminWorkspaceIds: string[] = user.adminWorkspace ? [user.adminWorkspace.id] : [];
    const teacherWorkspaceIds: string[] = user.teacherWorkspaces.map(w => w.id);
    const studentWorkspaceIds: string[] = user.studentWorkspaces.map(w => w.id);

    const orConditions: any[] = [{ targetType: "SPECIFIC_USER", targetUserId: user.id }];
    if (user.role === "SUPER_ADMIN") {
        orConditions.push({ targetType: "SUPER_ADMINS" }, { targetType: "ALL_ADMINS" }, { targetType: "ALL_TEACHERS" }, { targetType: "ALL_STUDENTS" });
    }
    if (user.role === "ADMIN") {
        orConditions.push({ targetType: "ALL_ADMINS", sender: { role: "SUPER_ADMIN" } });
        if (adminWorkspaceIds.length) orConditions.push({ targetType: "WORKSPACE_ADMINS", targetWorkspaceId: { in: adminWorkspaceIds } });
    }
    if (user.role === "TEACHER") {
        orConditions.push({ targetType: "ALL_TEACHERS", sender: { role: "SUPER_ADMIN" } });
        if (teacherWorkspaceIds.length) orConditions.push({ targetType: "WORKSPACE_TEACHERS", targetWorkspaceId: { in: teacherWorkspaceIds } });
    }
    if (user.role === "STUDENT") {
        orConditions.push({ targetType: "ALL_STUDENTS", sender: { role: "SUPER_ADMIN" } });
        if (studentWorkspaceIds.length) orConditions.push({ targetType: "WORKSPACE_STUDENTS", targetWorkspaceId: { in: studentWorkspaceIds } });
    }

    const [noticeCount, inquiries, bookings] = await Promise.all([
        db.notice.count({
            where: {
                AND: [
                    { OR: orConditions },
                    { senderId: { not: user.id } },
                    { reads: { none: { userId: user.id } } }
                ]
            }
        }),
        user.role === "SUPER_ADMIN" ? db.inquiry.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
        user.role === "SUPER_ADMIN" ? db.callBooking.count({ where: { isRead: false } }) : Promise.resolve(0)
    ]);

    return { notices: noticeCount, inquiries, bookings };
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
            case "SUPER_ADMINS": expectedTargetText = "Internal (Management Only)"; break;
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
