import { LucideIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    badge?: string;
    badgeIcon?: LucideIcon;
    title: string | React.ReactNode;
    description?: string;
    align?: "left" | "center";
    className?: string;
    titleClassName?: string;
    light?: boolean;
}

export default function SectionHeader({
    badge,
    badgeIcon: BadgeIcon = Star,
    title,
    description,
    align = "center",
    className,
    titleClassName,
    light = false,
}: SectionHeaderProps) {
    return (
        <div
            className={cn(
                "space-y-3 max-w-3xl mb-8 sm:mb-10",
                align === "center" ? "mx-auto text-center" : "text-left",
                className
            )}
        >
            {badge && (
                <div
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold",
                        light
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-primary/10 border-primary/20 text-primary",
                        align === "center" && "mx-auto"
                    )}
                >
                    <BadgeIcon className={cn("size-3.5", !light && "fill-primary/20 text-primary")} />
                    <span>{badge}</span>
                </div>
            )}

            <h2
                className={cn(
                    "text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight",
                    light ? "text-white" : "text-foreground",
                    titleClassName
                )}
            >
                {title}
            </h2>

            {description && (
                <p
                    className={cn(
                        "text-xs sm:text-sm md:text-base text-muted-foreground font-normal leading-relaxed max-w-2xl",
                        light ? "text-zinc-300" : "text-muted-foreground",
                        align === "center" && "mx-auto"
                    )}
                >
                    {description}
                </p>
            )}
        </div>
    );
}
