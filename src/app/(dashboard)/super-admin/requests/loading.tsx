import { DashboardPage } from "@/components/layout/DashboardTemplate";
import { RequestSkeletonList } from "./request-skeleton";

export default function SuperAdminRequestsLoading() {
    return (
        <DashboardPage>
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="space-y-2">
                    <div className="h-7 w-64 bg-muted rounded-lg animate-pulse" />
                    <div className="h-4 w-96 max-w-full bg-muted/60 rounded-md animate-pulse" />
                </div>
                <div className="h-9 w-72 bg-muted/70 rounded-xl animate-pulse" />
            </div>

            {/* KPI Metrics Skeleton */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-3.5 w-24 bg-muted rounded animate-pulse" />
                            <div className="size-8 rounded-xl bg-muted animate-pulse" />
                        </div>
                        <div className="h-7 w-16 bg-muted rounded-md animate-pulse" />
                        <div className="h-3 w-32 bg-muted/60 rounded animate-pulse" />
                    </div>
                ))}
            </div>

            {/* Tab Bar Skeleton */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="h-10 w-72 bg-muted/60 rounded-xl animate-pulse" />
                <div className="h-4 w-32 bg-muted/50 rounded animate-pulse hidden sm:block" />
            </div>

            {/* Request List Skeleton */}
            <RequestSkeletonList count={5} />
        </DashboardPage>
    );
}
