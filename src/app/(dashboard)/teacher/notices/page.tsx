import { db } from "@/lib/prisma";
import { NoticesSection } from "@/components/shared/NoticesSection";
import { getInbox, getSentBox } from "@/actions/notice";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { Inbox, Send, Building2, BellRing } from "lucide-react";

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

    const totalInbox = inbox.length;
    const unreadInbox = inbox.filter((n: any) => !n.isRead).length;
    const totalSent = sentBox.length;
    const totalOpens = sentBox.reduce((acc: number, n: any) => acc + (n.readCount || 0), 0);

    return (
        <DashboardPage>
            <DashboardHeader
                title={<>Instructor <span className="text-primary font-black">Communications</span></>}
                subtitle="Broadcast announcements to student batches and coordinate requests with administrators."
            />

            {/* KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Announcements Received"
                    value={totalInbox}
                    subtitle={`${unreadInbox} unread updates`}
                    icon={<Inbox className="size-4 text-primary" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {unreadInbox} Unread
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="My Dispatches"
                    value={totalSent}
                    subtitle={`${totalOpens} student reads logged`}
                    icon={<Send className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {totalOpens} Reads
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Active Workspaces"
                    value={workspaces.length}
                    subtitle="Institutions you teach in"
                    icon={<Building2 className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {workspaces.length} Nodes
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Communication Scope"
                    value={allowedTargets.length}
                    subtitle="Target broadcast channels"
                    icon={<BellRing className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {allowedTargets.length} Channels
                        </span>
                    }
                />
            </div>

            <div className="w-full">
                <NoticesSection allowedTargets={allowedTargets} workspaces={workspaces} inbox={inbox} sentBox={sentBox} />
            </div>
        </DashboardPage>
    );
}
