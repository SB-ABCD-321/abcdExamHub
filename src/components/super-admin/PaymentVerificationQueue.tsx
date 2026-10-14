"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { 
    CheckCircle2, 
    XCircle, 
    Image as ImageIcon, 
    ExternalLink, 
    Loader2, 
    Clock, 
    Banknote,
    Building2,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
            toast.error("Please provide a rejection reason for the audit trail.");
            return;
        }

        startTransition(async () => {
            const res = await verifyPaymentRequest({
                paymentId,
                isApproved,
                rejectionReason: isApproved ? undefined : rejectionReason
            });

            if (res.success) {
                toast.success(isApproved ? "Payment verified and workspace provisioned successfully." : "Payment submission rejected.");
                setRejectionReason("");
                setSelectedPaymentId(null);
            } else {
                toast.error(res.error || "Action failed.");
            }
        });
    }

    if (pendingPayments.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">
                        Manual Verification Tasks
                    </h3>
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-bold">
                        {pendingPayments.length} Pending
                    </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    Audit institutional transfer slips and verify UTR/transaction IDs.
                </span>
            </div>

            <div className="space-y-2.5">
                {pendingPayments.map((p) => (
                    <div
                        key={p.id}
                        className="group relative overflow-hidden border border-amber-500/30 bg-card rounded-xl p-3.5 sm:p-4 shadow-2xs hover:border-amber-500/50 transition-all"
                    >
                        {/* Amber accent line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pl-1">
                            {/* Workspace & Requested Plan */}
                            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black shrink-0">
                                    <Building2 className="size-5" />
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                                            {p.workspace?.name}
                                        </h4>
                                        <Badge variant="outline" className="text-[9.5px] px-2 py-0 bg-primary/10 text-primary border-primary/20 font-bold">
                                            {p.planName} • {p.duration}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                        <span>{p.workspace?.contactEmail}</span>
                                        <span>•</span>
                                        <span>Submitted: {format(new Date(p.submittedAt || p.createdAt), "dd MMM, hh:mm a")}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Disclosed Amount & Reference */}
                            <div className="flex items-center gap-4 sm:gap-6 self-start lg:self-auto pl-13 lg:pl-0">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Declared UTR / Ref</span>
                                    <span className="font-mono text-xs font-bold text-foreground block truncate max-w-[140px] sm:max-w-[180px]">
                                        {p.referenceNumber || "Direct Deposit"}
                                    </span>
                                </div>

                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Amount</span>
                                    <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums block">
                                        ₹{(p.amount || 0).toLocaleString()}
                                    </span>
                                </div>

                                {/* Proof View & Actions */}
                                <div className="flex items-center gap-2 ml-auto lg:ml-0">
                                    {p.proofImageUrl ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-2.5 text-xs rounded-lg gap-1 border-border/60 hover:bg-muted/50 cursor-pointer"
                                                >
                                                    <ImageIcon className="size-3.5 text-primary" />
                                                    <span className="hidden sm:inline">Proof Slip</span>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl p-4 rounded-2xl bg-card border-border/60 shadow-xl">
                                                <DialogHeader>
                                                    <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                                        <ImageIcon className="size-4 text-primary" />
                                                        Payment Artifact — {p.workspace?.name}
                                                    </DialogTitle>
                                                    <DialogDescription className="text-xs">
                                                        Ref: {p.referenceNumber} • ₹{(p.amount || 0).toLocaleString()}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="relative rounded-xl overflow-hidden bg-muted/30 border border-border/50 max-h-[70vh] flex items-center justify-center p-2">
                                                    <img
                                                        src={p.proofImageUrl}
                                                        alt="Payment Slip Proof"
                                                        className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xs"
                                                    />
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <Button asChild variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1">
                                                        <a href={p.proofImageUrl} target="_blank" rel="noopener noreferrer">
                                                            <span>Open Full Size</span>
                                                            <ExternalLink className="size-3" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <span className="text-[10px] font-bold text-muted-foreground px-2 py-1 rounded bg-muted">
                                            No Image
                                        </span>
                                    )}

                                    {/* Reject Dialog */}
                                    <Dialog
                                        open={selectedPaymentId === p.id}
                                        onOpenChange={(open) => !open && setSelectedPaymentId(null)}
                                    >
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedPaymentId(p.id)}
                                                className="h-8 px-2.5 text-xs rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/20 cursor-pointer"
                                            >
                                                <XCircle className="size-3.5 sm:mr-1" />
                                                <span className="hidden sm:inline">Reject</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md rounded-2xl border-border/60 p-5">
                                            <DialogHeader>
                                                <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                                    <ShieldAlert className="size-4" />
                                                    Reject Payment Submission
                                                </DialogTitle>
                                                <DialogDescription className="text-xs">
                                                    Specify the refusal reason for {p.workspace?.name}. The workspace admin will be notified to resubmit.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-2">
                                                <Textarea
                                                    placeholder="e.g. UTR / Transaction ID could not be reconciled with our bank statement..."
                                                    className="min-h-[100px] text-xs rounded-xl border-border/60"
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                />
                                            </div>
                                            <DialogFooter className="gap-2 sm:gap-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedPaymentId(null)}
                                                    className="h-8 text-xs rounded-lg"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleAction(p.id, false)}
                                                    disabled={isPending}
                                                    className="h-8 text-xs rounded-lg"
                                                >
                                                    {isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm Rejection"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Approve Button */}
                                    <Button
                                        size="sm"
                                        onClick={() => handleAction(p.id, true)}
                                        disabled={isPending}
                                        className="h-8 px-3 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer gap-1"
                                    >
                                        {isPending ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle2 className="size-3.5" />
                                                <span>Approve</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
