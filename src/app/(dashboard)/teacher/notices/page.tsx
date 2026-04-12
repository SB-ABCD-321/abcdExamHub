import { db } from "@/lib/prisma";
import { NoticesSection } from "@/components/shared/NoticesSection";
import { getInbox, getSentBox, markAsRead } from "../../../../actions/notice";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function TeacherNoticesPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { teacherWorkspaces: true }
    });
    if (!dbUser || dbUser.role !== "TEACHER" || dbUser.teacherWorkspaces.length === 0) redirect("/dashboard");

    const inbox = await getInbox();
    const sentBox = await getSentBox();
    const workspaces = dbUser.teacherWorkspaces.map(w => ({ id: w.id, name: w.name }));

    const allowedTargets = [
        { value: "WORKSPACE_TEACHERS" as const, label: "All Teachers in My Workspace", group: "Broadcast", needsWorkspace: true },
        { value: "WORKSPACE_STUDENTS" as const, label: "All Students in My Workspace", group: "Broadcast", needsWorkspace: true },
        { value: "WORKSPACE_ADMINS" as const, label: "Admin of Workspace (Request/Ask)", group: "Requests", needsWorkspace: true },
        { value: "SPECIFIC_USER" as const, label: "Specific Person (by Email)", group: "Individual", needsEmail: true },
    ];

    return (
        <div className="space-y-8 pb-12 pr-2">
            <div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    System <span className="text-primary">Communications</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Send announcements or submit requests to your administrator.
                </p>
            </div>
            <NoticesSection allowedTargets={allowedTargets} workspaces={workspaces} inbox={inbox} sentBox={sentBox} />
        </div>
    );
}
