"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function verifySuperAdmin() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({ where: { clerkId: userId } });
    if (!user || user.role !== "SUPER_ADMIN") throw new Error("Requires Super Admin");
    return user;
}

async function verifyAdminOrTeacher() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({ where: { clerkId: userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "TEACHER")) {
        throw new Error("Requires elevated privileges");
    }
    return user;
}

export async function verifyWorkspaceAccess(workspaceId: string) {
    const user = await verifyAdminOrTeacher();
    if (user.role === "SUPER_ADMIN") return user;

    const hasAccess = await db.workspace.findFirst({
        where: {
            id: workspaceId,
            OR: [
                { adminId: user.id },
                { teachers: { some: { id: user.id } } }
            ]
        }
    });

    if (!hasAccess) {
        throw new Error("Unauthorized workspace access");
    }
    return user;
}

// ========================
// SUPER ADMIN OPERATIONS
// ========================

export async function deleteWorkspace(workspaceId: string) {
    try {
        await verifySuperAdmin();

        // 1. Get workspace details before deletion to identify affected users
        const workspace = await db.workspace.findUnique({
            where: { id: workspaceId },
            include: { teachers: true }
        });
        
        if (!workspace) throw new Error("Workspace not found");

        const adminId = workspace.adminId;
        const teacherIds = workspace.teachers.map(t => t.id);
        const affectedUserIds = Array.from(new Set([adminId, ...teacherIds]));

        // 2. Delete the workspace
        await db.workspace.delete({ where: { id: workspaceId } });

        // 3. Demote users to STUDENT if they have no other workspaces to manage
        for (const userId of affectedUserIds) {
            const user = await db.user.findUnique({
                where: { id: userId },
                include: {
                    adminWorkspace: true,
                    teacherWorkspaces: true
                }
            });

            if (user && user.role !== "SUPER_ADMIN") {
                const hasOtherAdminRoles = !!user.adminWorkspace;
                const hasOtherTeacherRoles = user.teacherWorkspaces.length > 0;

                if (!hasOtherAdminRoles && !hasOtherTeacherRoles) {
                    await db.user.update({
                        where: { id: userId },
                        data: { role: "STUDENT" }
                    });
                }
            }
        }

        revalidatePath("/super-admin/workspaces");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// ========================
// ADMIN OPERATIONS (Manage Workspace Staff/Students)
// ========================

export async function removeTeacherFromWorkspace(teacherId: string, workspaceId: string) {
    try {
        await verifyWorkspaceAccess(workspaceId);
        // Disconnects relation, doesn't delete user
        await db.workspace.update({
            where: { id: workspaceId },
            data: { teachers: { disconnect: { id: teacherId } } }
        });

        // Also demote them to student so they don't break UI layout if they have no other workspaces
        const targetUser = await db.user.findUnique({ where: { id: teacherId }, include: { teacherWorkspaces: true } });
        if (targetUser && targetUser.teacherWorkspaces.length <= 1) {
            await db.user.update({ where: { id: teacherId }, data: { role: "STUDENT" } });
        }
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function removeStudentFromWorkspace(studentId: string, workspaceId: string) {
    try {
        await verifyWorkspaceAccess(workspaceId);
        await db.workspace.update({
            where: { id: workspaceId },
            data: { students: { disconnect: { id: studentId } } }
        });
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// ========================
// TEACHER OPERATIONS (Content)
// ========================

export async function deleteTopic(topicId: string) {
    try {
        const topic = await db.topic.findUnique({ where: { id: topicId } });
        if (!topic || !topic.workspaceId) throw new Error("Topic not found");
        await verifyWorkspaceAccess(topic.workspaceId);

        await db.topic.delete({ where: { id: topicId } });
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteQuestion(questionId: string) {
    try {
        const question = await db.question.findUnique({ where: { id: questionId } });
        if (!question || !question.workspaceId) throw new Error("Question not found");
        await verifyWorkspaceAccess(question.workspaceId);

        await db.question.delete({ where: { id: questionId } });
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteExam(examId: string) {
    try {
        const exam = await db.exam.findUnique({ where: { id: examId } });
        if (!exam || !exam.workspaceId) throw new Error("Exam not found");
        await verifyWorkspaceAccess(exam.workspaceId);

        await db.exam.delete({ where: { id: examId } });
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteNotice(noticeId: string) {
    try {
        const notice = await db.notice.findUnique({ where: { id: noticeId } });
        if (!notice) throw new Error("Notice not found");
        // Notices might be global (sent by super admin) or workspace specific.
        // If it was sent by a teacher to a specific workspace, verify that workspace access.
        if (notice.targetWorkspaceId) {
            await verifyWorkspaceAccess(notice.targetWorkspaceId);
        } else {
            // For global notices, enforce Super Admin
            await verifySuperAdmin();
        }

        await db.notice.delete({ where: { id: noticeId } });
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function toggleWorkspacePremiumAiAction(workspaceId: string, currentStatus: boolean) {
    try {
        await verifySuperAdmin();
        await db.workspace.update({
            where: { id: workspaceId },
            data: { aiUnlimited: !currentStatus }
        });
        revalidatePath("/super-admin/workspaces");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateWorkspaceLimitsAction(workspaceId: string, limit: number, isUnlimited: boolean, maxTeachers: number, maxStudents: number, maxExams: number, maxQuestions?: number) {
    try {
        await verifySuperAdmin();
        await db.workspace.update({
            where: { id: workspaceId },
            data: {
                aiLimit: limit,
                aiUnlimited: isUnlimited,
                maxTeachers,
                maxStudents,
                maxExams,
                ...(maxQuestions !== undefined ? { maxQuestions } : {})
            }
        });
        revalidatePath("/super-admin/workspaces");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// ========================
// WORKSPACE STATUS CONTROL
// ========================

export async function setWorkspaceStatusAction(workspaceId: string, status: "ACTIVE" | "PAUSED" | "SUSPENDED") {
    try {
        await verifySuperAdmin();
        await db.workspace.update({
            where: { id: workspaceId },
            data: { status }
        });
        revalidatePath("/super-admin/workspaces");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function clearWorkspaceResultsAction(workspaceId: string) {
    try {
        await verifySuperAdmin();
        // Delete all exam drafts and results for all exams in this workspace
        const exams = await db.exam.findMany({
            where: { workspaceId },
            select: { id: true }
        });
        const examIds = exams.map(e => e.id);
        if (examIds.length > 0) {
            await db.examDraft.deleteMany({ where: { examId: { in: examIds } } });
            await db.examResult.deleteMany({ where: { examId: { in: examIds } } });
        }
        revalidatePath("/super-admin/workspaces");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function clearWorkspaceDataAction(workspaceId: string) {
    try {
        await verifySuperAdmin();
        // Delete all exams (cascades to results/drafts/questions via FK), questions, topics
        await db.exam.deleteMany({ where: { workspaceId } });
        await db.question.deleteMany({ where: { workspaceId } });
        await db.topic.deleteMany({ where: { workspaceId } });
        revalidatePath("/super-admin/workspaces");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
