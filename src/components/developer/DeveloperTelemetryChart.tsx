"use client";

import { useState } from "react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Layers, TrendingUp, Cpu, Server, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DailyActivityMetric {
    dayLabel: string;
    fullDate: string;
    examAttempts: number;
    userSignups: number;
    noticesSent: number;
    totalEvents: number;
}

export interface ResourceShardMetric {
    name: string;
    used: string;
    limit: string;
    percentage: number;
    color: string;
}

interface DeveloperTelemetryChartProps {
    activityData: DailyActivityMetric[];
    resourceShards: ResourceShardMetric[];
}

export function DeveloperTelemetryChart({
    activityData,
    resourceShards
}: DeveloperTelemetryChartProps) {
    const [viewMode, setViewMode] = useState<"activity" | "resources">("activity");

    const total7dEvents = activityData.reduce((acc, curr) => acc + curr.totalEvents, 0);
    const total7dExams = activityData.reduce((acc, curr) => acc + curr.examAttempts, 0);
    const total7dUsers = activityData.reduce((acc, curr) => acc + curr.userSignups, 0);

    return (
        <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs space-y-4">
            {/* Chart Toolbar / Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
                <div>
                    <h3 className="text-sm font-extrabold text-foreground tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Platform Telemetry & Workload Dynamics
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {viewMode === "activity"
                            ? "Rolling 7-day traffic velocity, user registrations, and examination cycles."
                            : "Subsystem resource limits, serverless connection quotas, and memory consumption."}
                    </p>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/50 p-1 rounded-xl border border-border/60">
                    <button
                        type="button"
                        onClick={() => setViewMode("activity")}
                        className={cn(
                            "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                            viewMode === "activity"
                                ? "bg-background text-foreground shadow-2xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        <span>7D Traffic Velocity</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("resources")}
                        className={cn(
                            "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                            viewMode === "resources"
                                ? "bg-background text-foreground shadow-2xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Layers className="w-3.5 h-3.5 text-blue-500" />
                        <span>Shard Capacities</span>
                    </button>
                </div>
            </div>

            {/* View Mode 1: Activity Area Chart */}
            {viewMode === "activity" && (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                                <span className="font-semibold">Exams ({total7dExams})</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                <span className="font-semibold">Signups ({total7dUsers})</span>
                            </div>
                        </div>

                        <Badge variant="outline" className="text-[10px] font-mono border-border/60 text-muted-foreground">
                            {total7dEvents} Total Interactions (7 Days)
                        </Badge>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="primaryEventGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="userSignupGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                                <XAxis
                                    dataKey="dayLabel"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "currentColor" }}
                                    className="text-muted-foreground font-medium"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "currentColor" }}
                                    className="text-muted-foreground font-medium"
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload as DailyActivityMetric;
                                            return (
                                                <div className="p-3 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl text-xs space-y-1.5 min-w-[150px]">
                                                    <p className="font-black text-foreground">{data.fullDate}</p>
                                                    <div className="space-y-1 pt-1 border-t border-border/40">
                                                        <div className="flex justify-between items-center text-primary font-bold">
                                                            <span>Exam Submissions:</span>
                                                            <span>{data.examAttempts}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-indigo-500 font-bold">
                                                            <span>New Signups:</span>
                                                            <span>{data.userSignups}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-foreground font-extrabold pt-1 border-t border-border/40">
                                                            <span>Total Events:</span>
                                                            <span>{data.totalEvents}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="examAttempts"
                                    stroke="var(--color-primary, #6366f1)"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#primaryEventGradient)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="userSignups"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    fillOpacity={1}
                                    fill="url(#userSignupGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* View Mode 2: Resource Shard Capacity Bars */}
            {viewMode === "resources" && (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {resourceShards.map((shard, i) => (
                            <div
                                key={i}
                                className="p-3.5 rounded-xl bg-muted/20 border border-border/50 space-y-2 hover:border-border transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">{shard.name}</span>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[9.5px] font-bold font-mono px-2 py-0.5",
                                            shard.percentage > 80
                                                ? "border-rose-500/30 text-rose-500 bg-rose-500/5"
                                                : shard.percentage > 50
                                                ? "border-amber-500/30 text-amber-500 bg-amber-500/5"
                                                : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                                        )}
                                    >
                                        {shard.percentage.toFixed(1)}%
                                    </Badge>
                                </div>

                                <div className="flex items-baseline justify-between text-xs text-muted-foreground font-medium">
                                    <span>Used: <strong className="text-foreground">{shard.used}</strong></span>
                                    <span>Limit: {shard.limit}</span>
                                </div>

                                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, Math.max(0, shard.percentage))}%`,
                                            backgroundColor: shard.color
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
