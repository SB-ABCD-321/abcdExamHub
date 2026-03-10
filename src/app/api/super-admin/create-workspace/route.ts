import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z.object({
    userId: z.string(),
    workspaceName: z.string().min(3),
});

export async function POST(req: Request) {
    try {
        const { userId: superAdminId } = await auth();
        if (!superAdminId) return new NextResponse("Unauthorized", { status: 401 });

        // Verify caller is a SUPER_ADMIN
        const superAdmin = await db.user.findUnique({
            where: { clerkId: superAdminId }
        });

        if (!superAdmin || superAdmin.role !== "SUPER_ADMIN") {
            return new NextResponse("Forbidden - Super Admin access required", { status: 403 });
        }

        const body = await req.json();
        const { userId, workspaceName } = inputSchema.parse(body);

        // Verify target user exists and isn't already an admin elsewhere
        const targetUser = await db.user.findUnique({
            where: { id: userId },
            include: { adminWorkspace: true }
        });

        if (!targetUser) {
            return new NextResponse("Target user not found", { status: 404 });
        }

        if (targetUser.role === "SUPER_ADMIN") {
            return new NextResponse("Cannot assign workspace to another Super Admin", { status: 400 });
        }

        if (targetUser.adminWorkspace) {
            return new NextResponse("User is already managing a workspace", { status: 400 });
        }

        // Use a transaction to ensure role update and workspace creation succeed together
        await db.$transaction(async (tx) => {
            // 1. Convert user to ADMIN
            await tx.user.update({
                where: { id: userId },
                data: { role: "ADMIN" }
            });

            // 2. Create the workspace assigned to them
            await tx.workspace.create({
                data: {
                    name: workspaceName,
                    adminId: userId
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 422 });
        }
        console.error("[CREATE_WORKSPACE_ADMIN]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
