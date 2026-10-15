import { db } from "@/lib/prisma";
import { NoticesSection, type TargetOption } from "@/components/shared/NoticesSection";
import { getInbox, getSentBox } from "@/actions/notice";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { Inbox, Send, Building2, Globe, BellRing } from "lucide-react";

export default async function SuperAdminNoticesPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== "SUPER_ADMIN") redirect("/dashboard");

    const inbox = await getInbox();
    const sentBox = await getSentBox();
    const workspaces = await db.workspace.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

    const allowedTargets: TargetOption[] = [
        { value: "ALL_ADMINS" as const, label: "All Admins (Platform-wide)", group: "Platform-wide" },
        { value: "ALL_TEACHERS" as const, label: "All Teachers (Platform-wide)", group: "Platform-wide" },
        { value: "ALL_STUDENTS" as const, label: "All Students (Platform-wide)", group: "Platform-wide" },
        { value: "SUPER_ADMINS" as const, label: "Super Admins Only (Internal)", group: "Platform-wide" },
        { value: "WORKSPACE_ADMINS" as const, label: "Admin of a Specific Workspace", group: "By Workspace", needsWorkspace: true },
        { value: "WORKSPACE_TEACHERS" as const, label: "All Teachers in a Workspace", group: "By Workspace", needsWorkspace: true },
        { value: "WORKSPACE_STUDENTS" as const, label: "All Students in a Workspace", group: "By Workspace", needsWorkspace: true },
        { value: "SPECIFIC_USER" as const, label: "Specific Person (by Email)", group: "Individual", needsEmail: true },
    ];

    // High-Density Analytical Metric Calculations
    const totalInbox = inbox.length;
    const unreadInbox = inbox.filter((n: any) => !n.isRead).length;
    const totalSent = sentBox.length;
    const totalOpens = sentBox.reduce((acc: number, n: any) => acc + (n.readCount || 0), 0);

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Communications & <span className="text-primary font-black">Notice Hub</span></>}
                subtitle="Unified institutional broadcast telemetry, audience dispatch pipelines, and administrative alerts."
            />

            {/* HIGH-DENSITY ANALYTICAL NUMERIC KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Inbox Announcements"
                    value={totalInbox}
                    subtitle={`${unreadInbox} unread • ${totalInbox - unreadInbox} read`}
                    icon={<Inbox className="size-4 text-primary" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {unreadInbox} Unread
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Dispatched Notices"
                    value={totalSent}
                    subtitle={`${totalOpens} total recipient opens logged`}
                    icon={<Send className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {totalOpens} Opens
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Governed Workspaces"
                    value={workspaces.length}
                    subtitle="Active institutional receiver nodes"
                    icon={<Building2 className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {workspaces.length} Nodes
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Broadcast Channels"
                    value={allowedTargets.length}
                    subtitle="Platform-wide targeting filters"
                    icon={<Globe className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {allowedTargets.length} Channels
                        </span>
                    }
                />
            </div>

            {/* MAIN TERMINAL WORKSPACE */}
            <div className="w-full">
                <NoticesSection 
                    allowedTargets={allowedTargets} 
                    workspaces={workspaces} 
                    inbox={inbox} 
                    sentBox={sentBox} 
                />
            </div>
        </DashboardPage>
    );
}
