import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { InvitationManager } from "./ClientManager";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { 
    QrCode, 
    GraduationCap, 
    UserPlus, 
    ShieldCheck, 
    Users, 
    AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminInvitationsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    // Get Admin's workspace
    const workspace = await db.workspace.findUnique({
        where: { adminId: dbUser.id },
    });

    if (!workspace) {
        return (
            <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border/60">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2 opacity-50" />
                <h2 className="text-base font-bold text-foreground">Workspace Required</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Please create your workspace profile on the dashboard first to generate invitations.</p>
            </div>
        );
    }

    const studentCount = await db.user.count({
        where: { role: 'STUDENT', studentWorkspaces: { some: { id: workspace.id } } }
    });

    const headersList = await headers();
    const host = headersList.get("host") || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const joinLink = `${protocol}://${host}/join/${workspace.id}`;

    const studentCapPercent = workspace.maxStudents > 0 
        ? Math.min(100, Math.round((studentCount / workspace.maxStudents) * 100)) 
        : 0;

    const openSeats = Math.max(0, workspace.maxStudents - studentCount);

    return (
        <DashboardPage>
            {/* Standardized Dashboard Header */}
            <DashboardHeader
                title={<>Student <span className="text-primary font-black">Invitations</span></>}
                subtitle="Classroom QR portal and secure join gateway: automatically onboard candidates to your workspace."
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link href="/admin/students">
                            <Button variant="outline" size="sm" className="h-8.5 px-3 border-border/60 hover:bg-muted font-bold text-xs rounded-xl gap-1.5 cursor-pointer">
                                <Users className="size-3.5 text-muted-foreground" />
                                <span>View Roster</span>
                            </Button>
                        </Link>
                        <Link href="/admin/billing">
                            <Button variant="ghost" size="sm" className="h-8.5 px-2.5 border border-border/40 hover:bg-muted font-bold text-xs rounded-xl gap-1.5 cursor-pointer">
                                <span>Upgrade Seats</span>
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* EXACTLY 4 HIGH-DENSITY NUMBER-DRIVEN KPI CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {/* 1. Current Enrolled Scholars */}
                <DashboardMetricCard
                    title="Enrolled Scholars"
                    value={studentCount}
                    subtitle={`${studentCount} of ${workspace.maxStudents} capacity slots`}
                    progress={studentCapPercent}
                    icon={<GraduationCap className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {studentCapPercent}% Cap
                        </span>
                    }
                />

                {/* 2. Open Seats Left */}
                <DashboardMetricCard
                    title="Available Seats"
                    value={openSeats}
                    subtitle="Open slots for candidate intake"
                    progress={Math.min(100, Math.round((openSeats / workspace.maxStudents) * 100))}
                    icon={<UserPlus className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Open Slots
                        </span>
                    }
                />

                {/* 3. Gateway Status */}
                <DashboardMetricCard
                    title="Gateway Telemetry"
                    value="100%"
                    subtitle="Public QR & URL endpoint online"
                    progress={100}
                    icon={<QrCode className="size-4 text-blue-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Active Node
                        </span>
                    }
                />

                {/* 4. Target Role Routing */}
                <DashboardMetricCard
                    title="Licensed Capacity"
                    value={workspace.maxStudents}
                    subtitle="Maximum permitted student roster"
                    progress={100}
                    icon={<ShieldCheck className="size-4 text-purple-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            Licensed Tier
                        </span>
                    }
                />
            </div>

            {/* INTERACTIVE INVITATION MANAGER & ONBOARDING TERMINAL */}
            <InvitationManager
                joinLink={joinLink}
                workspaceName={workspace.name}
                workspaceId={workspace.id}
                studentCount={studentCount}
                maxStudents={workspace.maxStudents}
            />
        </DashboardPage>
    );
}
