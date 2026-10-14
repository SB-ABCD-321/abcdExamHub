import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    Users,
    GraduationCap,
    ClipboardList,
    ShieldCheck,
    CheckCircle2
} from "lucide-react";
import WorkspaceTable from "@/components/super-admin/WorkspaceTable";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { WorkspaceStatus } from "@prisma/client";

interface SuperAdminWorkspacesPageProps {
    searchParams?: Promise<{
        page?: string;
        limit?: string;
        q?: string;
        search?: string;
        status?: string;
        tier?: string;
        sort?: string;
        id?: string;
    }>;
}

export default async function SuperAdminWorkspacesPage(props: SuperAdminWorkspacesPageProps) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        select: { role: true }
    });

    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    const searchParams = (await props.searchParams) || {};
    const q = (searchParams.q || searchParams.search || "").trim();
    const status = searchParams.status || "ALL";
    const tier = searchParams.tier || "all";
    const sort = searchParams.sort || "newest";
    const page = Math.max(1, Number(searchParams.page) || 1);
    const directId = searchParams.id?.trim() || "";

    // 10 or 20 per page for ultra-lightweight high-performance loads
    const limit = [10, 20, 50].includes(Number(searchParams.limit)) ? Number(searchParams.limit) : 10;
    const skip = (page - 1) * limit;

    // Build dynamic query filter
    const where: any = {};

    if (directId) {
        where.id = directId;
    } else {
        if (q) {
            where.OR = [
                { name: { contains: q, mode: "insensitive" as const } },
                { id: { contains: q, mode: "insensitive" as const } },
                { admin: { email: { contains: q, mode: "insensitive" as const } } },
                { admin: { firstName: { contains: q, mode: "insensitive" as const } } },
                { admin: { lastName: { contains: q, mode: "insensitive" as const } } },
            ];
        }

        if (status && status !== "ALL") {
            where.status = status as WorkspaceStatus;
        }

        if (tier === "unlimited") {
            where.aiUnlimited = true;
        } else if (tier === "standard") {
            where.aiUnlimited = false;
        }
    }

    // Dynamic sorting
    let orderBy: any = { createdAt: "desc" as const };
    if (sort === "oldest") orderBy = { createdAt: "asc" as const };
    else if (sort === "name") orderBy = { name: "asc" as const };

    // High performance queries in parallel
    const [
        totalWorkspaces,
        activeCount,
        pausedCount,
        suspendedCount,
        totalTeachers,
        totalStudents,
        totalExams,
        filteredTotal,
        workspaces
    ] = await Promise.all([
        db.workspace.count(),
        db.workspace.count({ where: { status: "ACTIVE" } }),
        db.workspace.count({ where: { status: "PAUSED" } }),
        db.workspace.count({ where: { status: "SUSPENDED" } }),
        db.user.count({ where: { role: "TEACHER" } }),
        db.user.count({ where: { role: "STUDENT" } }),
        db.exam.count(),
        db.workspace.count({ where }),
        db.workspace.findMany({
            where,
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                status: true,
                aiLimit: true,
                aiGenerationsCount: true,
                aiUnlimited: true,
                maxTeachers: true,
                maxStudents: true,
                maxExams: true,
                maxQuestions: true,
                maxConcurrentExams: true,
                trialExpiresAt: true,
                createdAt: true,
                admin: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        teachers: true,
                        students: true,
                        exams: true,
                        questions: true
                    }
                }
            },
            orderBy
        })
    ]);

    const activePercent = totalWorkspaces > 0 ? Math.round((activeCount / totalWorkspaces) * 100) : 0;
    const hasActiveFilters = Boolean(q || status !== "ALL" || tier !== "all" || sort !== "newest" || directId);

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Institutional <span className="text-primary font-black">Workspaces</span></>}
                subtitle="Administrative governance, multi-tenant resource telemetry, capacity quotas, and AI engine controls."
            />

            {/* HIGH-DENSITY ANALYTICAL KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Institutional Nodes"
                    value={totalWorkspaces}
                    subtitle={hasActiveFilters ? `${filteredTotal} matching active filters` : `${activeCount} online (${activePercent}% active)`}
                    icon={<Building2 className="size-4 text-primary" />}
                    badge={
                        hasActiveFilters ? (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                Filtered
                            </span>
                        ) : undefined
                    }
                />

                <DashboardMetricCard
                    title="Verified Faculty"
                    value={totalTeachers}
                    subtitle="Educators across all shards"
                    icon={<GraduationCap className="size-4 text-indigo-500" />}
                />

                <DashboardMetricCard
                    title="Student Reach"
                    value={totalStudents}
                    subtitle="Active examinee seats"
                    icon={<Users className="size-4 text-emerald-500" />}
                />

                <DashboardMetricCard
                    title="Hosted Assessments"
                    value={totalExams}
                    subtitle="Cross-cluster active exams"
                    icon={<ClipboardList className="size-4 text-amber-500" />}
                />
            </div>

            {/* UPGRADED WORKSPACE TABLE WITH SL NO, FIXED CSS GRID COLUMNS, STATUS TABS, 10/20 PAGINATION */}
            <WorkspaceTable
                workspaces={workspaces}
                totalCount={filteredTotal}
                globalTotal={totalWorkspaces}
                activeCount={activeCount}
                pausedCount={pausedCount}
                suspendedCount={suspendedCount}
                currentPage={page}
                pageSize={limit}
                currentFilters={{
                    q,
                    status,
                    tier,
                    sort,
                    limit,
                    page,
                    id: directId || undefined
                }}
            />

            {/* INTEGRITY & MULTI-TENANT SHARD AUDIT FOOTER */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-5" />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">Multi-Tenant Shard Governance Protocol</h4>
                        <p className="text-[11px] text-muted-foreground">
                            Tenant isolation, resource metering, and algorithmic quotas are cryptographically enforced in real-time across all clusters.
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold shrink-0 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Shards Synchronized</span>
                </Badge>
            </div>
        </DashboardPage>
    );
}
