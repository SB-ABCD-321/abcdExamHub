import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { History, ArrowLeft, ShieldCheck, CreditCard, Building2 } from "lucide-react";
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
                }
            }
        }
    });

    if (!payment) return notFound();

    const settings = await db.siteSetting.findFirst();

    return (
        <div className="space-y-6 md:space-y-10 pb-20 selection:bg-primary/10">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between no-print px-4 md:px-0">
                    <Button asChild variant="ghost" className="rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] gap-2 h-10 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">
                        <Link href={user.role === 'SUPER_ADMIN' ? "/super-admin/payments" : "/admin/billing"}>
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Ledger
                        </Link>
                    </Button>
                    <ReceiptActions payment={payment as any} settings={settings as any} />
                </div>

                <div className="bg-white dark:bg-zinc-900 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-zinc-800/60 overflow-hidden relative print:shadow-none print:border-none">
                    {/* Watermark Decor */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] flex items-center justify-center select-none overflow-hidden">
                        <div className="text-[20vw] font-black uppercase tracking-[0.2em] -rotate-12 whitespace-nowrap">
                            CERTIFIED PROOF
                        </div>
                    </div>

                    <div className="p-6 md:p-16 space-y-10 md:space-y-16 relative z-10">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 md:gap-0 border-b border-slate-50 dark:border-zinc-800/50 pb-10 md:pb-16">
                            <div className="space-y-6 text-center md:text-left">
                                {settings?.logoUrl ? (
                                    <div className="inline-block p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-3xl border border-slate-100 dark:border-zinc-700/50 shadow-sm">
                                        <img src={settings.logoUrl} alt="Logo" className="h-10 md:h-12 w-auto object-contain" />
                                    </div>
                                ) : (
                                    <div className="h-12 md:h-16 w-12 md:w-16 bg-primary rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20 mx-auto md:mx-0">
                                        <ShieldCheck className="w-6 md:w-8 h-6 md:h-8 text-white" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950 dark:text-white uppercase whitespace-nowrap">{settings?.siteName || "ABCD Exam Hub"}</h2>
                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Financial Artifact v1.4 • Institutional Proof</p>
                                </div>
                            </div>

                            <div className="text-center md:text-right space-y-4">
                                <div className="bg-slate-950 text-white px-4 md:px-6 py-2 rounded-xl inline-block shadow-lg">
                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">Official Tax Invoice</span>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xl md:text-2xl font-mono font-black tracking-tighter text-indigo-600 dark:text-indigo-400 underline decoration-indigo-200 underline-offset-4">
                                        #{payment.receiptNumber || payment.id.slice(0, 8).toUpperCase()}
                                    </p>
                                    <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-2 md:gap-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest tabular-nums">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" /> {format(new Date(payment.paymentDate), "dd MMMM yyyy")}
                                        </div>
                                        {payment.referenceNumber && (
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 px-3 py-1 rounded-lg border border-slate-100 dark:border-zinc-700/50">
                                                <span className="text-[8px] md:text-[9px] text-slate-400">REF:</span>
                                                <span className="text-slate-900 dark:text-white font-mono">{payment.referenceNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                            {/* Provider Details */}
                            <div className="space-y-6 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-500">
                                    <Building2 className="w-3 md:w-3.5 h-3 md:h-3.5" /> Platform Provider
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg md:text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight">{settings?.platformLegalName || settings?.siteName || "ABCD Exam Hub"}</p>
                                    <p className="text-xs md:text-sm font-bold text-slate-500 max-w-sm mx-auto md:mx-0 leading-relaxed italic">
                                        {settings?.platformAddress || settings?.location || "Kolkata, West Bengal, India"}
                                    </p>
                                    {settings?.platformGstNumber && (
                                        <Badge variant="outline" className="mt-4 border-2 border-slate-100 dark:border-zinc-800 text-[10px] md:text-xs font-black uppercase px-4 py-1.5 rounded-lg shadow-sm">
                                            GSTIN: {settings.platformGstNumber}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div className="space-y-6 text-center md:text-right">
                                <div className="flex items-center justify-center md:justify-end gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-500">
                                    <CreditCard className="w-3 md:w-3.5 h-3 md:h-3.5" /> Billed Institutional Node
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg md:text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight">{payment.workspace.name}</p>
                                    <p className="text-xs md:text-sm font-bold text-slate-500 max-w-sm md:ml-auto leading-relaxed italic">
                                        {payment.billingAddressSnapshot || payment.workspace.billingAddress || payment.workspace.address || "Institutional address maintained on digital file."}
                                    </p>
                                    {payment.workspace.gstNumber && (
                                        <Badge variant="secondary" className="mt-4 bg-slate-900 text-white dark:bg-zinc-800 text-[10px] md:text-xs font-black uppercase px-4 py-1.5 rounded-lg shadow-md border-none">
                                            CLIENT GSTIN: {payment.workspace.gstNumber}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Transaction Matrix */}
                        <div className="space-y-6 overflow-x-auto -mx-2 sm:mx-0">
                            <Table className="min-w-[600px] md:min-w-0">
                                <TableHeader className="bg-slate-50 dark:bg-zinc-950/40">
                                    <TableRow className="border-none h-14">
                                        <TableHead className="text-[9px] md:text-[10px] font-black uppercase tracking-widest pl-8">Institutional Artifact Description</TableHead>
                                        <TableHead className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-right">Base Value</TableHead>
                                        <TableHead className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-right">Tax (%)</TableHead>
                                        <TableHead className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-right pr-8">Settled Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="border-slate-50 dark:border-zinc-800/40 h-20 group">
                                        <TableCell className="pl-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-950 dark:text-white uppercase text-base md:text-lg tracking-tight">{payment.planName} Academic Hub</span>
                                                <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 italic opacity-60 tracking-widest">Shard Duration: {payment.duration}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-600 dark:text-slate-400 tabular-nums text-sm md:text-base">
                                            ₹{(payment.baseAmount || payment.amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tabular-nums">SAC 998433</span>
                                            <p className="font-bold text-xs">{(payment.gstAmount > 0) ? "18.0%" : "0.0%"}</p>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="font-black italic tracking-tighter text-slate-950 dark:text-white text-lg md:text-xl underline decoration-primary/20 underline-offset-4">
                                                ₹{(payment.totalAmount || payment.amount).toLocaleString()}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* Financial Ledger Footer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 pt-10 border-t border-slate-50 dark:border-zinc-800/50">
                            <div className="space-y-4 text-center md:text-left">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 italic">Audit Certification</p>
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 leading-relaxed max-w-sm mx-auto md:mx-0">
                                    This institutional document is electronically generated under the IT Act, 2000. It serves as permanent proof of resource settlement on the ABCD Exam Hub infrastructure.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-zinc-800/50">
                                    <span className="text-[10px] md:text-xs font-black uppercase text-slate-400">Total Tax Settled</span>
                                    <span className="font-black tabular-nums text-slate-900 dark:text-white">₹{(payment.gstAmount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between py-4 bg-slate-50 dark:bg-zinc-800/40 px-6 rounded-2xl md:rounded-3xl shadow-sm">
                                    <span className="text-[11px] md:text-xs font-black uppercase tracking-widest text-primary">Settlement Amount</span>
                                    <span className="text-2xl md:text-3xl font-black italic tracking-tighter tabular-nums decoration-primary/40 text-slate-900 dark:text-white">
                                        ₹{(payment.totalAmount || payment.amount).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Calendar(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}
