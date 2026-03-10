"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function RolePieChart({ data }: { data: { name: string, value: number }[] }) {
    const COLORS = [
        '#6366f1', // Indigo
        '#f59e0b', // Amber/Primary
        '#10b981', // Emerald
        '#f43f5e', // Rose
        '#8b5cf6'  // Violet
    ];

    const total = data.reduce((acc, item) => acc + item.value, 0);

    return (
        <div className="h-[250px] w-full relative group/chart">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <span className="text-2xl font-black text-slate-800 dark:text-white">{total}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Personnel</span>
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
                                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-2xl flex flex-col gap-1 ring-1 ring-black/5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{payload[0].name}</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">{payload[0].value}</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">{((payload[0].value as number / total) * 100).toFixed(1)}% of total</p>
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
