"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { 
    CheckCircle2, 
    XCircle, 
    Image as ImageIcon, 
    ExternalLink, 
    Loader2, 
    AlertCircle,
    Banknote,
    Clock,
    User,
    Building2,
    Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { verifyPaymentRequest } from "@/actions/financial-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PaymentVerificationQueueProps {
    pendingPayments: any[];
}

export function PaymentVerificationQueue({ pendingPayments }: PaymentVerificationQueueProps) {
    const [isPending, startTransition] = useTransition();
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

    async function handleAction(paymentId: string, isApproved: boolean) {
        if (!isApproved && !rejectionReason.trim()) {
            toast.error("Please provide a rejection reason.");
            return;
        }

        startTransition(async () => {
            const res = await verifyPaymentRequest({
                paymentId,
                isApproved,
                rejectionReason: isApproved ? undefined : rejectionReason
            });

            if (res.success) {
                toast.success(isApproved ? "Payment approved and subscription activated." : "Payment submission rejected.");
                setRejectionReason("");
                setSelectedPaymentId(null);
            } else {
                toast.error(res.error || "Action failed.");
            }
        });
    }

    if (pendingPayments.length === 0) return null;

    return (
        <div className="space-y-6 mb-10">
            <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                    <h2 className="text-lg font-black uppercase tracking-widest text-slate-950 dark:text-white">Verification Queue</h2>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest opacity-80 mt-0.5 italic">Awaiting Super Admin manual audit ({pendingPayments.length})</p>
                </div>
            </div>

            <div className="grid gap-4">
                {pendingPayments.map((p) => (
                    <Card key={p.id} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all duration-300 border-l-4 border-amber-500">
                        <CardContent className="p-0">
                            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x border-zinc-100 dark:divide-zinc-800">
                                {/* Workspace & Plan Info */}
                                <div className="p-8 lg:w-1/3 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-black text-zinc-400 capitalize">
                                            {p.workspace.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{p.workspace.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.workspace.contactEmail}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-zinc-50 dark:border-zinc-800/50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Plan</span>
                                            <Badge className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-none font-black text-[10px] uppercase tracking-tighter">
                                                {p.planName} ({p.duration})
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted</span>
                                            <span className="text-xs font-black text-slate-600 dark:text-slate-300">{format(new Date(p.submittedAt || p.createdAt), "dd MMM, hh:mm a")}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Proof Details */}
                                <div className="p-8 lg:w-1/3 bg-zinc-50/30 dark:bg-zinc-950/30 space-y-4">
                                    <div className="flex items-center gap-2 text-amber-600 mb-2">
                                        <Banknote className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Manual Transaction Audit</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref / Transaction ID</span>
                                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono break-all">{p.referenceNumber}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Disclosed</span>
                                            <span className="text-xl font-black text-emerald-600 tabular-nums">₹{p.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions & Proof View */}
                                <div className="p-8 lg:w-1/3 flex flex-col justify-center gap-4">
                                    <div className="flex items-center gap-3">
                                        {p.proofImageUrl ? (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="flex-1 h-14 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 transition-all">
                                                        <ImageIcon className="w-4 h-4 mr-2" /> View Proof
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                                                    <DialogHeader className="sr-only">
                                                        <DialogTitle>Payment Proof</DialogTitle>
                                                        <DialogDescription>
                                                            Transaction artifact submitted by the workspace admin.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="relative group">
                                                        <img 
                                                            src={p.proofImageUrl} 
                                                            alt="Payment Proof" 
                                                            className="w-full h-auto max-h-[85vh] object-contain rounded-3xl"
                                                        />
                                                        <a 
                                                            href={p.proofImageUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="absolute bottom-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl hover:bg-white transition-all group-hover:scale-105"
                                                        >
                                                            <ExternalLink className="w-6 h-6 text-slate-950" />
                                                        </a>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        ) : (
                                            <div className="flex-1 h-14 rounded-2xl border-2 border-dashed border-zinc-100 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase italic">
                                                No Visual Proof
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Dialog open={selectedPaymentId === p.id} onOpenChange={(open) => !open && setSelectedPaymentId(null)}>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    className="flex-1 h-12 rounded-xl text-rose-600 border-rose-100 bg-rose-50/30 hover:bg-rose-50 font-black uppercase tracking-widest text-[10px]"
                                                    onClick={() => setSelectedPaymentId(p.id)}
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" /> Reject
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-[2.5rem] p-8 max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Reject Submission</DialogTitle>
                                                    <DialogDescription className="font-bold text-slate-500 italic">
                                                        Explain to the workspace admin why this proof was invalid.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-6">
                                                    <Textarea 
                                                        placeholder="e.g. Transaction ID could not be found in our bank statement..."
                                                        className="min-h-[120px] rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold"
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="ghost" onClick={() => setSelectedPaymentId(null)} className="font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                                                    <Button 
                                                        variant="destructive" 
                                                        onClick={() => handleAction(p.id, false)}
                                                        disabled={isPending}
                                                        className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                                    >
                                                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Rejection"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <Button 
                                            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20"
                                            onClick={() => handleAction(p.id, true)}
                                            disabled={isPending}
                                        >
                                            {isPending ? <Loader2 className="w-4 h-4 animate-spin font-black" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve</>}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
