"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Rocket, ShieldCheck, Mail, Phone, Globe, User, CheckCircle2, ArrowRight, Clock, XCircle, MessageSquare } from "lucide-react";
import { createWorkspaceRequest } from "@/actions/workspace-request";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RequestFormContentProps {
    existingRequest: any;
    userEmail: string;
    userName: string;
    userId: string;
}

export default function RequestFormContent({ existingRequest, userEmail, userName, userId }: RequestFormContentProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isSuccess, setIsSuccess] = useState(false);

    const plan = searchParams.get("plan") || "FREE";
    const duration = searchParams.get("duration") || "1M";

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await createWorkspaceRequest({
                adminName: userName, // Use pre-filled name
                adminEmail: userEmail,
                adminPhone: formData.get("adminPhone") as string,
                whatsappNo: formData.get("whatsappNo") as string,
                workspaceName: formData.get("workspaceName") as string,
                planId: plan,
                planDuration: duration,
                userId: userId,
                address: formData.get("address") as string,
            });

            if (result.success) {
                setIsSuccess(true);
                toast.success("Request submitted successfully!");
            } else {
                toast.error(result.error || "Something went wrong.");
            }
        });
    }

    // Status View if Request Exists
    if (existingRequest && !isSuccess) {
        const isPending = existingRequest.status === 'PENDING';
        const isRejected = existingRequest.status === 'REJECTED';
        const isApproved = existingRequest.status === 'APPROVED';

        return (
            <Card className="border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                <div className={cn(
                    "p-12 text-center space-y-8",
                    isPending ? "bg-slate-50 dark:bg-zinc-900/50" : 
                    isRejected ? "bg-rose-50 dark:bg-rose-900/10" : "bg-emerald-50 dark:bg-emerald-900/10"
                )}>
                    <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg",
                        isPending ? "bg-amber-100 text-amber-600" : 
                        isRejected ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                        {isPending ? <Clock className="w-10 h-10" /> : isRejected ? <XCircle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
                    </div>
                    
                    <div className="space-y-3">
                        <Badge className={cn(
                            "border-none text-[10px] uppercase font-black tracking-widest px-4 py-1",
                            isPending ? "bg-amber-100 text-amber-700" : 
                            isRejected ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                            Current Status: {existingRequest.status}
                        </Badge>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                            {isPending ? "Transmission in Progress" : isRejected ? "Verification Declined" : "Workspace Activated"}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic max-w-lg mx-auto">
                            {isPending ? "Our core administration is currently reviewing your identity and institution details. Please allow up to 24 hours for final activation." : 
                             isRejected ? "Unfortunately, your request could not be verified at this time. Please contact support for detailed information." : 
                             "Your workspace is live! You can now log in as an administrator to start setting up your exams."}
                        </p>
                    </div>

                    <div className="pt-8 grid gap-4 max-w-sm mx-auto">
                        <Button asChild className="h-14 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black uppercase tracking-widest shadow-xl group">
                            <a href="https://wa.me/91XXXXXXXXXX" target="_blank">
                                <MessageSquare className="w-4 h-4 mr-2" /> Contact via WhatsApp
                            </a>
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/")} className="h-14 rounded-2xl font-black uppercase tracking-widest border-2">
                            Back to Home
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    if (isSuccess) {
        return (
            <div className="text-center space-y-8 py-12 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Request Received!</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-md mx-auto italic">
                        Your workspace request has been logged. Our administration team will verify your details and activate your workspace within <strong>24 hours</strong>.
                    </p>
                </div>
                <div className="pt-8">
                    <Button onClick={() => router.push("/")} className="h-14 rounded-2xl px-12 bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black uppercase tracking-widest shadow-xl">
                        Return to Homepage
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Card className="border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                <Badge className="bg-primary/20 text-primary border-none text-[10px] uppercase font-black tracking-widest px-3 py-1 mb-4">
                    Request {plan} Workspace
                </Badge>
                <CardTitle className="text-3xl font-black text-white tracking-tight">Setup Your Mission</CardTitle>
                <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                    Start your {plan === 'FREE' ? '30-day trial' : plan} journey in excellence
                </CardDescription>
            </div>
            <CardContent className="p-10 sm:p-12">
                <form action={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Admin Details */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                <User className="w-4 h-4" /> Identity Information
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase ml-1">Full Admin Name</Label>
                                    <Input name="adminName" value={userName} readOnly className="h-14 rounded-2xl bg-slate-100 dark:bg-zinc-900 border-none opacity-80 cursor-not-allowed font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase ml-1">Verified Email Address</Label>
                                    <Input name="adminEmail" type="email" value={userEmail} readOnly className="h-14 rounded-2xl bg-slate-100 dark:bg-zinc-900 border-none opacity-80 cursor-not-allowed font-bold" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase ml-1">Mobile No</Label>
                                        <Input name="adminPhone" placeholder="10 Digits" required className="h-14 rounded-2xl bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase ml-1">WhatsApp No</Label>
                                        <Input name="whatsappNo" placeholder="Optional" className="h-14 rounded-2xl bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Workspace Details */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Workspace Identity
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase ml-1">Institution / Workspace Name</Label>
                                    <Input name="workspaceName" placeholder="E.g. Suman's Academy" required className="h-14 rounded-2xl bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase ml-1">Institutional Location / Address</Label>
                                    <Input name="address" placeholder="City, State / Full Address" required className="h-14 rounded-2xl bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800" />
                                </div>
                                <div className="p-6 rounded-[2rem] bg-slate-900 text-white space-y-3 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Rocket className="w-12 h-12" />
                                     </div>
                                     <p className="text-[10px] font-black uppercase tracking-widest text-primary">Selected Package</p>
                                     <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black italic">{plan}</span>
                                        <span className="text-xs font-bold uppercase opacity-50">/ {duration}</span>
                                     </div>
                                     <p className="text-[10px] font-medium opacity-60 italic leading-relaxed">
                                        Deployment involves a verify-and-approve manual check ensuring absolute data integrity.
                                     </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-zinc-800 flex flex-col items-center gap-6">
                        <div className="flex items-start gap-3 max-w-lg text-center font-medium italic text-slate-500 dark:text-slate-400 text-sm">
                            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>By submitting, you agree to the 24-hour verification window and our administrative policy.</span>
                        </div>
                        <Button type="submit" disabled={isPending} className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-base group">
                            {isPending ? "Transmitting Data..." : "Finalize & Request Activation"}
                            {!isPending && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /> }
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
