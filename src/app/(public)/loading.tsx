export default function PublicLoading() {
    return (
        <div className="w-full flex-1 animate-in fade-in duration-300">
            {/* Top Loading Shimmer Bar */}
            <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse z-[60]" />

            {/* Hero Section Skeleton */}
            <section className="relative pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 overflow-hidden bg-background border-b border-border/50">
                <div className="container mx-auto max-w-4xl text-center space-y-4">
                    {/* Badge Pill Skeleton */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <div className="size-3 rounded-full bg-primary/40 animate-ping" />
                        <div className="h-3 w-28 rounded-full bg-primary/30 animate-pulse" />
                    </div>

                    {/* Title Skeleton */}
                    <div className="space-y-2">
                        <div className="h-10 sm:h-12 w-4/5 max-w-xl rounded-2xl bg-muted/70 animate-pulse mx-auto" />
                    </div>

                    {/* 2-Line Description Skeleton */}
                    <div className="space-y-2 max-w-xl mx-auto pt-1">
                        <div className="h-3.5 w-full rounded-md bg-muted/50 animate-pulse mx-auto" />
                        <div className="h-3.5 w-4/5 rounded-md bg-muted/40 animate-pulse mx-auto" />
                    </div>
                </div>
            </section>

            {/* Content Cards Skeleton Grid */}
            <section className="py-12 sm:py-16 px-4 sm:px-6">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                        {[1, 2, 3].map((card) => (
                            <div
                                key={card}
                                className="p-6 rounded-2xl border border-border/60 bg-card shadow-xs space-y-5 flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 animate-pulse" />
                                        <div className="h-4 w-20 rounded-full bg-muted/60 animate-pulse" />
                                    </div>
                                    <div className="h-5 w-2/3 rounded-lg bg-muted/80 animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="h-3 w-full rounded-md bg-muted/50 animate-pulse" />
                                        <div className="h-3 w-5/6 rounded-md bg-muted/40 animate-pulse" />
                                    </div>

                                    <div className="pt-3 border-t border-border/40 space-y-2.5">
                                        {[1, 2, 3].map((item) => (
                                            <div key={item} className="flex items-center gap-2.5">
                                                <div className="size-3.5 rounded-full bg-primary/20 shrink-0" />
                                                <div className="h-3 w-3/4 rounded-md bg-muted/40 animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-9.5 w-full rounded-xl bg-muted/70 animate-pulse mt-4" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
