export function UserRowSkeleton() {
    return (
        <div className="relative overflow-hidden border border-border/50 bg-card/60 rounded-xl p-3 sm:p-3.5 shadow-2xs">
            {/* Left role accent strip skeleton */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-foreground/20" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pl-1">
                {/* User avatar and identity */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-muted animate-pulse shrink-0" />
                    <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-32 bg-muted rounded-md animate-pulse" />
                            <div className="h-4 w-16 bg-muted/60 rounded-full animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-40 bg-muted/80 rounded animate-pulse" />
                            <div className="h-3 w-20 bg-muted/60 rounded animate-pulse hidden md:block" />
                        </div>
                    </div>
                </div>

                {/* Badges and actions skeleton */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap ml-auto sm:ml-0">
                    <div className="h-6 w-20 bg-muted rounded-lg animate-pulse" />
                    <div className="h-6 w-24 bg-muted/70 rounded-lg animate-pulse hidden sm:block" />
                    <div className="size-8 rounded-lg bg-muted animate-pulse" />
                </div>
            </div>
        </div>
    );
}

export function UserSkeletonList({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-2.5">
            {/* Subtle top streaming pulse indicator */}
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse rounded-full" />
            {Array.from({ length: count }).map((_, i) => (
                <UserRowSkeleton key={i} />
            ))}
        </div>
    );
}
