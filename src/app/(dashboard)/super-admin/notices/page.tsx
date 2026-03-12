import { db } from "@/lib/prisma";
import { NoticesSection } from "@/components/shared/NoticesSection";
import { getInbox, getSentBox } from "../../../../actions/notice";


import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SuperAdminNoticesPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== "SUPER_ADMIN") redirect("/dashboard");

    const inbox = await getInbox();
    const sentBox = await getSentBox();
    const workspaces = await db.workspace.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

    const allowedTargets = [
        { value: "ALL_ADMINS" as const, label: "All Admins (Platform-wide)", group: "Platform-wide" },
        { value: "ALL_TEACHERS" as const, label: "All Teachers (Platform-wide)", group: "Platform-wide" },
        { value: "ALL_STUDENTS" as const, label: "All Students (Platform-wide)", group: "Platform-wide" },
        { value: "WORKSPACE_ADMINS" as const, label: "Admin of a Specific Workspace", group: "By Workspace", needsWorkspace: true },
        { value: "WORKSPACE_TEACHERS" as const, label: "All Teachers in a Workspace", group: "By Workspace", needsWorkspace: true },
        { value: "WORKSPACE_STUDENTS" as const, label: "All Students in a Workspace", group: "By Workspace", needsWorkspace: true },
        { value: "SPECIFIC_USER" as const, label: "Specific Person (by Email)", group: "Individual", needsEmail: true },
    ];

    return (
        <div className="space-y-8 pb-12 pr-2">
            <div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Notice <span className="text-primary">Management</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Broadcast system-wide alerts and manage all communications.
                </p>
            </div>
            <NoticesSection allowedTargets={allowedTargets} workspaces={workspaces} inbox={inbox} sentBox={sentBox} />
        </div>
    );
}
