import { cn } from "@/lib/utils";

export function RequestCardSkeleton() {
    return (
        <div className="relative overflow-hidden border border-border/50 bg-card/60 rounded-xl p-3.5 sm:p-4 shadow-2xs">
            {/* Left status color bar skeleton */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-foreground/20" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pl-1">
                {/* Applicant info skeleton */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-muted animate-pulse shrink-0" />
                    <div className="space-y-2 min-w-0">
                        <div className="h-4 w-36 bg-muted rounded-md animate-pulse" />
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-40 bg-muted/80 rounded animate-pulse" />
                            <div className="h-3 w-20 bg-muted/60 rounded animate-pulse hidden md:block" />
                        </div>
                    </div>
                </div>

                {/* Workspace info skeleton */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
                    <div className="h-6 w-28 bg-muted rounded-lg animate-pulse" />
                    <div className="h-5 w-16 bg-muted/70 rounded-full animate-pulse" />
                    <div className="h-8 w-24 bg-muted rounded-xl animate-pulse ml-auto sm:ml-0" />
                </div>
            </div>
        </div>
    );
}

export function RequestSkeletonList({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-2.5">
            {/* Top subtle streaming pulse line */}
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse rounded-full" />
            {Array.from({ length: count }).map((_, i) => (
                <RequestCardSkeleton key={i} />
            ))}
        </div>
    );
}
