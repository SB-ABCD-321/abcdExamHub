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
import { PaymentVerificationQueue } from "@/components/super-admin/PaymentVerificationQueue";
import { cn } from "@/lib/utils";
import { PaymentStatus } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function SuperAdminPaymentsPage() {
    const { userId } = await auth();
    if (!userId) return notFound();

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        select: { role: true }
    });

    if (!user || user.role !== "SUPER_ADMIN") return notFound();

    const [payments, workspaces, plans, pendingVerifications] = await Promise.all([
        db.workspacePayment.findMany({
            where: { status: PaymentStatus.PAID },
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
                    where: { status: PaymentStatus.PAID },
                    orderBy: { paymentDate: 'desc' },
                },
                _count: {
                    select: { payments: { where: { status: PaymentStatus.PAID } } }
                }
            },
            orderBy: { name: 'asc' }
        }),
        getPricingPlansForSelection(),
        db.workspacePayment.findMany({
            where: { status: PaymentStatus.PENDING_VERIFICATION },
            include: { workspace: true },
            orderBy: { createdAt: 'desc' }
        })
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
                    <div className="flex items-center justify-center gap-3 px-6 h-11 bg-white dark:bg-zinc-800 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-indigo-100 dark:border-indigo-900/30 whitespace-nowrap">
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

            <Tabs defaultValue={pendingVerifications.length > 0 ? "verification" : "ledger"} className="space-y-12">
                <TabsList className="bg-slate-100/50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/50 rounded-[2.5rem] w-fit p-2.5 h-auto gap-3 relative z-10 backdrop-blur-md shadow-inner">
                    <TabsTrigger 
                        value="verification" 
                        className="rounded-[2rem] px-10 py-6 text-sm font-bold transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-[0_15px_35px_rgba(0,0,0,0.1)] data-[state=active]:text-primary text-slate-500 gap-4 border border-transparent data-[state=active]:border-slate-100 dark:data-[state=active]:border-zinc-800"
                    >
                        <ShieldCheck className="w-5 h-5" />
                        Verification Queue
                        {pendingVerifications.length > 0 && (
                            <Badge className="bg-primary hover:bg-primary text-white text-[10px] h-6 min-w-[24px] px-2 flex items-center justify-center animate-pulse border-none ring-4 ring-white dark:ring-zinc-900">{pendingVerifications.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger 
                        value="ledger" 
                        className="rounded-[2rem] px-10 py-6 text-sm font-bold transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-[0_15px_35px_rgba(0,0,0,0.1)] data-[state=active]:text-primary text-slate-500 gap-4 border border-transparent data-[state=active]:border-slate-100 dark:data-[state=active]:border-zinc-800"
                    >
                        <History className="w-5 h-5" />
                        Unified Ledger
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="verification" className="focus-visible:ring-0 outline-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center shadow-inner">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Verification Tasks</h2>
                            <p className="text-sm font-medium text-slate-400 italic">Audit institutional payment proofs and verify transaction integrity.</p>
                        </div>
                    </div>
                    <PaymentVerificationQueue pendingPayments={pendingVerifications} />
                </TabsContent>

                <TabsContent value="ledger" className="focus-visible:ring-0 outline-none space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/20">
                                <History className="w-6 h-6" />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">Unified Ledger</h2>
                                <p className="text-sm font-medium text-slate-400 italic">Historical data registry and manual institutional settlement logs.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <LedgerExport payments={payments} />
                            <RecordPaymentModal
                                workspaces={workspaces.map(ws => ({ id: ws.id, name: ws.name, contactEmail: ws.contactEmail }))}
                                plans={plans}
                            />
                        </div>
                    </div>

                    <div className="p-1 rounded-[2.5rem] bg-slate-50/50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-900 shadow-inner">
                        <WorkspacePaymentsTable workspaces={workspaces} />
                    </div>
                </TabsContent>
            </Tabs>
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
                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 tracking-tight">{title}</p>
                    <h3 className="text-3xl font-black tracking-tighter text-slate-950 dark:text-white tabular-nums group-hover:translate-x-1 transition-transform origin-left">{value}</h3>
                    <p className="text-[10px] font-medium text-slate-500 italic opacity-60 tracking-tight">{subtitle}</p>
                </div>
            </CardContent>
        </Card>
    );
}
