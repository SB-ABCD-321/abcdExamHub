import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { 
    CreditCard, 
    History, 
    Download, 
    Zap, 
    AlertCircle, 
    Clock, 
    XCircle, 
    ChevronRight, 
    IndianRupee, 
    ShieldCheck, 
    CheckCircle, 
    Activity, 
    HardDrive, 
    Server, 
    Cpu,
    ExternalLink,
    FileText,
    Sparkles,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";

export default async function AdminBillingPage() {
    const { userId } = await auth();
    if (!userId) return notFound();

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        include: { adminWorkspace: true }
    });

    if (!user || !user.adminWorkspace) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mb-3 opacity-30 text-amber-500" />
                <h3 className="text-base font-bold text-foreground">No Workspace Linked</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    No active institutional workspace subscription was found linked to your account.
                </p>
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

    const [studentCount, teacherCount] = await Promise.all([
        db.user.count({
            where: { role: 'STUDENT', studentWorkspaces: { some: { id: workspace.id } } }
        }),
        db.user.count({
            where: { role: 'TEACHER', teacherWorkspaces: { some: { id: workspace.id } } }
        })
    ]);

    const settledPayments = payments.filter(p => p.status === 'PAID');
    const totalInvested = settledPayments.reduce((sum, p) => sum + (p.totalAmount > 0 ? p.totalAmount : p.amount || 0), 0);
    const settledCount = settledPayments.length;

    const studentCapPercent = workspace.maxStudents > 0 
        ? Math.min(100, Math.round((studentCount / workspace.maxStudents) * 100)) 
        : 0;

    const teacherCapPercent = workspace.maxTeachers > 0 
        ? Math.min(100, Math.round((teacherCount / workspace.maxTeachers) * 100)) 
        : 0;

    return (
        <DashboardPage>
            {/* Standardized Dashboard Header */}
            <DashboardHeader
                title={<>Billing & <span className="text-primary font-black">Renew</span></>}
                subtitle="Institutional subscription management, hardware resource scaling, and verified accounting ledger."
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="border-border/60 text-muted-foreground text-xs font-mono py-1 px-2.5">
                            <CreditCard className="w-3.5 h-3.5 mr-1.5 text-primary" />
                            Shard: {workspace.id.slice(0, 8).toUpperCase()}
                        </Badge>
                        <Link href="/admin/billing/pay">
                            <Button size="sm" className="h-8.5 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-2xs gap-1.5 cursor-pointer">
                                <Zap className="w-3.5 h-3.5 fill-current" />
                                <span>Renew Subscription</span>
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* EXACTLY 4 HIGH-DENSITY NUMBER-DRIVEN KPI CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {/* 1. Days Remaining */}
                <DashboardMetricCard
                    title="Cycle Validity"
                    value={daysRemaining}
                    subtitle={activePayment ? `Expires on ${format(new Date(activePayment.expiryDate), "dd MMM yyyy")}` : "Subscription cycle expired"}
                    progress={Math.min(100, Math.round((daysRemaining / 30) * 100))}
                    icon={<Clock className="size-4 text-primary" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {activePayment ? `${daysRemaining} Days Left` : "Renew Now"}
                        </span>
                    }
                />

                {/* 2. Student Capacity */}
                <DashboardMetricCard
                    title="Student Seats"
                    value={studentCount}
                    subtitle={`${studentCount} of ${workspace.maxStudents} enrolled candidates`}
                    progress={studentCapPercent}
                    icon={<Activity className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {studentCapPercent}% Cap
                        </span>
                    }
                />

                {/* 3. Faculty Capacity */}
                <DashboardMetricCard
                    title="Faculty Quota"
                    value={teacherCount}
                    subtitle={`${teacherCount} of ${workspace.maxTeachers} active instructors`}
                    progress={teacherCapPercent}
                    icon={<Cpu className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {teacherCapPercent}% Allocated
                        </span>
                    }
                />

                {/* 4. Total Capital Settled */}
                <DashboardMetricCard
                    title="Total Capital Settled"
                    value={`₹${totalInvested.toLocaleString()}`}
                    subtitle={`${settledCount} verified institutional transactions`}
                    progress={100}
                    icon={<IndianRupee className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Audited
                        </span>
                    }
                />
            </div>

            {/* ACTIVE SUBSCRIPTION & INFRASTRUCTURE SHARD SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* LEFT 2 COLUMNS: ACTIVE PLAN SENTINEL */}
                <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs space-y-5 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
                            <div>
                                <span className="text-primary font-bold uppercase tracking-wider text-[10px] block">Current Resource Tier</span>
                                <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5">
                                    {activePayment ? activePayment.planName : "Trial Instance (Default)"}
                                </h3>
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider self-start sm:self-auto",
                                    activePayment
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                        : pendingPayment
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse"
                                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                )}
                            >
                                {activePayment ? "Active & Verified" : pendingPayment ? "Verification In Progress" : "Action Required"}
                            </Badge>
                        </div>

                        {/* Validity Tracker */}
                        <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border/50">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-foreground">Cycle Progress</span>
                                <span className="font-bold text-primary tabular-nums">{daysRemaining} Days Remaining</span>
                            </div>
                            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono pt-1">
                                <span>Start: {activePayment ? format(new Date(activePayment.paymentDate), "dd/MM/yyyy") : "N/A"}</span>
                                <span>Expiry: {activePayment ? format(new Date(activePayment.expiryDate), "dd/MM/yyyy") : "N/A"}</span>
                            </div>
                        </div>

                        {/* Status Alerts */}
                        {pendingPayment ? (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex gap-3.5 items-start">
                                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                                <div className="space-y-1 text-xs">
                                    <p className="font-bold text-amber-600 dark:text-amber-400">Payment Proof Under Review</p>
                                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                                        Your payment transaction proof (Ref: <strong className="font-mono text-foreground">{pendingPayment.referenceNumber}</strong>) was submitted on {format(new Date(pendingPayment.createdAt), "dd MMM yyyy, hh:mm a")}. Our finance team audits all deposits within 24 hours.
                                    </p>
                                </div>
                            </div>
                        ) : rejectedPayment ? (
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex gap-3.5 items-start">
                                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                <div className="space-y-1 text-xs">
                                    <p className="font-bold text-rose-600 dark:text-rose-400">Verification Rejected</p>
                                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                                        Reason: {rejectedPayment.rejectionReason || "Transaction proof could not be validated. Please submit a clear receipt."}
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                        <Link href="/admin/billing/pay" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-10 px-5 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-2 cursor-pointer shadow-xs">
                                <Zap className="w-4 h-4 fill-current" />
                                <span>{activePayment ? "Extend or Upgrade Plan" : "Renew Workspace Subscription"}</span>
                            </Button>
                        </Link>
                        <Link href="/admin/guide" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto h-10 px-4 rounded-xl font-bold text-xs border-border/60 hover:bg-muted text-muted-foreground cursor-pointer">
                                <span>View Scaling Guidelines</span>
                                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* RIGHT COLUMN: HARDWARE SHARD INTEGRITY */}
                <div className="lg:col-span-1 p-5 rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs space-y-4 flex flex-col justify-between">
                    <div>
                        <div className="pb-3 border-b border-border/50">
                            <span className="text-primary font-bold uppercase tracking-wider text-[10px] block">Verification Matrix</span>
                            <h4 className="text-base font-extrabold text-foreground tracking-tight mt-0.5">System Shard Health</h4>
                        </div>

                        <div className="space-y-3 pt-3">
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-1">
                                    <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase text-muted-foreground">
                                        <Server className="w-3 h-3 text-emerald-500" />
                                        <span>Node Check</span>
                                    </div>
                                    <p className="text-xs font-bold text-foreground">Verified</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-1">
                                    <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase text-muted-foreground">
                                        <HardDrive className="w-3 h-3 text-primary" />
                                        <span>Sharding</span>
                                    </div>
                                    <p className="text-xs font-bold text-foreground">Active Node</p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground">Institutional Compliance</p>
                                    <p className="text-[10px] text-muted-foreground">End-to-End Encrypted Shard</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/20 border border-border/50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10.5px] font-bold text-muted-foreground">All Verification Gates Operational</span>
                    </div>
                </div>
            </div>

            {/* INSTITUTIONAL RENEWAL 3-STEP TIMELINE */}
            <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-extrabold text-foreground tracking-tight">Institutional Settlement Guide</h3>
                        <p className="text-[10.5px] text-muted-foreground font-medium">Standard 3-step offline verification protocol for UPI & Bank settlements</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {[
                        {
                            step: "01",
                            title: "Tier Selection",
                            desc: "Initialize your renewal by selecting the student/teacher resource tier and duration (Monthly or Yearly).",
                            icon: Zap
                        },
                        {
                            step: "02",
                            title: "Direct Capital Settlement",
                            desc: "Execute payment via institutional UPI QR scan or NEFT/RTGS Bank wire transfer to our official billing account.",
                            icon: IndianRupee
                        },
                        {
                            step: "03",
                            title: "Artifact Upload & Activation",
                            desc: "Submit your payment reference number and screenshot proof for rapid audit and zero-downtime node renewal.",
                            icon: ShieldCheck
                        }
                    ].map((step, i) => (
                        <div 
                            key={i} 
                            className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/40 hover:bg-card transition-all relative overflow-hidden group"
                        >
                            <span className="absolute top-2.5 right-3 text-3xl font-black text-muted-foreground/10 group-hover:text-primary/15 transition-colors select-none font-mono">
                                {step.step}
                            </span>
                            <div className="space-y-2.5">
                                <div className="w-8 h-8 rounded-lg bg-background border border-border/60 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-2xs">
                                    <step.icon className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-foreground">{step.title}</h4>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* IMMUTABLE TRANSACTION LEDGER HISTORY TABLE */}
            <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <History className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-foreground tracking-tight">Immutable Transaction Ledger</h3>
                            <p className="text-[10.5px] text-muted-foreground font-medium">Compliance-verified settlement receipts and tax audit trail</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono border-border/60 text-muted-foreground self-start sm:self-auto">
                        {payments.length} Logged Entries
                    </Badge>
                </div>

                {payments.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                        <FileText className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-xs font-bold text-foreground">No Historical Transactions Logged</p>
                        <p className="text-[11px] text-muted-foreground max-w-sm">
                            When payments are processed and audited, immutable GST receipts and transaction records will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-border/50 h-11 text-xs">
                                    <TableHead className="font-bold text-muted-foreground pl-5">Ref ID</TableHead>
                                    <TableHead className="font-bold text-muted-foreground">Plan & Duration</TableHead>
                                    <TableHead className="font-bold text-muted-foreground">Status</TableHead>
                                    <TableHead className="font-bold text-muted-foreground">Date</TableHead>
                                    <TableHead className="font-bold text-muted-foreground text-right">Base Amount</TableHead>
                                    <TableHead className="font-bold text-muted-foreground text-right">GST (18%)</TableHead>
                                    <TableHead className="font-bold text-muted-foreground text-right pr-5">Total Settled</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((p) => {
                                    const isPaid = p.status === 'PAID';
                                    const isPending = p.status === 'PENDING_VERIFICATION';
                                    const isRejected = p.status === 'REJECTED';

                                    return (
                                        <TableRow key={p.id} className="border-border/40 hover:bg-muted/20 transition-all text-xs">
                                            <TableCell className="pl-5 py-3.5 font-mono font-bold text-muted-foreground">
                                                {p.referenceNumber ? p.referenceNumber : `TX_${p.id.slice(0, 6).toUpperCase()}`}
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground">{p.planName}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                                        {p.duration === '1M' ? 'Monthly' : p.duration === '6M' ? 'Bi-Annual' : 'Yearly'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5",
                                                        isPaid
                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                            : isPending
                                                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                                    )}
                                                >
                                                    {isPaid ? "Verified Paid" : isPending ? "Pending Audit" : "Rejected"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3.5 text-muted-foreground tabular-nums">
                                                {format(new Date(p.paymentDate || p.createdAt), "dd MMM yyyy")}
                                            </TableCell>
                                            <TableCell className="py-3.5 text-right font-medium text-muted-foreground tabular-nums">
                                                ₹{(p.baseAmount > 0 ? p.baseAmount : p.amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="py-3.5 text-right tabular-nums">
                                                <span className={cn(p.gstAmount > 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground")}>
                                                    {p.gstAmount > 0 ? `₹${p.gstAmount.toLocaleString()}` : "N/A"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="pr-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className="font-extrabold text-foreground text-sm tabular-nums">
                                                        ₹{(p.totalAmount > 0 ? p.totalAmount : p.amount).toLocaleString()}
                                                    </span>
                                                    {isPaid && (
                                                        <Link href={`/admin/billing/receipt/${p.id}`} title="Download GST Invoice Receipt">
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
                                                                <Download className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </DashboardPage>
    );
}
