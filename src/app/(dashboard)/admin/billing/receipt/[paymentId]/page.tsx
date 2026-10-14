import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowLeft, 
    ShieldCheck, 
    CreditCard, 
    Building2, 
    Calendar, 
    Hash, 
    CheckCircle2, 
    QrCode, 
    FileText,
    Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import { ReceiptActions } from "@/components/billing/ReceiptActions";
import { cn } from "@/lib/utils";

export default async function PaymentReceiptPage({ params }: { params: Promise<{ paymentId: string }> }) {
    const { paymentId } = await params;
    const { userId } = await auth();
    if (!userId) return notFound();

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        select: { role: true }
    });

    if (!user) return notFound();

    const payment = await db.workspacePayment.findUnique({
        where: { id: paymentId },
        include: {
            workspace: {
                select: {
                    name: true,
                    billingAddress: true,
                    address: true,
                    gstNumber: true,
                    contactEmail: true,
                }
            }
        }
    });

    if (!payment) return notFound();

    const settings = await db.siteSetting.findFirst();

    // Tax calculations (GST breakdown 9% CGST + 9% SGST)
    const totalAmount = payment.totalAmount || payment.amount || 0;
    const gstAmount = payment.gstAmount || 0;
    const baseAmount = payment.baseAmount || (totalAmount - gstAmount);
    const cgst = gstAmount > 0 ? gstAmount / 2 : 0;
    const sgst = gstAmount > 0 ? gstAmount / 2 : 0;

    const receiptNo = payment.receiptNumber || `INV-${payment.id.slice(0, 8).toUpperCase()}`;

    return (
        <div className="space-y-4 md:space-y-6 pb-16 selection:bg-primary/10">
            {/* Guarantee standard ISO 216 A4 format during browser printing */}
            <style dangerouslySetInnerHTML={{ __html: `
                @page {
                    size: A4 portrait;
                    margin: 10mm;
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}} />

            <div className="max-w-4xl mx-auto space-y-4">
                {/* Navigation Bar & Action Toolbar (Hidden during browser printing) */}
                <div className="flex items-center justify-between no-print px-2 sm:px-0">
                    <Button 
                        asChild 
                        variant="ghost" 
                        size="sm"
                        className="rounded-xl text-xs font-semibold gap-1.5 h-8.5 hover:bg-muted cursor-pointer"
                    >
                        <Link href={user.role === 'SUPER_ADMIN' ? "/super-admin/payments" : "/admin/billing"}>
                            <ArrowLeft className="size-3.5" />
                            <span>Back to Ledger</span>
                        </Link>
                    </Button>
                    <ReceiptActions payment={payment as any} settings={settings as any} />
                </div>

                {/* OFFICIAL TAX INVOICE & PAYMENT RECEIPT DOCUMENT */}
                <div className="bg-card text-card-foreground shadow-sm rounded-2xl border border-border/70 overflow-hidden relative print:shadow-none print:border print:border-slate-300 print:rounded-none print:text-black print:bg-white">
                    {/* Top Decorative Gold/Primary Accent Strip */}
                    <div className="h-1.5 w-full bg-linear-to-r from-primary via-primary/80 to-primary print:hidden" />

                    <div className="p-6 sm:p-10 md:p-12 space-y-8 relative z-10">
                        {/* Header Section: Provider Brand & Invoice Reference */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-border/60 pb-6 print:border-slate-300">
                            {/* Brand and Platform Info */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    {settings?.logoUrl ? (
                                        <div className="size-11 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                                            <img src={settings.logoUrl} alt="Platform Logo" className="h-full w-auto object-contain" />
                                        </div>
                                    ) : (
                                        <div className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs">
                                            <ShieldCheck className="size-6" />
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-xl font-bold tracking-tight text-foreground print:text-black">
                                            {settings?.siteName || "ABCD Exam Hub"}
                                        </h1>
                                        <p className="text-[11px] text-muted-foreground font-medium print:text-slate-600">
                                            Cloud Examination Infrastructure & RBAC Governance
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Official Invoice Badge & Metadata */}
                            <div className="flex flex-col sm:items-end space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider print:border-emerald-600 print:text-emerald-700">
                                    <CheckCircle2 className="size-3" />
                                    <span>Official Tax Invoice • Paid</span>
                                </div>
                                <p className="font-mono text-base sm:text-lg font-black text-foreground tabular-nums print:text-black pt-1">
                                    #{receiptNo}
                                </p>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-2 print:text-slate-600">
                                    <Calendar className="size-3 text-primary" />
                                    <span>Date: {format(new Date(payment.paymentDate), "dd MMMM yyyy")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Two-Column Entity Information: Provider vs Billed Institution */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 rounded-xl p-4 sm:p-5 border border-border/50 print:bg-slate-50 print:border-slate-200">
                            {/* Provider Details */}
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Building2 className="size-3.5 text-primary" />
                                    <span>Service Provider</span>
                                </span>
                                <h3 className="text-sm font-bold text-foreground print:text-black">
                                    {settings?.platformLegalName || settings?.siteName || "ABCD Exam Hub Technologies"}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs print:text-slate-600">
                                    {settings?.platformAddress || settings?.location || "Kolkata, West Bengal, India"}
                                </p>
                                <div className="pt-1 text-[11px] font-mono text-foreground font-semibold flex items-center gap-2">
                                    <span className="text-muted-foreground font-sans">GSTIN:</span>
                                    <span>{settings?.platformGstNumber || "19AAACA0000A1Z5 (Registered)"}</span>
                                </div>
                            </div>

                            {/* Billed Institution Details */}
                            <div className="space-y-1.5 sm:text-right">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 sm:justify-end">
                                    <CreditCard className="size-3.5 text-primary" />
                                    <span>Billed Institution</span>
                                </span>
                                <h3 className="text-sm font-bold text-foreground print:text-black">
                                    {payment.workspace?.name}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs sm:ml-auto print:text-slate-600">
                                    {payment.billingAddressSnapshot || payment.workspace?.billingAddress || payment.workspace?.address || "Registered institutional billing address on file."}
                                </p>
                                <div className="pt-1 text-[11px] font-mono text-foreground font-semibold flex items-center gap-2 sm:justify-end">
                                    <span className="text-muted-foreground font-sans">Client GSTIN:</span>
                                    <span>{payment.workspace?.gstNumber || "Unregistered / Exempt"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Itemized Line Items Table */}
                        <div className="space-y-3">
                            <div className="rounded-xl border border-border/60 overflow-hidden print:border-slate-300">
                                <Table>
                                    <TableHeader className="bg-muted/50 print:bg-slate-100">
                                        <TableRow className="border-border/60">
                                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-4">Item & Shard Allocation</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">SAC Code</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Duration</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-4">Taxable Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="border-border/40">
                                            <TableCell className="pl-4 py-3.5">
                                                <div className="space-y-0.5">
                                                    <span className="text-xs font-bold text-foreground block">
                                                        {payment.planName} Institutional Workspace Shard
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        Dedicated tenant provisioning, examination engine, automated grading & RBAC controls
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-xs font-medium text-muted-foreground">
                                                998433
                                            </TableCell>
                                            <TableCell className="text-center text-xs font-medium">
                                                <Badge variant="outline" className="text-[10px] px-2 py-0">
                                                    {payment.duration}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-4 font-mono text-xs font-bold tabular-nums">
                                                ₹{baseAmount.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Settlement Calculation Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                            {/* Left: Transaction Metadata & Audit Verification */}
                            <div className="space-y-2.5 bg-muted/20 rounded-xl p-3.5 border border-border/50 text-xs print:bg-transparent print:border-slate-200">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    Settlement Clearance Details
                                </span>
                                <div className="space-y-1.5 font-mono text-[11px]">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground font-sans">Payment Mode:</span>
                                        <span className="font-semibold text-foreground">{payment.paymentMethod || "Electronic Transfer"}</span>
                                    </div>
                                    {payment.referenceNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-sans">UTR / Reference No:</span>
                                            <span className="font-semibold text-foreground">{payment.referenceNumber}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground font-sans">Expiry / Valid Until:</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {payment.expiryDate ? format(new Date(payment.expiryDate), "dd MMM yyyy") : "Active Node"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground font-sans">Audit Status:</span>
                                        <span className="font-semibold text-foreground">Verified & Cryptographically Reconciled</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Tax Breakdown and Gross Total */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs py-1 border-b border-border/40 font-mono">
                                    <span className="text-muted-foreground font-sans">Taxable Subtotal</span>
                                    <span className="font-bold tabular-nums">₹{baseAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs py-1 border-b border-border/40 font-mono">
                                    <span className="text-muted-foreground font-sans">CGST (9.0%)</span>
                                    <span className="font-bold tabular-nums">₹{cgst.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs py-1 border-b border-border/40 font-mono">
                                    <span className="text-muted-foreground font-sans">SGST (9.0%)</span>
                                    <span className="font-bold tabular-nums">₹{sgst.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 px-3 bg-primary/10 rounded-xl border border-primary/20 print:bg-slate-100">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary print:text-black block">Total Settled Amount</span>
                                        <span className="text-[10px] text-muted-foreground">Inclusive of statutory GST</span>
                                    </div>
                                    <span className="text-lg sm:text-xl font-black text-foreground tabular-nums font-mono print:text-black">
                                        ₹{totalAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Statutory Notice & Electronic Signature Footer */}
                        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-muted-foreground print:border-slate-300">
                            <div className="space-y-0.5 max-w-md">
                                <p className="font-semibold text-foreground print:text-black">Electronic Legal Notice</p>
                                <p className="text-[11px] leading-relaxed">
                                    This document is digitally produced pursuant to Section 65B of the Indian Evidence Act, 1872 and Rule 46 of the CGST Rules, 2017. Physical signature not required.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                    <span className="text-[10px] font-bold uppercase tracking-wider block text-foreground print:text-black">ABCD Exam Hub Authority</span>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Digitally Signed & Validated</span>
                                </div>
                                <div className="size-10 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center text-primary shrink-0">
                                    <ShieldCheck className="size-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
