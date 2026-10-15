import { db } from "@/lib/prisma";
import { NoticesSection } from "@/components/shared/NoticesSection";
import { getInbox, getSentBox } from "@/actions/notice";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { Inbox, Send, Building2, Users } from "lucide-react";

export default async function AdminNoticesPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { 
            adminWorkspace: {
                include: {
                    _count: {
                        select: {
                            teachers: true,
                            students: true
                        }
                    }
                }
            } 
        }
    });
    if (!dbUser || dbUser.role !== "ADMIN" || !dbUser.adminWorkspace) redirect("/dashboard");

    const inbox = await getInbox();
    const sentBox = await getSentBox();
    const workspace = dbUser.adminWorkspace;
    const workspaces = [{ id: workspace.id, name: workspace.name }];

    const allowedTargets = [
        { value: "WORKSPACE_TEACHERS" as const, label: "All Teachers in My Workspace", group: "Broadcast", needsWorkspace: true },
        { value: "WORKSPACE_STUDENTS" as const, label: "All Students in My Workspace", group: "Broadcast", needsWorkspace: true },
        { value: "SPECIFIC_USER" as const, label: "Specific Person (by Email)", group: "Individual", needsEmail: true },
    ];

    const totalInbox = inbox.length;
    const unreadInbox = inbox.filter((n: any) => !n.isRead).length;
    const totalSent = sentBox.length;
    const totalOpens = sentBox.reduce((acc: number, n: any) => acc + (n.readCount || 0), 0);

    return (
        <DashboardPage>
            <DashboardHeader
                title={<>{workspace.name} <span className="text-primary font-black">Notices</span></>}
                subtitle="Broadcast announcements, coordinate faculty communications, and review alerts."
            />

            {/* KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Received Notices"
                    value={totalInbox}
                    subtitle={`${unreadInbox} unread announcements`}
                    icon={<Inbox className="size-4 text-primary" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {unreadInbox} Unread
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Dispatched"
                    value={totalSent}
                    subtitle={`${totalOpens} recipient reads recorded`}
                    icon={<Send className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {totalOpens} Reads
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Audience Reach"
                    value={workspace._count.teachers + workspace._count.students}
                    subtitle={`${workspace._count.teachers} teachers • ${workspace._count.students} students`}
                    icon={<Users className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {workspace._count.teachers + workspace._count.students} Members
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Broadcast Channels"
                    value={allowedTargets.length}
                    subtitle="Faculty, student and direct channels"
                    icon={<Building2 className="size-4 text-blue-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
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
