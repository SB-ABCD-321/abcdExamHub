import { DashboardShell } from "@/components/layout/DashboardShell";
import { WorkspaceBlocked } from "@/components/shared/WorkspaceBlocked";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PwaPrompt } from "@/components/shared/PwaPrompt";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await db.siteSetting.findFirst();
    const { userId } = await auth();
    let user = null;

    if (userId) {
        try {
            user = await currentUser();
        } catch (error) {
            console.error("Clerk API Response Error: Failed to fetch user details.", error);
        }
    }
    let role = "STUDENT"; // Default fallback

    if (user) {
        // Sync user to database just in case the Clerk Webhook failed or was delayed
        // This guarantees all logged-in users appear in the Super Admin dashboard
        const primaryEmail = user.emailAddresses[0]?.emailAddress || "";

        let dbUser = await db.user.findUnique({ where: { clerkId: user.id } });

        const needsUpdate = !dbUser || 
            dbUser.email !== primaryEmail || 
            dbUser.firstName !== (user.firstName || "") ||
            dbUser.lastName !== (user.lastName || "") ||
            dbUser.imageUrl !== (user.imageUrl || "");

        if (!dbUser) {
            // Check if there is a 'Stub' user created by an Admin invitation using this email
            const stubUser = await db.user.findUnique({ where: { email: primaryEmail } });

            if (stubUser) {
                // Link the Clerk ID to the existing stub account
                dbUser = await db.user.update({
                    where: { id: stubUser.id },
                    data: {
                        clerkId: user.id,
                        firstName: user.firstName || stubUser.firstName || "",
                        lastName: user.lastName || stubUser.lastName || "",
                        imageUrl: user.imageUrl || stubUser.imageUrl || "",
                    }
                });
            } else {
                // Create a completely new user
                dbUser = await db.user.create({
                    data: {
                        clerkId: user.id,
                        email: primaryEmail,
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                        imageUrl: user.imageUrl || "",
                        role: "STUDENT" // Default role
                    }
                });
            }
        } else if (needsUpdate) {
            // Just update existing user info on successive logins to keep it fresh
            dbUser = await db.user.update({
                where: { clerkId: user.id },
                data: {
                    email: primaryEmail,
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    imageUrl: user.imageUrl || "",
                }
            });
        }

        role = dbUser.role;

        // Force profile completion
        if (!(dbUser as any).isProfileComplete) {
            redirect("/profile-setup");
        }
    }

    // Fetch unread counts for the sidebar badges using centralized action
    let unreadNoticeCount = 0;
    let unreadInquiryCount = 0;
    let unreadBookingCount = 0;

    if (user) {
        const { getUnreadCounts } = await import("@/actions/notice");
        const counts = await getUnreadCounts();
        unreadNoticeCount = counts.notices;
        unreadInquiryCount = counts.inquiries;
        unreadBookingCount = counts.bookings;
    }

    const primaryEmail = user?.emailAddresses[0]?.emailAddress || "";
    const developerEmail = process.env.DEVELOPER_EMAIL || "";

    // === WORKSPACE STATUS ENFORCEMENT ===
    let workspaceBlockMode: "SUSPENDED" | "PAUSED" | null = null;
    let blockedWorkspaceName: string | undefined;

    if (role !== "SUPER_ADMIN" && user) {
        const statusUser = await (db as any).user.findUnique({
            where: { clerkId: user.id },
            include: {
                adminWorkspace: { select: { status: true, name: true } },
                teacherWorkspaces: { select: { status: true, name: true } },
                studentWorkspaces: { select: { status: true, name: true } },
            }
        });

        if (statusUser) {
            const allWs = [
                ...(statusUser.adminWorkspace ? [statusUser.adminWorkspace] : []),
                ...statusUser.teacherWorkspaces,
                ...statusUser.studentWorkspaces,
            ];

            // If ANY workspace is suspended and it's the only one, block entirely
            const suspendedWs = allWs.filter(w => (w as any).status === "SUSPENDED");
            const pausedWs = allWs.filter(w => (w as any).status === "PAUSED");
            const activeWs = allWs.filter(w => (w as any).status === "ACTIVE");

            // If user has NO active workspaces and has suspended ones → block
            if (allWs.length > 0 && activeWs.length === 0 && suspendedWs.length > 0) {
                workspaceBlockMode = "SUSPENDED";
                blockedWorkspaceName = suspendedWs[0].name;
            } else if (allWs.length > 0 && activeWs.length === 0 && pausedWs.length > 0) {
                workspaceBlockMode = "PAUSED";
                blockedWorkspaceName = pausedWs[0].name;
            }
        }
    }
    // ======================================

    const displayName = user 
        ? ([user.firstName, user.lastName].filter(Boolean).join(" ") || primaryEmail) 
        : "";

    return (
        <DashboardShell
            role={role}
            userName={displayName}
            email={primaryEmail}
            developerEmail={developerEmail}
            unreadNoticeCount={unreadNoticeCount}
            unreadInquiryCount={unreadInquiryCount}
            unreadBookingCount={unreadBookingCount}
            workspaceBlocked={
                workspaceBlockMode ? (
                    <WorkspaceBlocked mode={workspaceBlockMode} workspaceName={blockedWorkspaceName} />
                ) : null
            }
            pwaPrompt={
                <PwaPrompt siteName={settings?.siteName || undefined} logoUrl={settings?.logoUrl || undefined} />
            }
        >
            {children}
        </DashboardShell>
    );
}
