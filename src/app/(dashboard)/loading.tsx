export default function DashboardLoading() {
    return (
        <div className="w-full space-y-4 sm:space-y-5 pb-10 animate-in fade-in duration-200">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                <div className="space-y-2">
                    <div className="h-7 w-56 rounded-xl bg-muted/70 animate-pulse" />
                    <div className="h-3.5 w-80 rounded-md bg-muted/50 animate-pulse" />
                </div>
                <div className="flex gap-2">
                    <div className="h-8 w-24 rounded-xl bg-muted/60 animate-pulse" />
                    <div className="h-8 w-28 rounded-xl bg-primary/20 animate-pulse" />
                </div>
            </div>

            {/* Metric Cards Skeleton */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border border-border/60 bg-card rounded-2xl p-4 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="h-3 w-20 rounded-full bg-muted/70 animate-pulse" />
                            <div className="size-4 rounded-md bg-muted/60 animate-pulse" />
                        </div>
                        <div className="h-7 w-16 rounded-lg bg-muted/80 animate-pulse" />
                        <div className="h-3 w-28 rounded-md bg-muted/50 animate-pulse" />
                        <div className="h-4 w-20 rounded-full bg-primary/10 animate-pulse" />
                    </div>
                ))}
            </div>

            {/* Content Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-border/60 bg-card rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="size-10 rounded-xl bg-primary/10 animate-pulse border border-primary/20" />
                            <div className="h-5 w-16 rounded-full bg-muted/60 animate-pulse" />
                        </div>
                        <div className="h-5 w-3/4 rounded-lg bg-muted/80 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-3 w-full rounded-md bg-muted/50 animate-pulse" />
                            <div className="h-3 w-4/5 rounded-md bg-muted/40 animate-pulse" />
                        </div>
                        <div className="h-8 w-full rounded-xl bg-muted/60 animate-pulse mt-2" />
                    </div>
                ))}
            </div>

            {/* Table/List Skeleton */}
            <div className="border border-border/60 bg-card rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/40 flex items-center justify-between">
                    <div className="h-5 w-32 rounded-lg bg-muted/70 animate-pulse" />
                    <div className="h-8 w-24 rounded-xl bg-muted/60 animate-pulse" />
                </div>
                <div className="divide-y divide-border/40">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="px-4 py-3 flex items-center gap-4">
                            <div className="size-8 rounded-lg bg-muted/60 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 w-48 rounded-md bg-muted/70 animate-pulse" />
                                <div className="h-3 w-32 rounded-md bg-muted/40 animate-pulse" />
                            </div>
                            <div className="h-5 w-16 rounded-full bg-muted/50 animate-pulse" />
                            <div className="h-7 w-14 rounded-lg bg-muted/60 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
