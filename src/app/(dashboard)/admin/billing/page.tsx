import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, History, Download, Zap, AlertCircle, Clock, XCircle, ChevronRight, IndianRupee, ShieldCheck, CheckCircle, ArrowRight, Activity, HardDrive, Server, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function AdminBillingPage() {
    const { userId } = await auth();
    if (!userId) return notFound();

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        include: { adminWorkspace: true }
    });

    if (!user || !user.adminWorkspace) {
        return (
            <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh] text-center italic text-slate-500">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p>No active workspace subscription linked to this account.</p>
            </div>
        );
    }

    const workspace = user.adminWorkspace;
    const payments = await db.workspacePayment.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: 'desc' }
    });

    const pendingPayment = payments.find(p => p.status === 'PENDING_VERIFICATION');
    const rejectedPayment = payments.find(p => p.status === 'REJECTED');
    const activePayment = payments.find(p => p.status === 'PAID' && new Date(p.expiryDate) > new Date());
    const daysRemaining = activePayment 
        ? Math.max(0, Math.ceil((new Date(activePayment.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    const studentCount = await db.user.count({
        where: { role: 'STUDENT', studentWorkspaces: { some: { id: workspace.id } } }
    });

    const teacherCount = await db.user.count({
        where: { role: 'TEACHER', teacherWorkspaces: { some: { id: workspace.id } } }
    });

    return (
        <div className="space-y-6 md:space-y-10 pb-12">
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 px-2 lg:px-0">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white font-sans">
                        Billing & <span className="text-primary">Renew</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                        Manage your institutional tier, track cycle renewals, and audit transactions.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border-2 bg-white dark:bg-zinc-900 shadow-sm transition-all">
                        <div className="flex flex-col items-start pr-4 border-r border-slate-200 dark:border-zinc-800 mr-4">
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Node ID</span>
                            <span className="text-xs font-black tabular-nums">{workspace.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <CreditCard className="w-3.5 h-3.5 text-primary" />
                             <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-slate-500">Billing Shard Active</span>
                        </div>
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                {/* Active Plan Card */}
                <Card className="lg:col-span-1 border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] bg-slate-950 text-white rounded-[2.5rem] overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Zap size={80} />
                    </div>
                    <CardHeader className="p-8 pb-4">
                        <CardDescription className="text-primary font-bold uppercase tracking-[0.2em] text-[10px]">Current Resource Tier</CardDescription>
                        <CardTitle className="text-3xl font-black tracking-tight">{activePayment ? activePayment.planName : "No Active Plan"}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-10 space-y-8">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tighter tabular-nums">{daysRemaining}</span>
                            <span className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Days Remaining</span>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
                                <span>Status Matrix</span>
                                <span className={cn(activePayment ? "text-emerald-400" : "text-rose-400")}>
                                    {activePayment ? "Secure & Active" : "Action Required"}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }} />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">
                                <span>Cycle Start: {activePayment ? format(new Date(activePayment.paymentDate), "dd/MM/yyyy") : 'N/A'}</span>
                                <span>Expiry: {activePayment ? format(new Date(activePayment.expiryDate), "dd/MM/yyyy") : 'N/A'}</span>
                            </div>
                        </div>

                        {pendingPayment ? (
                            <div className="p-5 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex gap-4">
                                <Clock className="w-6 h-6 text-amber-500 shrink-0 mt-1 animate-pulse" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase text-amber-500 tracking-wider leading-none">Verification In Progress</p>
                                    <p className="text-[10px] font-medium text-slate-300 leading-tight">
                                        Your payment proof (Ref: {pendingPayment.referenceNumber}) is currently being reviewed by our team. This usually takes less than 24 hours.
                                    </p>
                                </div>
                            </div>
                        ) : rejectedPayment ? (
                            <div className="space-y-4">
                                <div className="p-5 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex gap-4">
                                    <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase text-rose-500 tracking-wider leading-none">Payment Rejected</p>
                                        <p className="text-[10px] font-medium text-slate-300 leading-tight">
                                            Reason: {rejectedPayment.rejectionReason || "Invalid proof submitted."}
                                        </p>
                                    </div>
                                </div>
                                <Button asChild className="w-full h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-white hover:text-slate-950 font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/40 group">
                                    <Link href="/admin/billing/pay">
                                        Try Again <ChevronRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <Button asChild className="w-full h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-white hover:text-slate-950 font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/40 group">
                                <Link href="/admin/billing/pay">
                                    Renew Subscription <Zap className="w-4 h-4 ml-2 fill-current group-hover:animate-pulse" />
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Resource Utilization */}
                <Card className="lg:col-span-1 border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden flex flex-col">
                    <CardHeader className="p-8 pb-4">
                        <CardDescription className="text-primary font-bold uppercase tracking-[0.2em] text-[10px]">Utilization Metrics</CardDescription>
                        <CardTitle className="text-2xl font-bold tracking-tight">Resource Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-10 flex-1 flex flex-col justify-between space-y-8">
                        <div className="space-y-6">
                            {/* Students Utilization */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-3.5 h-3.5" />
                                        <span>Student Capacity</span>
                                    </div>
                                    <span className="tabular-nums">{studentCount} / {workspace.maxStudents}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 transition-all duration-1000" 
                                        style={{ width: `${Math.min(100, (studentCount / workspace.maxStudents) * 100)}%` }} 
                                    />
                                </div>
                            </div>

                            {/* Faculty Utilization */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="w-3.5 h-3.5" />
                                        <span>Faculty Capacity</span>
                                    </div>
                                    <span className="tabular-nums">{teacherCount} / {workspace.maxTeachers}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 transition-all duration-1000" 
                                        style={{ width: `${Math.min(100, (teacherCount / workspace.maxTeachers) * 100)}%` }} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 dark:border-zinc-800/50">
                            <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                                Resource limits are dynamically scaled based on your active tier. 
                                <Link href="/admin/guide" className="text-primary hover:underline ml-1">Learn about scaling</Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* System Integrity & Shards */}
                <Card className="lg:col-span-1 border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden flex flex-col">
                    <CardHeader className="p-8 pb-4">
                        <CardDescription className="text-primary font-bold uppercase tracking-[0.2em] text-[10px]">Verification Matrix</CardDescription>
                        <CardTitle className="text-2xl font-bold tracking-tight">System Integrity</CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-10 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800/50 space-y-2">
                                <div className="flex items-center gap-2 text-[8px] font-bold uppercase text-slate-400 tracking-widest">
                                    <Server className="w-3 h-3 text-emerald-500" />
                                    <span>Node Check</span>
                                </div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">Verified</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800/50 space-y-2">
                                <div className="flex items-center gap-2 text-[8px] font-bold uppercase text-slate-400 tracking-widest">
                                    <HardDrive className="w-3 h-3 text-primary" />
                                    <span>Shifting</span>
                                </div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">Active Shard</div>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-indigo-600 shadow-sm">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">Institutional Compliance</h4>
                                <p className="text-[10px] font-medium text-slate-500 leading-none mt-1">Status: High Integrity Secure</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">All Nodes Operational</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Institutional Renewal Guide */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Institutional Renewal Guide</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">How to settle offline installments</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            step: "01",
                            title: "Resource Selection",
                            desc: "Initialize the renewal by selecting your infrastructure tier and lock-in duration on the Pay page.",
                            icon: Zap
                        },
                        {
                            step: "02",
                            title: "Capital Transfer",
                            desc: "Execute the settlement via UPI (QR Scan) or NEFT/Bank transfer using the provided platform credentials.",
                            icon: IndianRupee
                        },
                        {
                            step: "03",
                            title: "Vault Verification",
                            desc: "Upload the transaction artifact (screenshot) and reference ID for manual audit and node activation.",
                            icon: ShieldCheck
                        }
                    ].map((step, i) => (
                        <div key={i} className="relative p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 group hover:shadow-xl transition-all">
                            <div className="absolute top-6 right-8 text-4xl font-black text-slate-50 dark:text-zinc-800/50 group-hover:text-primary/10 transition-colors select-none">
                                {step.step}
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-slate-900 dark:text-white group-hover:bg-primary group-hover:text-white transition-all">
                                    <step.icon className="w-6 h-6" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-slate-900 dark:text-white">{step.title}</h3>
                                    <p className="text-xs font-medium text-slate-500 leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment History */}
            <Card className="border-none shadow-[0_12px_44px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                            <History className="w-5 h-5 text-slate-600" />
                         </div>
                         <div>
                            <CardTitle className="text-xl font-bold tracking-tight">Ledger History</CardTitle>
                            <CardDescription className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mt-1">Immutable transaction registry for compliance</CardDescription>
                         </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {payments.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest italic text-xs">
                            No historical transactions captured.
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-2 sm:mx-0">
                            <div className="inline-block min-w-full align-middle">
                                <Table>
                                     <TableHeader className="bg-slate-50/50 dark:bg-zinc-950/30">
                                        <TableRow className="border-none h-16">
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest pl-10">Ref Id</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest">Plan & Cycle</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest">Date</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Base</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Gst</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right pr-10">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((p) => (
                                            <TableRow key={p.id} className="border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-all group">
                                                <TableCell className="pl-10 py-6 text-[10px] font-mono font-bold text-slate-400 uppercase">TX_{p.id.slice(0, 6).toUpperCase()}</TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">{p.planName}</span>
                                                        <span className="text-[9px] font-bold uppercase text-slate-400 opacity-60 tracking-widest">
                                                            {p.duration === '1M' ? 'Monthly' : p.duration === '6M' ? 'Bi-Annual' : 'Yearly'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 text-xs font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                                                    {format(new Date(p.paymentDate), "dd/MM/yyyy")}
                                                </TableCell>
                                                <TableCell className="py-6 text-right font-bold text-slate-500 tabular-nums">
                                                    ₹{(p.baseAmount > 0 ? p.baseAmount : p.amount).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="py-6 text-right">
                                                    <span className={cn("text-[10px] font-bold tabular-nums", p.gstAmount > 0 ? "text-emerald-500" : "text-slate-300 opacity-40 uppercase tracking-widest")}>
                                                        {p.gstAmount > 0 ? `₹${p.gstAmount.toLocaleString()}` : "N/A"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="pr-10 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-5">
                                                        <div className="font-bold tracking-tight text-slate-900 dark:text-white text-base">
                                                            ₹{(p.totalAmount > 0 ? p.totalAmount : p.amount).toLocaleString()}
                                                        </div>
                                                        <Button asChild size="icon" variant="ghost" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
                                                            <Link href={`/admin/billing/receipt/${p.id}`} title="Download Institutional Proof">
                                                                <Download className="w-5 h-5 stroke-[2.5]" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
