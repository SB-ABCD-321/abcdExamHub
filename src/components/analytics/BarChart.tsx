"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function EntityBarChart({ 
    data, 
    title, 
    description, 
    dataKey, 
    nameKey, 
    color = "#f59e0b",
    noCard = false,
}: { 
    data: any[]; 
    title?: string; 
    description?: string; 
    dataKey: string; 
    nameKey: string; 
    color?: string;
    noCard?: boolean;
}) {
    const chartContent = (
        <div className="h-full w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                    <XAxis
                        dataKey={nameKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                    />
                    <Tooltip 
                        cursor={{ fill: 'var(--accent)', opacity: 0.3 }} 
                        contentStyle={{ 
                            borderRadius: '12px', 
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--popover)',
                            color: 'var(--popover-foreground)',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                        }} 
                    />
                    <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );

    if (noCard || !title) {
        return chartContent;
    }

    return (
        <Card className="col-span-full md:col-span-2 lg:col-span-3 border border-border/60 bg-card rounded-2xl shadow-xs">
            <CardHeader className="p-5 pb-2">
                <CardTitle className="text-base font-bold tracking-tight">{title}</CardTitle>
                {description && <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>}
            </CardHeader>
            <CardContent className="p-5 pt-0">
                <div className="h-[280px] w-full mt-2">
                    {chartContent}
                </div>
            </CardContent>
        </Card>
    );
}
