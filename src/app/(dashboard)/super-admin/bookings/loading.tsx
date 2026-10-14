import { DashboardPage } from "@/components/layout/DashboardTemplate";

export default function SuperAdminBookingsLoading() {
    return (
        <DashboardPage>
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="space-y-2">
                    <div className="h-7 w-64 bg-muted rounded-lg animate-pulse" />
                    <div className="h-4 w-96 max-w-full bg-muted/60 rounded-md animate-pulse" />
                </div>
                <div className="h-8.5 w-36 bg-muted rounded-xl animate-pulse" />
            </div>

            {/* KPI Metric Cards Skeleton */}
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

            {/* Toolbar Skeleton */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60">
                <div className="h-8 w-full sm:w-72 bg-muted/70 rounded-lg animate-pulse" />
                <div className="h-8 w-64 bg-muted/60 rounded-lg animate-pulse" />
            </div>

            {/* Cards Skeleton List */}
            <div className="space-y-2.5">
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse rounded-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border border-border/50 bg-card/60 rounded-xl p-4 shadow-2xs flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-xl bg-muted animate-pulse shrink-0" />
                            <div className="space-y-2">
                                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                                <div className="h-3 w-56 bg-muted/70 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-20 bg-muted rounded-full animate-pulse hidden sm:block" />
                            <div className="size-8 bg-muted rounded-lg animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </DashboardPage>
    );
}
