"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DashboardPageProps {
    children: React.ReactNode;
    className?: string;
}

interface DashboardHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function DashboardPage({ children, className }: DashboardPageProps) {
    return (
        <div className={cn("w-full space-y-4 sm:space-y-5 pb-10", className)}>
            {children}
        </div>
    );
}

export function DashboardHeader({
    title,
    subtitle,
    badge,
    actions,
    className,
}: DashboardHeaderProps) {
    return (
        <div className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40",
            className
        )}>
            <div className="flex flex-col gap-1 min-w-0">
                {badge && (
                    <div className="flex items-center gap-2 mb-0.5">
                        {badge}
                    </div>
                )}
                <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-foreground font-sans leading-none">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-muted-foreground text-xs sm:text-[13px] font-normal leading-normal truncate">
                        {subtitle}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    badge?: React.ReactNode;
    progress?: number;
    className?: string;
}

export function DashboardMetricCard({
    title,
    value,
    subtitle,
    icon,
    badge,
    progress,
    className,
}: MetricCardProps) {
    return (
        <div className={cn(
            "border border-border/60 bg-card rounded-2xl p-4 shadow-2xs hover:shadow-sm hover:border-primary/40 transition-all space-y-2",
            className
        )}>
            <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                    {title}
                </span>
                {icon && <div className="shrink-0">{icon}</div>}
            </div>
            
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {value}
            </div>

            {(subtitle !== undefined || progress !== undefined) && (
                <div className="space-y-1 pt-0.5">
                    {subtitle && (
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                            {subtitle}
                            {badge && <span className="shrink-0">{badge}</span>}
                        </div>
                    )}
                    {progress !== undefined && (
                        <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
