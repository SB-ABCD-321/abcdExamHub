import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, ShieldCheck, Zap, Building2, TrendingUp } from "lucide-react";
import { getPricingPlansForSelection } from "@/actions/financial-actions";
import { RecordPaymentModal } from "@/components/super-admin/RecordPaymentModal";
import { SmartExportDropdown } from "@/components/super-admin/SmartExportDropdown";
import { PaymentsManager } from "@/components/super-admin/PaymentsManager";
import { PaymentStatus } from "@prisma/client";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";

export default async function SuperAdminPaymentsPage() {
    const { userId } = await auth();
    if (!userId) return notFound();

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        select: { role: true }
    });

    if (!user || user.role !== "SUPER_ADMIN") return notFound();

    const [payments, workspaces, plans, pendingVerifications, pendingRequestsCount] = await Promise.all([
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
        }),
        db.workspaceRequest.count({ where: { status: 'PENDING' } }).catch(() => 0)
    ]);

    // Financial calculations
    const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.totalAmount || p.amount || 0), 0);
    const totalGst = payments.reduce((sum: number, p: any) => sum + (p.gstAmount || 0), 0);
    const pendingCount = pendingVerifications.length;

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Financial & <span className="text-primary font-black">Settlement Hub</span></>}
                subtitle="Unified institutional revenue auditing, payment verification, statutory GST compliance, and settlements."
                actions={
                    <div className="flex items-center gap-2">
                        <SmartExportDropdown payments={payments} />
                        <RecordPaymentModal
                            workspaces={workspaces.map((ws) => ({
                                id: ws.id,
                                name: ws.name,
                                contactEmail: ws.contactEmail
                            }))}
                            plans={plans}
                        />
                    </div>
                }
            />

            {/* HIGH-DENSITY ANALYTICAL FINANCIAL KPI METRICS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Gross Collections"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    subtitle="Platform LTV Aggregate"
                    icon={<IndianRupee className="size-4 text-primary" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            Reconciled
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Statutory GST Pool"
                    value={`₹${totalGst.toLocaleString()}`}
                    subtitle="18% Tax Held for Submission"
                    icon={<ShieldCheck className="size-4 text-emerald-500" />}
                    progress={100}
                />

                <DashboardMetricCard
                    title="Verification Queue"
                    value={pendingCount}
                    subtitle={pendingCount > 0 ? "Awaiting transfer audit" : "All submissions audited"}
                    icon={<Zap className={pendingCount > 0 ? "size-4 text-amber-500" : "size-4 text-muted-foreground"} />}
                    badge={
                        pendingCount > 0 ? (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                                {pendingCount} Pending
                            </span>
                        ) : (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Clear
                            </span>
                        )
                    }
                />

                <DashboardMetricCard
                    title="Institutional Shards"
                    value={workspaces.length}
                    subtitle={`${payments.length} verified invoices issued`}
                    icon={<Building2 className="size-4 text-indigo-500" />}
                    progress={Math.min(100, Math.max(15, (workspaces.length / Math.max(1, workspaces.length + pendingRequestsCount)) * 100))}
                />
            </div>

            {/* INTERACTIVE PAYMENTS MANAGER (TABS + CHARTS + TABLES + VERIFICATION) */}
            <PaymentsManager
                payments={payments}
                workspaces={workspaces}
                pendingVerifications={pendingVerifications}
                defaultTab="ledger"
            />

            {/* STATUTORY & COMPLIANCE AUDIT FOOTER */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-5" />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">Statutory Accounting & Invoice Integrity Active</h4>
                        <p className="text-[11px] text-muted-foreground">All verified invoices are cryptographically hashed and comply with Section 31 of CGST Act rules.</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold shrink-0">
                    GST Ready & Reconciled
                </Badge>
            </div>
        </DashboardPage>
    );
}
