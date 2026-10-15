import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const settingsSchema = z.object({
    workspaceId: z.string(),
    name: z.string().min(2).optional(),
    description: z.string().optional().or(z.literal("")),
    logoUrl: z.string().url().optional().or(z.literal("")),
    contactEmail: z.string().email().optional().or(z.literal("")),
    contactPhone: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    gstNumber: z.string().optional().or(z.literal("")),
    billingAddress: z.string().optional().or(z.literal("")),
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

        if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN") || (!dbUser.adminWorkspace && dbUser.role !== "SUPER_ADMIN")) {
            return new NextResponse("Forbidden - You do not own a workspace", { status: 403 });
        }

        if (dbUser.adminWorkspace && dbUser.adminWorkspace.id !== payload.workspaceId && dbUser.role !== "SUPER_ADMIN") {
            return new NextResponse("Forbidden - Workspace mismatch", { status: 403 });
        }

        const updatedWorkspace = await db.workspace.update({
            where: { id: payload.workspaceId },
            data: {
                ...(payload.name ? { name: payload.name } : {}),
                description: payload.description !== undefined ? (payload.description || null) : undefined,
                logoUrl: payload.logoUrl !== undefined ? (payload.logoUrl || null) : undefined,
                contactEmail: payload.contactEmail !== undefined ? (payload.contactEmail || null) : undefined,
                contactPhone: payload.contactPhone !== undefined ? (payload.contactPhone || null) : undefined,
                address: payload.address !== undefined ? (payload.address || null) : undefined,
                gstNumber: payload.gstNumber !== undefined ? (payload.gstNumber || null) : undefined,
                billingAddress: payload.billingAddress !== undefined ? (payload.billingAddress || null) : undefined,
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
