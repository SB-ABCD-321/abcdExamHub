import { Suspense } from "react";
import { getWorkspaceRequestCounts } from "@/actions/workspace-request";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, History, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { RequestSearchBox } from "./request-search-box";
import { RequestTabs } from "./request-tabs";
import { RequestsLedger } from "./requests-ledger";
import { RequestSkeletonList } from "./request-skeleton";

interface SuperAdminRequestsPageProps {
    searchParams?: Promise<{ tab?: string; page?: string; q?: string }>;
}

export default async function SuperAdminRequestsPage(props: SuperAdminRequestsPageProps) {
    const searchParams = (await props.searchParams) || {};
    const q = searchParams.q?.trim() || "";
    const activeTab = searchParams.tab === 'approved' ? 'approved' : searchParams.tab === 'rejected' ? 'rejected' : 'pending';
    const currentPage = Math.max(1, Number(searchParams.page) || 1);
    const pageSize = 10;

    // Fast indexed count aggregation for badges and analytical metrics (with search filtering)
    const counts = await getWorkspaceRequestCounts(q);
    const totalRequests = counts.total;
    const processedTotal = counts.approved + counts.rejected;
    const approvalRate = processedTotal > 0 ? Math.round((counts.approved / processedTotal) * 100) : 100;

    // Active count for pagination and status indicators
    const activeCount = activeTab === 'approved' ? counts.approved : activeTab === 'rejected' ? counts.rejected : counts.pending;

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header with Smart Search Box */}
            <DashboardHeader
                title={<>Governance & <span className="text-primary font-black">Audit Hub</span></>}
                subtitle="Centralized institutional requisition ledger, compliance audits, and node provisioning."
                actions={<RequestSearchBox />}
            />

            {/* ANALYTICAL KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Pending Requisitions"
                    value={counts.pending}
                    subtitle={counts.pending > 0 ? "Awaiting institutional review" : "All submissions audited"}
                    icon={<Clock className={cn("size-4", counts.pending > 0 ? "text-amber-500" : "text-muted-foreground")} />}
                    badge={
                        counts.pending > 0 ? (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {counts.pending} In Queue
                            </span>
                        ) : (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Up to Date
                            </span>
                        )
                    }
                />

                <DashboardMetricCard
                    title="Authorized Workspaces"
                    value={counts.approved}
                    subtitle="Active provisioned nodes"
                    icon={<ShieldCheck className="size-4 text-emerald-500" />}
                    progress={Math.min(100, Math.max(15, (counts.approved / Math.max(1, totalRequests)) * 100))}
                />

                <DashboardMetricCard
                    title="Declined Requisitions"
                    value={counts.rejected}
                    subtitle="Archived refusal audit logs"
                    icon={<History className="size-4 text-rose-500" />}
                />

                <DashboardMetricCard
                    title="Approval Conversion"
                    value={`${approvalRate}%`}
                    subtitle={`${counts.approved} of ${processedTotal || 1} processed`}
                    icon={<TrendingUp className="size-4 text-primary" />}
                    progress={approvalRate}
                />
            </div>

            {/* TABBED REQUISITIONS LEDGER WITH PAGINATION & SMART SEARCH */}
            <div className="w-full space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                    {/* Interactive Tab Navigation with Instant Optimistic Feedback */}
                    <RequestTabs
                        activeTab={activeTab}
                        counts={counts}
                        q={q}
                    />

                    <div className="text-xs text-muted-foreground shrink-0">
                        {activeCount === 0 ? (
                            "No requisitions in this ledger"
                        ) : (
                            <>Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold text-foreground">{Math.min(currentPage * pageSize, activeCount)}</span> of <span className="font-semibold text-foreground">{activeCount}</span> entries</>
                        )}
                    </div>
                </div>

                {/* STREAMING SUSPENSE BOUNDARY WITH SHIMMER SKELETON */}
                <Suspense
                    key={`${activeTab}-${currentPage}-${q}`}
                    fallback={<RequestSkeletonList count={Math.min(5, Math.max(1, activeCount || 3))} />}
                >
                    <RequestsLedger
                        activeTab={activeTab}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        activeCount={activeCount}
                        q={q}
                    />
                </Suspense>
            </div>

            {/* INTEGRITY & COMPLIANCE FOOTER PROTOCOL */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-5" />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">Institutional Integrity Protocol Active</h4>
                        <p className="text-[11px] text-muted-foreground">Every approved workspace instantly provisions a dedicated tenant shard with isolated RBAC policies.</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold shrink-0">
                    Audit Certified
                </Badge>
            </div>
        </DashboardPage>
    );
}
