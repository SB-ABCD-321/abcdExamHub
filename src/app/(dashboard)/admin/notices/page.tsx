import { db } from "@/lib/prisma";
import { NoticesSection } from "@/components/shared/NoticesSection";
import { getInbox, getSentBox } from "../../../../actions/notice";


import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminNoticesPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { adminWorkspace: true }
    });
    if (!dbUser || dbUser.role !== "ADMIN" || !dbUser.adminWorkspace) redirect("/dashboard");

    const inbox = await getInbox();
    const sentBox = await getSentBox();
    const workspaces = [{ id: dbUser.adminWorkspace.id, name: dbUser.adminWorkspace.name }];

    const allowedTargets = [
        { value: "WORKSPACE_TEACHERS" as const, label: "All Teachers in My Workspace", group: "Broadcast", needsWorkspace: true },
        { value: "WORKSPACE_STUDENTS" as const, label: "All Students in My Workspace", group: "Broadcast", needsWorkspace: true },
        { value: "SPECIFIC_USER" as const, label: "Specific Person (by Email)", group: "Individual", needsEmail: true },
    ];

    return (
        <div className="space-y-8 pb-12 pr-2">
            <div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Workspace <span className="text-primary">Notices</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Manage communications for {dbUser.adminWorkspace.name}.
                </p>
            </div>
            <NoticesSection allowedTargets={allowedTargets} workspaces={workspaces} inbox={inbox} sentBox={sentBox} />
        </div>
    );
}
