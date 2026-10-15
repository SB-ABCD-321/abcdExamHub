"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { 
    Check, 
    ChevronRight, 
    ChevronLeft,
    Upload, 
    IndianRupee, 
    Banknote, 
    CreditCard, 
    Clock, 
    Zap,
    ShieldCheck, 
    AlertCircle, 
    Loader2, 
    CheckCircle2, 
    QrCode, 
    Receipt, 
    Scale, 
    Copy,
    GraduationCap,
    Users,
    ClipboardList,
    Sparkles,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { submitPaymentProof } from "@/actions/financial-actions";
import { uploadToCloudinary } from "@/app/actions/upload";

interface OfflinePaymentFormProps {
    workspace: any;
    plans: any[];
    settings: any;
}

export function OfflinePaymentForm({ workspace, plans, settings }: OfflinePaymentFormProps) {
    // 3 Clean Steps: 1 = Plan Selection, 2 = Terms & Agreement, 3 = Transfer & Proof Upload
    const [step, setStep] = useState<number>(1);
    const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || "");
    const [duration, setDuration] = useState<"1M" | "6M" | "12M">("1M");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [hasAgreed, setHasAgreed] = useState(false);
    const [agreementSnapshot, setAgreementSnapshot] = useState("");
    const [isPending, startTransition] = useTransition();
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const selectedPlan = useMemo(() => plans.find(p => p.id === selectedPlanId), [selectedPlanId, plans]);

    const calculations = useMemo(() => {
        if (!selectedPlan) return { base: 0, gst: 0, total: 0 };
        
        let base = 0;
        if (duration === "1M") base = selectedPlan.price1Month;
        else if (duration === "6M") base = selectedPlan.price6Month;
        else if (duration === "12M") base = selectedPlan.price12Month;

        let gst = 0;
        if (settings?.isGstEnabled) {
            gst = base * ((settings.gstRate || 18) / 100);
        }

        return {
            base,
            gst,
            total: base + gst
        };
    }, [selectedPlan, duration, settings]);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        toast.success(`Copied ${label} to clipboard`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    async function handleSubmit() {
        if (!referenceNumber.trim()) {
            toast.error("Please enter a valid Transaction Ref / UTR Number.");
            return;
        }
        if (!proofFile) {
            toast.error("Please attach a screenshot or receipt of your transaction.");
            return;
        }

        startTransition(async () => {
            try {
                // 1. Upload proof to Cloudinary
                const proofImageUrl = await uploadToCloudinary(proofFile, "institutional-proofs") as string;
                if (!proofImageUrl) throw new Error("Proof image upload failed");

                // 2. Submit payment proof
                const res = await submitPaymentProof({
                    workspaceId: workspace.id,
                    planId: selectedPlanId,
                    duration,
                    proofImageUrl,
                    referenceNumber: referenceNumber.trim(),
                    amount: calculations.total,
                    agreementSnapshot
                });

                if (res.success) {
                    toast.success("Payment proof submitted successfully!");
                    setStep(4); // Success screen
                } else {
                    toast.error(res.error || "Submission failed.");
                }
            } catch (error: any) {
                toast.error(error.message || "An unexpected error occurred.");
            }
        });
    }

    // Success Screen
    if (step === 4) {
        return (
            <Card className="border border-border/70 bg-card/95 backdrop-blur-xl rounded-2xl shadow-md overflow-hidden text-center p-8 sm:p-12 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Payment Proof Submitted</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-md mx-auto">
                        Your transaction record has been logged in our verification queue. Once verified by our finance team, your workspace quota will be activated.
                    </p>
                </div>
                <div className="p-5 rounded-xl bg-muted/20 border border-border/60 space-y-3 max-w-md mx-auto text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-semibold">Reference ID</span>
                        <span className="font-mono font-bold text-foreground uppercase">{referenceNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-semibold">Settlement Amount</span>
                        <span className="font-bold text-foreground">₹{calculations.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-semibold">Audit Status</span>
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-[10px] uppercase tracking-wider">
                            Pending Audit
                        </Badge>
                    </div>
                </div>
                <div className="pt-2">
                    <Link href="/admin/billing">
                        <Button className="h-10 px-6 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
                            Return to Billing Dashboard
                        </Button>
                    </Link>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* STEPPER PROGRESS BAR */}
            <div className="flex items-center justify-between p-3.5 sm:px-5 sm:py-3 rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs">
                {[
                    { num: 1, label: "Select Plan" },
                    { num: 2, label: "Terms & Agreement" },
                    { num: 3, label: "Transfer & Proof" }
                ].map((s, idx) => (
                    <div key={s.num} className="flex items-center gap-2">
                        <div className={cn(
                            "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                            step === s.num
                                ? "bg-primary text-primary-foreground shadow-2xs"
                                : step > s.num
                                    ? "bg-emerald-500 text-white"
                                    : "bg-muted text-muted-foreground"
                        )}>
                            {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                        </div>
                        <span className={cn(
                            "text-xs font-bold hidden sm:inline",
                            step === s.num ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {s.label}
                        </span>
                        {idx < 2 && (
                            <div className={cn(
                                "w-8 sm:w-16 h-0.5 rounded-full mx-1 transition-all",
                                step > s.num ? "bg-emerald-500" : "bg-border/60"
                            )} />
                        )}
                    </div>
                ))}
            </div>

            {/* STEP 1: PLAN & DURATION SELECTION */}
            {step === 1 && (
                <Card className="border border-border/70 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden">
                    <CardContent className="p-5 sm:p-7 space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                            <div>
                                <h3 className="text-base font-bold text-foreground">Select Infrastructure Tier</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Choose the institutional capacity required for your academy.</p>
                            </div>

                            {/* Duration Switcher */}
                            <div className="flex p-1 bg-muted/30 border border-border/60 rounded-xl">
                                {[
                                    { id: "1M", label: "Monthly" },
                                    { id: "6M", label: "6 Months" },
                                    { id: "12M", label: "Yearly" }
                                ].map(d => (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => setDuration(d.id as any)}
                                        className={cn(
                                            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                            duration === d.id
                                                ? "bg-card text-foreground shadow-2xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Plan Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plans.map((plan) => {
                                const isSelected = selectedPlanId === plan.id;
                                const planPrice = duration === "1M" ? plan.price1Month : duration === "6M" ? plan.price6Month : plan.price12Month;
                                const studentsCap = duration === "1M" ? plan.maxStudents1Month : duration === "6M" ? plan.maxStudents6Month : plan.maxStudents12Month;
                                const teachersCap = duration === "1M" ? plan.maxTeachers1Month : duration === "6M" ? plan.maxTeachers6Month : plan.maxTeachers12Month;
                                const examsCap = duration === "1M" ? plan.maxExams1Month : duration === "6M" ? plan.maxExams6Month : plan.maxExams12Month;
                                const aiCap = duration === "1M" ? plan.aiLimit1Month : duration === "6M" ? plan.aiLimit6Month : plan.aiLimit12Month;

                                return (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={cn(
                                            "p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between group",
                                            isSelected
                                                ? "border-primary bg-primary/5 shadow-xs"
                                                : "border-border/60 bg-muted/10 hover:border-border hover:bg-muted/20"
                                        )}
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-extrabold text-base text-foreground">{plan.name}</h4>
                                                        {plan.isPopular && (
                                                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[9.5px] font-bold uppercase tracking-wider">
                                                                Popular
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.description || "Comprehensive academic tier"}</p>
                                                </div>

                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all",
                                                    isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                                                )}>
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="flex items-baseline gap-1.5 pt-1">
                                                <span className="text-2xl font-black text-foreground tabular-nums">
                                                    ₹{planPrice.toLocaleString()}
                                                </span>
                                                <span className="text-xs font-bold text-muted-foreground uppercase">
                                                    / {duration === "1M" ? "month" : duration === "6M" ? "6 months" : "year"}
                                                </span>
                                            </div>

                                            {/* Capacity Tags */}
                                            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/40 text-[11px]">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                                    <span>{studentsCap || 100} Students</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span>{teachersCap || 5} Instructors</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span>{examsCap || 20} Exams</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                    <span>{aiCap || 10} AI / Month</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Step 1 Actions */}
                        <div className="flex items-center justify-end pt-3 border-t border-border/40">
                            <Button
                                type="button"
                                onClick={() => setStep(2)}
                                className="h-10 px-6 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
                            >
                                <span>Continue to Agreement</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* STEP 2: TERMS & AGREEMENT */}
            {step === 2 && (
                <Card className="border border-border/70 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden">
                    <CardContent className="p-5 sm:p-7 space-y-5">
                        <div>
                            <h3 className="text-base font-bold text-foreground">Institutional Agreement & Disclaimers</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Please review the compliance policies before proceeding to payment.</p>
                        </div>

                        <div className="p-4 sm:p-5 rounded-xl bg-muted/20 border border-border/60 max-h-72 overflow-y-auto space-y-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Compliance Terms & Disclaimers</span>
                            </div>

                            <ul className="space-y-2.5">
                                <li className="flex gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>I understand that ABCD Exam Hub provides a specialized Computer-Based Testing platform for educational and assessment purposes.</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>I agree that subscription payments are non-refundable once the infrastructure node is verified and activated.</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>Our institute takes full responsibility for maintaining exam question integrity and candidate authenticity.</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>All offline verification requests are cleared through an audit handshake within the institutional SLA window.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Agreement Checkbox */}
                        <div
                            onClick={() => setHasAgreed(!hasAgreed)}
                            className="flex items-start gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/10 hover:border-primary/50 transition-all cursor-pointer"
                        >
                            <Checkbox
                                id="terms"
                                checked={hasAgreed}
                                onCheckedChange={(c) => setHasAgreed(c as boolean)}
                                className="rounded-md mt-0.5"
                            />
                            <div className="space-y-0.5 select-none">
                                <Label htmlFor="terms" className="text-xs font-bold text-foreground cursor-pointer">
                                    I agree to the Terms of Service, Refund Policy, and Privacy Terms.
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                    Confirmation required to unlock bank settlement details.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/40">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(1)}
                                className="h-9 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                                <span>Back</span>
                            </Button>

                            <Button
                                type="button"
                                disabled={!hasAgreed}
                                onClick={() => {
                                    setAgreementSnapshot(`Accepted by ${workspace.name} at ${new Date().toISOString()}`);
                                    setStep(3);
                                }}
                                className="h-10 px-6 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
                            >
                                <span>Proceed to Settlement</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* STEP 3: TRANSFER DETAILS & PROOF UPLOAD */}
            {step === 3 && (
                <Card className="border border-border/70 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden">
                    <CardContent className="p-5 sm:p-7 space-y-6">
                        <div>
                            <h3 className="text-base font-bold text-foreground">Settlement & Verification Handshake</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Transfer the exact subscription amount and submit your transaction reference number with a receipt.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left: Transfer Methods & Cost Summary */}
                            <div className="space-y-4">
                                {settings?.paymentUpiQrUrl && (
                                    <div className="p-4 rounded-xl border border-border/60 bg-muted/10 text-center space-y-3">
                                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                            <QrCode className="w-3.5 h-3.5" />
                                            <span>Scan with Any UPI App</span>
                                        </div>
                                        <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-2xl shadow-xs border border-border/40 overflow-hidden">
                                            <img src={settings.paymentUpiQrUrl} alt="UPI QR" className="w-full h-full object-contain" />
                                        </div>
                                        {settings.paymentUpiId && (
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-xs font-bold text-foreground font-mono">{settings.paymentUpiId}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(settings.paymentUpiId, "UPI ID")}
                                                    className="p-1 text-muted-foreground hover:text-foreground"
                                                    title="Copy UPI ID"
                                                >
                                                    {copiedField === "UPI ID" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Bank Details */}
                                {settings?.paymentBankDetails && (
                                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bank Account / NEFT Transfer</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(settings.paymentBankDetails, "Bank Details")}
                                                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                            >
                                                {copiedField === "Bank Details" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                <span>Copy Details</span>
                                            </button>
                                        </div>
                                        <p className="text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                                            {settings.paymentBankDetails}
                                        </p>
                                    </div>
                                )}

                                {/* Cost Breakdown */}
                                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2 text-xs">
                                    <div className="flex justify-between text-muted-foreground font-medium">
                                        <span>Base Subscription ({selectedPlan?.name})</span>
                                        <span className="font-bold text-foreground">₹{calculations.base.toLocaleString()}</span>
                                    </div>
                                    {settings?.isGstEnabled && (
                                        <div className="flex justify-between text-muted-foreground font-medium">
                                            <span>GST ({settings.gstRate}%)</span>
                                            <span className="font-bold text-foreground">₹{calculations.gst.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-primary/20 flex justify-between items-center text-sm font-bold text-foreground">
                                        <span className="uppercase text-[11px] tracking-wider text-primary">Total Payable</span>
                                        <span className="text-xl font-black text-primary tabular-nums">
                                            ₹{calculations.total.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Reference Number & Proof File */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground">
                                        Transaction UTR / Reference ID *
                                    </Label>
                                    <Input
                                        placeholder="e.g. 428901238941"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        className="h-10 rounded-xl border-border/60 bg-muted/20 font-mono text-xs font-bold uppercase focus-visible:bg-background"
                                    />
                                    <p className="text-[10.5px] text-muted-foreground">
                                        Enter the 12-digit UTR or transaction number from your banking/UPI receipt.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground">
                                        Upload Transaction Screenshot / Receipt *
                                    </Label>
                                    <label className={cn(
                                        "flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed cursor-pointer transition-all",
                                        proofFile
                                            ? "border-emerald-500/50 bg-emerald-500/5"
                                            : "border-border/70 hover:border-primary/50 hover:bg-muted/10"
                                    )}>
                                        {proofFile ? (
                                            <div className="text-center space-y-1">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                                                    <Check className="w-5 h-5 stroke-[2.5]" />
                                                </div>
                                                <span className="text-xs font-bold text-foreground block truncate max-w-[200px]">
                                                    {proofFile.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">Click to replace document</span>
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-1">
                                                <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
                                                <span className="text-xs font-bold text-foreground block">
                                                    Click to browse receipt
                                                </span>
                                                <span className="text-[10.5px] text-muted-foreground block">
                                                    PNG, JPG or PDF up to 10MB
                                                </span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                <div className="p-3 rounded-xl bg-muted/20 border border-border/50 flex items-start gap-2 text-[11px] text-muted-foreground">
                                    <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>Our financial audit team manually validates each payment record against bank statements before node unlocking.</span>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/40">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(2)}
                                disabled={isPending}
                                className="h-9 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                                <span>Back</span>
                            </Button>

                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isPending || !referenceNumber.trim() || !proofFile}
                                className="h-10 px-6 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Submitting Proof...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>Submit Payment Proof</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
