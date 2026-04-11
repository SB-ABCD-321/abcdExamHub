import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Zap, ShieldCheck, IndianRupee, TrendingUp } from "lucide-react";
import { getPricingPlansForSelection } from "@/actions/financial-actions";
import { RecordPaymentModal } from "@/components/super-admin/RecordPaymentModal";
import { LedgerExport } from "@/components/super-admin/LedgerExport";
import { WorkspacePaymentsTable } from "@/components/super-admin/WorkspacePaymentsTable";
import { cn } from "@/lib/utils";

export default async function SuperAdminPaymentsPage() {
    const { userId } = await auth();
    if (!userId) return notFound();

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        select: { role: true }
    });

    if (!user || user.role !== "SUPER_ADMIN") return notFound();

    const [payments, workspaces, plans] = await Promise.all([
        db.workspacePayment.findMany({
            orderBy: { paymentDate: 'desc' },
            include: {
                workspace: {
                    select: {
                        name: true,
                        gstNumber: true,
                        contactEmail: true
                    }
                }
            }
        }),
        db.workspace.findMany({
            include: {
                payments: {
                    orderBy: { paymentDate: 'desc' },
                },
                _count: {
                    select: { payments: true }
                }
            },
            orderBy: { name: 'asc' }
        }),
        getPricingPlansForSelection()
    ]);

    // Financial Analysis
    const totalRevenue = payments.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
    const totalGst = payments.reduce((sum: number, p: any) => sum + p.gstAmount, 0);
    const pendingRequestsCount = await db.workspaceRequest.count({ where: { status: 'PENDING' } });

    return (
        <div className="space-y-10 pb-12 max-w-7xl mx-auto">
             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 relative z-10 pb-2 border-b border-slate-100 dark:border-zinc-800/50">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                        Financial <span className="text-primary font-black">Hub</span>
                    </h1>
                    <p className="text-muted-foreground font-bold text-sm md:text-lg max-w-xl italic">
                        Unified ledger for institutional node auditing and revenue optimization.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto shrink-0 mt-4 lg:mt-0">
                    <LedgerExport payments={payments} />
                    <RecordPaymentModal 
                        workspaces={workspaces.map(ws => ({ id: ws.id, name: ws.name, contactEmail: ws.contactEmail }))} 
                        plans={plans} 
                    />
                    <div className="flex items-center justify-center gap-3 px-6 h-11 bg-white dark:bg-zinc-800 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-indigo-100 dark:border-indigo-900/30 whitespace-nowrap hidden sm:flex">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60 dark:text-indigo-200/60">Gross Vol</span>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums">₹{totalRevenue.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Metric Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    title="Gross Revenue" 
                    value={`₹${totalRevenue.toLocaleString()}`} 
                    subtitle="Platform LTV Aggregate" 
                    icon={IndianRupee} 
                    color="primary"
                />
                <MetricCard 
                    title="Compliance Pool" 
                    value={`₹${totalGst.toLocaleString()}`} 
                    subtitle="GST Held for Submission" 
                    icon={ShieldCheck} 
                    color="emerald"
                />
                <MetricCard 
                    title="Fulfillment" 
                    value={pendingRequestsCount.toString()} 
                    subtitle="Pending Access Requests" 
                    icon={Zap} 
                    color="amber"
                />
            </div>

            {/* The Unified Table Hub */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-lg">
                            <History className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black uppercase tracking-widest text-slate-950 dark:text-white">Unified Ledger</h2>
                    </div>
                    <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border-none px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest">
                        {workspaces.length} Registered Nodes
                    </Badge>
                </div>

                <WorkspacePaymentsTable workspaces={workspaces} />
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtitle, icon: Icon, color }: any) {
    const colors: any = {
        primary: "bg-primary/10 text-primary border-primary/20 shadow-primary/10",
        emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-emerald-500/10",
        amber: "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-amber-500/10",
    }

    return (
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className={cn("p-4 rounded-2xl border shadow-lg transition-all group-hover:scale-110", colors[color] || colors.primary)}>
                        <Icon size={24} className="stroke-[2.5]" />
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">{title}</p>
                    <h3 className="text-3xl font-black tracking-tighter text-slate-950 dark:text-white tabular-nums group-hover:translate-x-1 transition-transform origin-left">{value}</h3>
                    <p className="text-xs font-bold text-slate-500 italic opacity-60 uppercase tracking-widest">{subtitle}</p>
                </div>
            </CardContent>
        </Card>
    );
}
