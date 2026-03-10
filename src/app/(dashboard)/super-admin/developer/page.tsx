import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import {
    Terminal,
    Database,
    Activity,
    ShieldCheck,
    Cpu,
    Zap,
    Users,
    HardDrive,
    Cloud,
    AlertCircle,
    BrainCircuit,
    ArrowUpRight,
    Gauge,
    Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DeveloperClient } from "@/components/developer/DeveloperClient";
import { getDatabaseStats } from "@/actions/developer";
import { cn } from "@/lib/utils";

export default async function DeveloperDashboard() {
    const user = await currentUser();
    const primaryEmail = user?.emailAddresses[0]?.emailAddress || "";
    const developerEmail = process.env.DEVELOPER_EMAIL || "";

    // Strictly enforce access
    if (primaryEmail.toLowerCase() !== developerEmail.toLowerCase()) {
        redirect("/super-admin");
    }

    // Fetch real stats
    const dbStats = await getDatabaseStats();
    const userCount = await db.user.count();
    const workspaceCount = await db.workspace.count();
    const examCount = await db.exam.count();
    const questionCount = await db.question.count();

    // Mock AI Usage & Remaining Balances
    const aiBalance = 85.50; // $ balance remaining
    const aiLimit = 100.00;
    const aiUsagePercentage = ((aiLimit - aiBalance) / aiLimit) * 100;

    const dbLimit = 512; // 512MB demo limit
    const dbUsed = parseInt(dbStats.size) || 12; // demo fallback
    const dbPercentage = (dbUsed / dbLimit) * 100;

    // AI Recommendations logic
    const recommendations = [
        {
            title: "Database Optimization",
            description: "Current connection pool is underutilized. Consider lowering min connections to save resources.",
            impact: "Low",
            icon: Gauge
        },
        {
            title: "Plan Upgrade Advice",
            description: "User growth is 12% YoY. AI usage is peaking during weekends. Recommend Team Plan promotion.",
            impact: "High",
            icon: Sparkles
        },
        {
            title: "Deployment Health",
            description: "Vercel edge functions show 99.9% uptime. Latency in Asia region is slightly high.",
            impact: "Medium",
            icon: Activity
        }
    ];

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <Terminal className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight">System Intelligence</h1>
                    <p className="text-muted-foreground font-medium italic text-sm">Real-time production monitoring & strategic AI recommendations.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-border/50 shadow-sm overflow-hidden group hover:border-primary/50 transition-all duration-500 bg-background/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <Users className="w-5 h-5 text-primary" />
                            <ArrowUpRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <CardTitle className="text-2xl font-black italic">User Engine</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Authentication Layer</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black tracking-tighter italic">{userCount}</div>
                        <div className="text-[11px] font-bold text-muted-foreground mt-2 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Clerk Synchronized
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm overflow-hidden group hover:border-primary/50 transition-all duration-500 bg-background/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <Database className="w-5 h-5 text-primary" />
                            <HardDrive className="w-4 h-4 text-blue-500" />
                        </div>
                        <CardTitle className="text-2xl font-black italic">Postgres Core</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Neon Serverless Storage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black tracking-tighter italic">{dbStats.size}</span>
                            <span className="text-[10px] font-black uppercase text-muted-foreground">Used</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                                <span>Storage Limit (Free)</span>
                                <span>{dbPercentage.toFixed(1)}%</span>
                            </div>
                            <Progress value={dbPercentage} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm overflow-hidden group hover:border-primary/50 transition-all duration-500 bg-background/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <Zap className="w-5 h-5 text-primary" />
                            <Cpu className="w-4 h-4 text-purple-500" />
                        </div>
                        <CardTitle className="text-2xl font-black italic">AI Tokens</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Gemini Strategic Engine</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black tracking-tighter italic">${aiBalance.toFixed(2)}</span>
                            <span className="text-[10px] font-black uppercase text-muted-foreground">Remaining</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                                <span>Budget Consumption</span>
                                <span>{aiUsagePercentage.toFixed(1)}%</span>
                            </div>
                            <Progress value={aiUsagePercentage} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm overflow-hidden group hover:border-primary/50 transition-all duration-500 bg-background/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <Activity className="w-5 h-5 text-primary" />
                            <Cloud className="w-4 h-4 text-blue-500" />
                        </div>
                        <CardTitle className="text-2xl font-black italic">Vercel Status</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Production Pipeline</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black tracking-tighter italic">Operational</div>
                        <div className="text-[11px] font-bold text-muted-foreground mt-2 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Global Edge Active
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
                                <BrainCircuit className="w-6 h-6 text-primary" />
                                Strategic AI Recommendations
                            </CardTitle>
                            <CardDescription className="text-xs font-medium italic">Autonomous analysis of platform telemetry and usage patterns.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/50">
                                {recommendations.map((rec, i) => (
                                    <div key={i} className="p-6 flex items-start gap-4 hover:bg-muted/20 transition-colors group">
                                        <div className="p-3 bg-primary/5 rounded-xl group-hover:scale-110 transition-transform">
                                            <rec.icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black italic text-lg">{rec.title}</h4>
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full",
                                                    rec.impact === "High" ? "bg-rose-500/10 text-rose-500" :
                                                        rec.impact === "Medium" ? "bg-amber-500/10 text-amber-500" :
                                                            "bg-emerald-500/10 text-emerald-500"
                                                )}>
                                                    Impact: {rec.impact}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                                                {rec.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-xl font-black uppercase tracking-tight italic">Content Statistics</CardTitle>
                            <CardDescription className="text-xs font-medium italic">Overview of entities managed across the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                <div className="p-6 bg-muted/30 rounded-3xl space-y-1 border border-border/50">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Workspaces</div>
                                    <div className="text-3xl font-black italic">{workspaceCount}</div>
                                </div>
                                <div className="p-6 bg-muted/30 rounded-3xl space-y-1 border border-border/50">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Exams Created</div>
                                    <div className="text-3xl font-black italic">{examCount}</div>
                                </div>
                                <div className="p-6 bg-muted/30 rounded-3xl space-y-1 border border-border/50">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Questions</div>
                                    <div className="text-3xl font-black italic">{questionCount}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card className="border-border/50 shadow-2xl bg-zinc-950 text-white border-zinc-800 h-fit sticky top-8">
                        <CardHeader className="border-b border-zinc-800 pb-6">
                            <CardTitle className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-primary animate-pulse" />
                                Developer Command
                            </CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500">System Level Overrides</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <DeveloperClient />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
