import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
    email: z.string().email(),
    roleType: z.enum(["TEACHER", "STUDENT"]),
});

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { email, roleType } = inputSchema.parse(body);

        // Verify the current user is an admin of a workspace
        const dbUser = await db.user.findUnique({
            where: { clerkId: userId },
            include: {
                adminWorkspace: {
                    include: {
                        _count: { select: { teachers: true, students: true } }
                    }
                }
            }
        });

        if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN") || !dbUser.adminWorkspace) {
            return new NextResponse("Forbidden - You do not own a workspace", { status: 403 });
        }

        const workspaceId = dbUser.adminWorkspace.id;

        // Check if the user we're inviting already exists in our DB
        let targetUser = await db.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // If they don't exist yet, create a "stub" account for them
        // The Clerk webhook will sync with this stub when they sign up with this email
        if (!targetUser) {
            targetUser = await db.user.create({
                data: {
                    clerkId: `stub_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Needs to be unique
                    email: email.toLowerCase(),
                    role: roleType, // Pre-assign the role
                }
            });
        } else {
            // Prevent demoting higher roles when adding to a workspace
            // If they are a SUPER_ADMIN or ADMIN, they retain that globally, but gain workspace access
            if (targetUser.role === "STUDENT" && roleType === "TEACHER") {
                await db.user.update({
                    where: { id: targetUser.id },
                    data: { role: "TEACHER" }
                });
            }
        }

        // Connect the user to the workspace based on role and check limits
        const workspace = dbUser.adminWorkspace;

        if (roleType === "TEACHER") {
            if (workspace._count.teachers >= workspace.maxTeachers) {
                return new NextResponse(`Workspace limit reached: Maximum ${workspace.maxTeachers} teachers allowed.`, { status: 403 });
            }

            await db.workspace.update({
                where: { id: workspaceId },
                data: {
                    teachers: {
                        connect: { id: targetUser.id }
                    }
                }
            });
        } else if (roleType === "STUDENT") {
            if (workspace._count.students >= workspace.maxStudents) {
                return new NextResponse(`Workspace limit reached: Maximum ${workspace.maxStudents} students allowed.`, { status: 403 });
            }

            await db.workspace.update({
                where: { id: workspaceId },
                data: {
                    students: {
                        connect: { id: targetUser.id }
                    }
                }
            });
        }

        return NextResponse.json({ success: true, user: targetUser });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 422 });
        }
        console.error("[WORKSPACE_ADD_USER]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
