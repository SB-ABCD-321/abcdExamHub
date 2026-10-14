"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function RolePieChart({ 
    data, 
    centerLabel = "Total" 
}: { 
    data: { name: string; value: number }[]; 
    centerLabel?: string;
}) {
    const COLORS = [
        '#6366f1', // Indigo
        '#f59e0b', // Amber/Primary
        '#10b981', // Emerald
        '#f43f5e', // Rose
        '#8b5cf6'  // Violet
    ];

    const total = data.reduce((acc, item) => acc + item.value, 0);

    if (total === 0) {
        return (
            <div className="h-[250px] w-full flex flex-col items-center justify-center text-center p-4">
                <div className="size-16 rounded-full border-4 border-dashed border-muted flex items-center justify-center text-muted-foreground mb-3">
                    <span className="text-sm font-bold">0</span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">No allocation data recorded yet</p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5">Enrollees and exams will appear here</p>
            </div>
        );
    }

    return (
        <div className="h-[250px] w-full relative group/chart">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <span className="text-2xl font-black text-foreground">{total}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{centerLabel}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        stroke="none"
                        paddingAngle={6}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-popover/95 backdrop-blur-xl border border-border p-3.5 rounded-xl shadow-xl flex flex-col gap-1 ring-1 ring-black/5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{payload[0].name}</p>
                                        <p className="text-xl font-black text-foreground">{payload[0].value}</p>
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">{total > 0 ? ((payload[0].value as number / total) * 100).toFixed(1) : 0}% of total</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />

                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
