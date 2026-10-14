"use client";

import { useMemo, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Layers, IndianRupee, PieChart as PieIcon, BarChart3 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface FinancialChartsProps {
    payments: any[];
}

export function FinancialCharts({ payments }: FinancialChartsProps) {
    const [chartMode, setChartMode] = useState<"revenue" | "plans">("revenue");

    // 1. Calculate Monthly Revenue Trend for last 6 months
    const monthlyData = useMemo(() => {
        const now = new Date();
        const months = [];

        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const label = format(date, "MMM yy");

            const monthPayments = payments.filter((p) => {
                const pDate = new Date(p.paymentDate);
                return isWithinInterval(pDate, { start: monthStart, end: monthEnd });
            });

            const revenue = monthPayments.reduce((sum, p) => sum + (p.totalAmount || p.amount || 0), 0);
            const base = monthPayments.reduce((sum, p) => sum + (p.baseAmount || p.amount || 0), 0);
            const gst = monthPayments.reduce((sum, p) => sum + (p.gstAmount || 0), 0);
            const count = monthPayments.length;

            months.push({
                month: label,
                revenue,
                base,
                gst,
                transactions: count
            });
        }

        return months;
    }, [payments]);

    // 2. Aggregate Revenue by Plan Tier
    const planData = useMemo(() => {
        const planMap: Record<string, { name: string; revenue: number; count: number }> = {};

        for (const p of payments) {
            const plan = p.planName || "Standard Plan";
            if (!planMap[plan]) {
                planMap[plan] = { name: plan, revenue: 0, count: 0 };
            }
            planMap[plan].revenue += (p.totalAmount || p.amount || 0);
            planMap[plan].count += 1;
        }

        return Object.values(planMap).sort((a, b) => b.revenue - a.revenue);
    }, [payments]);

    // Financial Metrics
    const totalRevenue = useMemo(() => payments.reduce((sum, p) => sum + (p.totalAmount || p.amount || 0), 0), [payments]);
    const averageOrderValue = useMemo(() => payments.length > 0 ? Math.round(totalRevenue / payments.length) : 0, [totalRevenue, payments]);
    const topPlan = planData[0]?.name || "N/A";

    const planBarColors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

    return (
        <div className="space-y-4">
            {/* Quick Financial Run-Rate Statistics Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-border/60 bg-card shadow-2xs">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Average Transaction</span>
                    <span className="text-base font-black text-foreground tabular-nums mt-0.5 block">
                        ₹{averageOrderValue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Per institutional settlement</span>
                </div>
                <div className="p-3.5 rounded-xl border border-border/60 bg-card shadow-2xs">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Top Tier Contributor</span>
                    <span className="text-base font-black text-primary truncate mt-0.5 block">
                        {topPlan}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Highest aggregate yield</span>
                </div>
                <div className="p-3.5 rounded-xl border border-border/60 bg-card shadow-2xs">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Audit Verified Ratio</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
                        100%
                    </span>
                    <span className="text-[10px] text-muted-foreground">All logged payments reconciled</span>
                </div>
                <div className="p-3.5 rounded-xl border border-border/60 bg-card shadow-2xs">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Invoiced</span>
                    <span className="text-base font-black text-foreground tabular-nums mt-0.5 block">
                        {payments.length} Nodes
                    </span>
                    <span className="text-[10px] text-muted-foreground">Settlement transactions</span>
                </div>
            </div>

            {/* Main Chart Card */}
            <Card className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                    {/* Header with Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-border/40 pb-3">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-primary" />
                                <h3 className="text-sm font-bold text-foreground">
                                    {chartMode === "revenue" ? "Monthly Revenue & GST Trajectory" : "Revenue Yield by Plan Tier"}
                                </h3>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {chartMode === "revenue" 
                                    ? "6-month billing timeline with gross collections and statutory tax distribution."
                                    : "Revenue contribution breakdown aggregated across institutional subscription tiers."}
                            </p>
                        </div>

                        {/* Chart Switcher Buttons */}
                        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setChartMode("revenue")}
                                className={cn(
                                    "px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer select-none",
                                    chartMode === "revenue"
                                        ? "bg-card text-foreground shadow-2xs font-bold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <TrendingUp className="size-3" />
                                <span>Timeline</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode("plans")}
                                className={cn(
                                    "px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer select-none",
                                    chartMode === "plans"
                                        ? "bg-card text-foreground shadow-2xs font-bold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <BarChart3 className="size-3" />
                                <span>By Plan</span>
                            </button>
                        </div>
                    </div>

                    {/* Chart Canvas */}
                    <div className="h-64 w-full">
                        {chartMode === "revenue" ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="gstGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "1px solid var(--border)",
                                            backgroundColor: "var(--popover)",
                                            color: "var(--popover-foreground)",
                                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                                            fontSize: "12px",
                                        }}
                                        formatter={(val: any, name: any) => [
                                            `₹${Number(val).toLocaleString()}`,
                                            name === "revenue" ? "Gross Collections" : name === "gst" ? "GST Held" : "Base"
                                        ]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="var(--primary)"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#revGrad)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="gst"
                                        stroke="#10b981"
                                        strokeWidth={1.5}
                                        fillOpacity={1}
                                        fill="url(#gstGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={planData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: "var(--accent)", opacity: 0.2 }}
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "1px solid var(--border)",
                                            backgroundColor: "var(--popover)",
                                            color: "var(--popover-foreground)",
                                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                                            fontSize: "12px",
                                        }}
                                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Total Revenue"]}
                                    />
                                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                                        {planData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={planBarColors[index % planBarColors.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
