import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const settingsSchema = z.object({
    workspaceId: z.string(),
    logoUrl: z.string().url().optional().or(z.literal("")),
    contactEmail: z.string().email().optional().or(z.literal("")),
    contactPhone: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
});

export async function PATCH(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const payload = settingsSchema.parse(body);

        // Verify the user is an admin or super admin & owns this workspace
        const dbUser = await db.user.findUnique({
            where: { clerkId: userId },
            include: { adminWorkspace: true }
        });

        if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN") || !dbUser.adminWorkspace) {
            return new NextResponse("Forbidden - You do not own a workspace", { status: 403 });
        }

        if (dbUser.adminWorkspace.id !== payload.workspaceId) {
            return new NextResponse("Forbidden - Workspace mismatch", { status: 403 });
        }

        const updatedWorkspace = await db.workspace.update({
            where: { id: payload.workspaceId },
            data: {
                logoUrl: payload.logoUrl || null,
                contactEmail: payload.contactEmail || null,
                contactPhone: payload.contactPhone || null,
                address: payload.address || null,
            }
        });

        return NextResponse.json({ success: true, workspace: updatedWorkspace });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(error.issues[0]?.message || "Invalid request data", { status: 422 });
        }
        console.error("[WORKSPACE_SETTINGS_PATCH]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
