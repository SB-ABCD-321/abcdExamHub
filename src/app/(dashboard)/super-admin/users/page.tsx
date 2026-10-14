import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { 
    Users, 
    ShieldCheck, 
    GraduationCap, 
    User, 
    Shield
} from "lucide-react";
import { UserSearchBox } from "@/components/super-admin/UserSearchBox";
import { UserTabs } from "./user-tabs";
import { UsersLedger } from "./users-ledger";
import { UserSkeletonList } from "./user-skeleton";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";

interface SuperAdminUsersPageProps {
    searchParams?: Promise<{ 
        q?: string; 
        role?: string; 
        sort?: string; 
        page?: string; 
    }>;
}

export default async function SuperAdminUsersPage(props: SuperAdminUsersPageProps) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const searchParams = (await props.searchParams) || {};
    const q = searchParams.q?.trim() || "";
    const activeRole = searchParams.role || "ALL";
    const sort = searchParams.sort || "newest";
    const page = Math.max(1, Number(searchParams.page) || 1);
    const pageSize = 10;

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    const devEmail = process.env.DEVELOPER_EMAIL || "developer@abcd.com";
    const isDeveloper = dbUser.email.toLowerCase() === devEmail.toLowerCase();

    // Build the query filter dynamically
    const queryFilter: any = {};

    if (activeRole && activeRole !== "ALL") {
        queryFilter.role = activeRole as Role;
    }

    if (q) {
        queryFilter.OR = [
            { firstName: { contains: q, mode: 'insensitive' as const } },
            { lastName: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
            { phoneNumber: { contains: q, mode: 'insensitive' as const } },
        ];
    }

    // High performance queries: filtered count + single groupBy for all roles
    const [filteredTotal, roleGroupCounts] = await Promise.all([
        db.user.count({ where: queryFilter }).catch(() => 0),
        db.user.groupBy({
            by: ['role'],
            _count: { _all: true }
        }).catch(() => [])
    ]);

    let totalCount = 0;
    let superAdminCount = 0;
    let adminCount = 0;
    let teacherCount = 0;
    let studentCount = 0;

    for (const group of roleGroupCounts) {
        const count = group._count._all;
        totalCount += count;
        if (group.role === 'SUPER_ADMIN') superAdminCount = count;
        else if (group.role === 'ADMIN') adminCount = count;
        else if (group.role === 'TEACHER') teacherCount = count;
        else if (group.role === 'STUDENT') studentCount = count;
    }

    const totalAdmins = superAdminCount + adminCount;
    const hasActiveFilters = Boolean(q || activeRole !== "ALL" || (sort && sort !== "newest"));

    return (
        <DashboardPage>
            {/* Standardized Dashboard Header */}
            <DashboardHeader
                title={<>Global User <span className="text-primary font-black">Directory</span></>}
                subtitle="Centralized institutional ledger of user identities, platform permissions, roles, and shards."
                actions={<UserSearchBox />}
            />

            {/* HIGH-DENSITY ANALYTICAL KPI METRICS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Platform Identities"
                    value={totalCount}
                    subtitle={hasActiveFilters ? `${filteredTotal} matching active filters` : "Global registered user pool"}
                    icon={<Users className="size-4 text-primary" />}
                    badge={
                        hasActiveFilters ? (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                Filtered
                            </span>
                        ) : undefined
                    }
                />

                <DashboardMetricCard
                    title="System Admins"
                    value={totalAdmins}
                    subtitle={`${superAdminCount} Super / ${adminCount} Org Admins`}
                    icon={<ShieldCheck className="size-4 text-indigo-500" />}
                    progress={Math.min(100, Math.max(10, (totalAdmins / Math.max(1, totalCount)) * 100))}
                />

                <DashboardMetricCard
                    title="Faculty & Staff"
                    value={teacherCount}
                    subtitle="Verified educators & instructors"
                    icon={<GraduationCap className="size-4 text-amber-500" />}
                    progress={Math.min(100, Math.max(10, (teacherCount / Math.max(1, totalCount)) * 100))}
                />

                <DashboardMetricCard
                    title="Students & Examinees"
                    value={studentCount}
                    subtitle="Active registered candidates"
                    icon={<User className="size-4 text-sky-500" />}
                    progress={Math.min(100, Math.max(10, (studentCount / Math.max(1, totalCount)) * 100))}
                />
            </div>

            {/* ROLE FILTER TABS & RESULTS SUMMARY BAR */}
            <div className="w-full space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                    {/* Interactive Role Tabs with Instant Optimistic Response */}
                    <UserTabs
                        activeRole={activeRole}
                        counts={{
                            total: totalCount,
                            superAdmin: superAdminCount,
                            admin: adminCount,
                            teacher: teacherCount,
                            student: studentCount
                        }}
                        q={q}
                        sort={sort}
                    />

                    {/* Ledger Range Summary */}
                    <div className="text-xs text-muted-foreground shrink-0">
                        {filteredTotal === 0 ? (
                            "No user records found"
                        ) : (
                            <>Showing <span className="font-semibold text-foreground">{(page - 1) * pageSize + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * pageSize, filteredTotal)}</span> of <span className="font-semibold text-foreground">{filteredTotal}</span> identities</>
                        )}
                    </div>
                </div>

                {/* STREAMING SUSPENSE BOUNDARY WITH SHIMMER SKELETON */}
                <Suspense
                    key={`${activeRole}-${sort}-${page}-${q}`}
                    fallback={<UserSkeletonList count={Math.min(5, Math.max(1, filteredTotal || 3))} />}
                >
                    <UsersLedger
                        q={q}
                        activeRole={activeRole}
                        sort={sort}
                        page={page}
                        pageSize={pageSize}
                        filteredTotal={filteredTotal}
                        isDeveloper={isDeveloper}
                    />
                </Suspense>
            </div>

            {/* INTEGRITY & PRIVACY PROTOCOL FOOTER */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Shield className="size-5" />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">Global RBAC Governance Protocol</h4>
                        <p className="text-[11px] text-muted-foreground">User privileges, Clerk authentication shards, and institutional assignments are cryptographically audited.</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold shrink-0">
                    GDPR & FERPA Compliant
                </Badge>
            </div>
        </DashboardPage>
    );
}
