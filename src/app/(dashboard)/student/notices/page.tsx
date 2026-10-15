import { db } from "@/lib/prisma";
import { NoticesSection } from "@/components/shared/NoticesSection";
import { getInbox } from "@/actions/notice";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { Inbox, Bell, BookOpen, Clock } from "lucide-react";

export default async function StudentNoticesPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ 
        where: { clerkId: userId },
        include: { studentWorkspaces: true }
    });
    if (!dbUser || dbUser.role !== "STUDENT") redirect("/dashboard");

    const inbox = await getInbox();
    const totalInbox = inbox.length;
    const unreadInbox = inbox.filter((n: any) => !n.isRead).length;
    const workspacesCount = dbUser.studentWorkspaces.length;

    return (
        <DashboardPage>
            <DashboardHeader
                title={<>Student <span className="text-primary font-black">Inbox & Announcements</span></>}
                subtitle="Official assessment schedules, batch announcements, and institutional bulletins."
            />

            {/* KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Active Bulletins"
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
                    title="Unread Priority"
                    value={unreadInbox}
                    subtitle={unreadInbox > 0 ? "Requires your attention" : "All notices acknowledged"}
                    icon={<Bell className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {unreadInbox} Pending
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Enrolled Centers"
                    value={workspacesCount}
                    subtitle="Institutional channels linked"
                    icon={<BookOpen className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {workspacesCount} Centers
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Read Ratio"
                    value={totalInbox > 0 ? `${Math.round(((totalInbox - unreadInbox) / totalInbox) * 100)}%` : "100%"}
                    subtitle={`${totalInbox - unreadInbox} of ${totalInbox} bulletins cleared`}
                    icon={<Clock className="size-4 text-blue-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {totalInbox - unreadInbox} Cleared
                        </span>
                    }
                />
            </div>

            {/* Students only receive inbox, no compose terminal */}
            <div className="w-full">
                <NoticesSection allowedTargets={[]} workspaces={[]} inbox={inbox} sentBox={[]} showSentTab={false} />
            </div>
        </DashboardPage>
    );
}
