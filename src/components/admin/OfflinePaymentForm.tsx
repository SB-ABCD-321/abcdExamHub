"use client";

import { useState, useTransition, useMemo } from "react";
import { 
    Check, 
    ChevronRight, 
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
    const [step, setStep] = useState(0);
    const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || "");
    const [duration, setDuration] = useState<"1M" | "6M" | "12M">("1M");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [hasAgreed, setHasAgreed] = useState(false);
    const [agreementSnapshot, setAgreementSnapshot] = useState("");
    const [isPending, startTransition] = useTransition();

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

    async function handleSubmit() {
        if (!referenceNumber.trim()) {
            toast.error("Please enter a valid Transaction Ref / Reference Number.");
            return;
        }
        if (!proofFile) {
            toast.error("Please upload a screenshot or receipt of your transaction.");
            return;
        }

        startTransition(async () => {
            try {
                // 1. Upload proof to Cloudinary - Dedicated folder
                const proofImageUrl = await uploadToCloudinary(proofFile, "institutional-proofs") as string;
                if (!proofImageUrl) throw new Error("Proof upload failed");

                // 2. Submit to database
                const res = await submitPaymentProof({
                    workspaceId: workspace.id,
                    planId: selectedPlanId,
                    duration,
                    proofImageUrl,
                    referenceNumber,
                    amount: calculations.total,
                    agreementSnapshot
                });

                if (res.success) {
                    toast.success("Payment proof submitted successfully!");
                    setStep(5); // Success step
                } else {
                    toast.error(res.error || "Submission failed.");
                }
            } catch (error: any) {
                toast.error(error.message || "An unexpected error occurred.");
            }
        });
    }

    if (step === 5) {
        return (
            <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden text-center p-12 space-y-8">
                <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Proof Submitted!</h2>
                    <p className="text-muted-foreground font-medium">Your payment is now in the queue for verification.</p>
                </div>
                <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 space-y-4 max-w-md mx-auto">
                    <div className="flex justify-between text-sm">
                        <span className="font-black text-slate-400 uppercase tracking-widest">Transaction ID</span>
                        <span className="font-mono font-black text-slate-950 dark:text-white uppercase">{referenceNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="font-black text-slate-400 uppercase tracking-widest">Status</span>
                        <Badge className="bg-amber-500 text-white border-none font-black text-[10px] uppercase tracking-widest">Pending Audit</Badge>
                    </div>
                </div>
                <Button asChild className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest transition-all">
                    <a href="/admin/billing">Return to Dashboard</a>
                </Button>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            {/* Steps Progress */}
            <div className="flex items-center gap-4 px-2 overflow-x-auto pb-2 scrollbar-hide">
                {[0, 1, 2, 3, 4].map(s => (
                    <div key={s} className="flex items-center gap-2 shrink-0">
                        <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all",
                            step >= s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 text-slate-400 dark:bg-zinc-800"
                        )}>
                            {s === 0 ? "PREP" : s}
                        </div>
                        {s < 4 && <div className={cn("w-6 h-0.5 rounded-full transition-all", step > s ? "bg-primary" : "bg-slate-100 dark:bg-zinc-800")} />}
                    </div>
                ))}
            </div>

            {/* Step 0: Preparation & Checklist */}
            {step === 0 && (
                <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden">
                    <CardContent className="p-8 lg:p-12 space-y-10">
                        <div className="space-y-4">
                            <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px] uppercase tracking-widest px-4 py-1.5">Preparation Phase</Badge>
                            <h2 className="text-3xl font-bold tracking-tight leading-none">Ready for <span className="text-primary">Activation?</span></h2>
                            <p className="text-sm font-medium text-slate-500 max-w-xl">Ensure you have your payment app ready and sufficient institutional funds cleared before initiating the secure handshake.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: "App Authorization", desc: "Ensure your UPI or Banking app is authenticated and ready for transfer.", icon: Zap },
                                { title: "Balance Validation", desc: "Verify sufficient liquidity in your institutional account for the selected tier.", icon: IndianRupee },
                                { title: "Artifact Capture", desc: "Be prepared to take a clear screenshot of the successful transaction proof.", icon: Receipt },
                                { title: "Ref Registry", desc: "You will need the 12-digit UTR or Transaction ID for our ledger audit.", icon: ShieldCheck }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800/50 hover:border-primary/20 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-primary shrink-0 shadow-sm">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">{item.title}</h4>
                                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button onClick={() => setStep(1)} className="w-full h-14 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-slate-900/20">
                            Begin Institutional Renewal <ChevronRight className="w-4 h-4" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 1: Plan Selection */}
            {step === 1 && (
                <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden">
                    <CardContent className="p-8 lg:p-12 space-y-10">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Select Infrastructure Tier</h2>
                            <p className="text-sm font-medium text-slate-400">Choose the resource capacity required for your institution.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {plans.map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={cn(
                                        "p-6 rounded-3xl border-2 text-left transition-all relative group",
                                        selectedPlanId === plan.id 
                                            ? "border-primary bg-primary/5 ring-4 ring-primary/5" 
                                            : "border-slate-100 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                                    )}
                                >
                                    {selectedPlanId === plan.id && (
                                        <div className="absolute top-4 right-4 w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold tracking-tight">{plan.name}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 mb-4 opacity-70">{plan.description || "Scalable academic infrastructure"}</p>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                        ₹{duration === "1M" ? plan.price1Month : (duration === "6M" ? plan.price6Month : plan.price12Month)}
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">/ cycle</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6 pt-6 border-t border-slate-50 dark:border-zinc-800/50">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Lock-in Duration</h3>
                            <div className="flex p-1.5 bg-slate-100 dark:bg-zinc-950 rounded-2xl w-fit">
                                {[
                                    { id: "1M", label: "Monthly" },
                                    { id: "6M", label: "Bi-Annual" },
                                    { id: "12M", label: "Yearly" }
                                ].map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDuration(d.id as any)}
                                        className={cn(
                                            "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            duration === d.id ? "bg-white dark:bg-zinc-900 text-primary shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button onClick={() => setStep(2)} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest">
                            Continue to Agreement <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Terms & Agreement */}
            {step === 2 && (
                <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden">
                    <CardContent className="p-8 lg:p-12 space-y-10">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Legal & Agreement</h2>
                            <p className="text-sm font-medium text-slate-400">Please read and accept our user terms before proceeding to payment.</p>
                        </div>

                        <div className="p-6 md:p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 max-h-[400px] overflow-y-auto custom-scrollbar relative shadow-inner">
                            <div className="space-y-8 text-sm text-slate-600 dark:text-slate-300">
                                {/* Header */}
                                <div>
                                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-2">
                                        <AlertCircle className="w-4 h-4" /> User Agreement & Confirmation
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white">Before continuing, please read and accept the following:</p>
                                </div>
                                                                <ul className="space-y-4">
                                    {settings?.paymentTermsContent ? (
                                        settings.paymentTermsContent.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => (
                                            <li key={i} className="flex gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                <span>{line.trim()}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <>
                                            <li className="flex gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                <span>I understand that {settings?.siteName || 'ABCD Exam Hub'} provides a CBT exam platform for educational use.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                <span>I agree that all payments are non-refundable after subscription activation, except in limited cases mentioned in the Refund Policy.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                <span>I confirm that I have tested or understand the platform features (via demo/free trial).</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                <span>I agree to follow all platform rules and not misuse the system.</span>
                                            </li>
                                        </>
                                    )}
                                </ul>

                                <div className="w-full h-[1px] bg-zinc-200 dark:bg-zinc-800" />

                                <div className="space-y-6 pt-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-2">
                                            <Scale className="w-4 h-4" /> Disclaimer – {settings?.siteName || 'ABCD Exam Hub'}
                                        </div>
                                        <p className="opacity-80">Effective Date: {new Date().toLocaleDateString('en-GB')}</p>
                                        <div className="mt-2 text-justify whitespace-pre-wrap leading-relaxed">
                                            {settings?.paymentDisclaimerContent || (
                                                <>
                                                    The information and services provided by {settings?.siteName || 'ABCD Exam Hub'} are for general use and educational support purposes only. By using our platform, you agree to this Disclaimer.
                                                    <br /><br />
                                                    1. No Guarantee of Results: We do NOT guarantee student success in exams, accuracy of results in all cases, or improvement in performance. All outcomes depend on user input, usage, and external factors.
                                                    <br /><br />
                                                    2. Platform Usage Responsibility: Users are solely responsible for creating and managing exam content, verifying questions, and ensuring fair exam practices.
                                                    <br /><br />
                                                    3. Limitation of Liability: Under no circumstances shall {settings?.siteName || 'ABCD Exam Hub'} be liable for any direct or indirect loss, business interruption, loss of revenue, data, or reputation. Use of the platform is entirely at your own risk.
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-800/50 border-2 border-slate-100 dark:border-zinc-800/50 hover:border-primary/50 transition-all cursor-pointer" onClick={() => setHasAgreed(!hasAgreed)}>
                            <Checkbox 
                                id="terms" 
                                checked={hasAgreed}
                                onCheckedChange={(c) => setHasAgreed(c as boolean)}
                                className="w-6 h-6 rounded-md data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-slate-300 dark:border-zinc-700 mt-0.5"
                            />
                            <div className="space-y-1 select-none">
                                <Label htmlFor="terms" className="text-sm font-bold cursor-pointer text-slate-900 dark:text-white">
                                    I have read and agree to the Terms & Conditions, Privacy Policy, Refund Policy, and Disclaimer.
                                </Label>
                                <p className="text-xs text-slate-500">You must accept the terms before proceeding to the payment step.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setStep(1)} className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-slate-400">Back</Button>
                            <Button 
                                onClick={() => {
                                    // Capture snapshot of what the user agreed to
                                    const snapshot = `
USER AGREEMENT HIGHLIGHTS:
${settings?.paymentTermsContent || "Standard Terms Applied"}

LEGAL DISCLAIMER:
${settings?.paymentDisclaimerContent || "Standard Disclaimer Applied"}

ACCEPTED BY: ${workspace.name} (Admin)
TIMESTAMP: ${new Date().toISOString()}
PLATFORM: ${settings?.siteName || "ABCD Exam Hub"}
                                    `.trim();
                                    setAgreementSnapshot(snapshot);
                                    setStep(3);
                                }} 
                                disabled={!hasAgreed} 
                                className={cn("flex-1 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all", hasAgreed ? "bg-primary text-white shadow-primary/20 hover:bg-primary/90" : "bg-slate-100 text-slate-400 dark:bg-zinc-800 shadow-none pointer-events-none")}
                            >
                                Continue to Payment <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Payment Details */}
            {step === 3 && (
                <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden">
                    <CardContent className="p-8 lg:p-12 space-y-10">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Offline Fulfillment</h2>
                            <p className="text-sm font-medium text-slate-400">Complete the transaction via the methods below.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Visual Instructions */}
                            <div className="space-y-6">
                                {settings?.paymentUpiQrUrl ? (
                                    <div className="p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-center space-y-6">
                                        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                            <QrCode className="w-4 h-4" /> Scan to Pay
                                        </div>
                                        <div className="w-56 h-56 mx-auto bg-white p-4 rounded-3xl shadow-2xl overflow-hidden">
                                            <img src={settings.paymentUpiQrUrl} alt="UPI QR" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-black tracking-tight">{settings.paymentUpiId || "Billing Shard Active"}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All UPI Apps Supported</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 rounded-[2.5rem] bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex flex-col items-center justify-center text-center space-y-4">
                                        <Banknote className="w-12 h-12 text-indigo-200" />
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Manual Entry Required</p>
                                    </div>
                                )}
                            </div>

                            {/* Bank Details & Summary */}
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 lg:mt-4">Bank/NEFT Transfer</h3>
                                    <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 whitespace-pre-wrap font-bold text-sm text-slate-600 dark:text-slate-300">
                                        {settings?.paymentBankDetails || "Contact platform admin for direct bank details."}
                                    </div>
                                </div>

                                <div className="p-8 rounded-[2rem] bg-slate-950 text-white space-y-6 shadow-2xl shadow-slate-950/20">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Checkout Summary</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm font-bold opacity-60">
                                            <span>Base Tier Cost</span>
                                            <span className="tabular-nums">₹{calculations.base.toLocaleString()}</span>
                                        </div>
                                        {settings?.isGstEnabled && (
                                            <div className="flex justify-between items-center text-sm font-bold opacity-60">
                                                <span>GST ({settings.gstRate}%)</span>
                                                <span className="tabular-nums">₹{calculations.gst.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="pt-3 border-t border-white/10 flex justify-between items-center bg-primary/5 -mx-8 px-8 py-4 mt-4">
                                            <span className="text-xs font-bold uppercase tracking-widest text-primary">Settlement Total</span>
                                            <span className="text-4xl font-bold tracking-tight tabular-nums text-white drop-shadow-lg">
                                                ₹{calculations.total.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setStep(2)} className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-slate-400">Back</Button>
                            <Button onClick={() => setStep(4)} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest">
                                Proceed to Proof Upload <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Proof Upload */}
            {step === 4 && (
                <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden">
                    <CardContent className="p-8 lg:p-12 space-y-10">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Audit Credentials</h2>
                            <p className="text-sm font-medium text-slate-400">Submit your transaction artifacts for verification.</p>
                        </div>

                        <div className="space-y-10 max-w-2xl mx-auto">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Reference Number / UTR / TXN ID</Label>
                                <Input 
                                    className="h-16 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-white font-black text-lg focus:ring-4 focus:ring-primary/10 transition-all uppercase placeholder:text-slate-200"
                                    placeholder="Enter 12-digit UPI Ref or Bank UTR"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-60">Must match exactly as shown in your payment app</p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 text-center block">Upload Visual Artifact (Receipt/Screenshot)</Label>
                                <div 
                                    className={cn(
                                        "relative h-64 rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden group",
                                        proofFile 
                                            ? "border-emerald-500 bg-emerald-500/5" 
                                            : "border-slate-100 dark:border-zinc-800 hover:border-primary/50 hover:bg-zinc-50"
                                    )}
                                    onClick={() => document.getElementById("proof-upload")?.click()}
                                >
                                    {proofFile ? (
                                        <div className="text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 scale-110 shadow-xl shadow-emerald-500/20">
                                                <Check className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-black text-emerald-600 uppercase tracking-tight">{proofFile.name}</p>
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1 opacity-70">Artifact Capture Successful</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 rounded-[2rem] bg-slate-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all transform group-hover:-translate-y-2">
                                                <Upload className="w-8 h-8" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold tracking-tight">Click to Capture</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">PNG, JPG or PDF up to 10MB</p>
                                            </div>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        id="proof-upload" 
                                        className="hidden" 
                                        accept="image/*,application/pdf" 
                                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">Anti-Spam Policy</p>
                                <p className="text-[10px] font-medium text-amber-800/80 dark:text-amber-200/60 leading-relaxed">
                                    Submission of forged or repetitive proofs will result in immediate node suspension. Verified accounts are manually cleared within the audit window.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setStep(3)} className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-slate-400" disabled={isPending}>Back</Button>
                            <Button 
                                onClick={handleSubmit} 
                                disabled={isPending}
                                className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20"
                            >
                                {isPending ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Transmitting Logic...</>
                                ) : (
                                    <><ShieldCheck className="w-5 h-5 mr-2" /> Verify & Activate Tier</>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
