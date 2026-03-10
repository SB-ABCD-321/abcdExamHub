import { LucideIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    badge?: string;
    badgeIcon?: LucideIcon;
    title: string | React.ReactNode;
    description?: string;
    align?: "left" | "center";
    className?: string;
    light?: boolean;
}

export default function SectionHeader({
    badge,
    badgeIcon: BadgeIcon = Star,
    title,
    description,
    align = "center",
    className,
    light = false,
}: SectionHeaderProps) {
    return (
        <div
            className={cn(
                "space-y-6 max-w-3xl mb-16",
                align === "center" ? "mx-auto text-center" : "text-left",
                className
            )}
        >
            {badge && (
                <div
                    className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                        light
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-primary/10 border-primary/20 text-primary",
                        align === "center" && "mx-auto"
                    )}
                >
                    <BadgeIcon className={cn("w-3.5 h-3.5", !light && "fill-primary")} />
                    <span>{badge}</span>
                </div>
            )}

            <h2
                className={cn(
                    "text-4xl md:text-6xl font-sans font-bold tracking-tight leading-[1] text-balance",
                    light ? "text-white" : "text-zinc-950 dark:text-white"
                )}
            >
                {title}
            </h2>

            {description && (
                <p
                    className={cn(
                        "text-lg italic font-medium leading-relaxed max-w-2xl",
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
