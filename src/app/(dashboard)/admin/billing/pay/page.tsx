import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { OfflinePaymentForm } from "@/components/admin/OfflinePaymentForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, ShieldCheck, Mail, Phone, MessageCircle } from "lucide-react";
import { PaymentStatus } from "@prisma/client";

export default async function AdminPaymentPayPage() {
    const { userId } = await auth();
    if (!userId) return notFound();

    const [user, settings, plans] = await Promise.all([
        db.user.findUnique({
            where: { clerkId: userId },
            include: { adminWorkspace: true }
        }),
        db.siteSetting.findFirst(),
        db.pricingPlan.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        })
    ]);

    if (!user || !user.adminWorkspace) return notFound();

    // Check for existing pending verification
    const pending = await db.workspacePayment.findFirst({
        where: {
            workspaceId: user.adminWorkspace.id,
            status: PaymentStatus.PENDING_VERIFICATION
        }
    });

    if (pending) {
        return redirect("/admin/billing");
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            <div className="space-y-1 text-center py-6">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-none">
                    Institutional <span className="text-primary">Checkout</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl mx-auto">
                    Upgrade or renew your workspace tier via our secure offline verification system.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8">
                    <OfflinePaymentForm 
                        workspace={user.adminWorkspace} 
                        plans={plans} 
                        settings={settings} 
                    />
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-slate-950 text-white rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <CardDescription className="text-primary font-black uppercase tracking-widest text-[9px]">Platform Integrity</CardDescription>
                            <CardTitle className="text-lg font-black tracking-tight uppercase">Verification Cycle</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4">
                            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-wider">Manual Audit</p>
                                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                                        Every offline transaction undergoes a 3-layer verification by our financial team to ensure compliance.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <CreditCard className="w-5 h-5 text-primary shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-wider">24H Fulfillment</p>
                                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                                        Once verified, your infrastructure limits will be updated automatically and an invoice will be generated.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">Institutional Support</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Urgent Renewals & Setup Assistance</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {settings?.email && (
                                <div className="flex items-center gap-4 group">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Official Mail</p>
                                        <p className="text-[11px] font-black text-slate-900 dark:text-zinc-100 select-all">{settings.email}</p>
                                    </div>
                                </div>
                            )}

                            {settings?.mobileNo && (
                                <div className="flex items-center gap-4 group">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Direct Support</p>
                                        <p className="text-[11px] font-black text-slate-900 dark:text-zinc-100 select-all">{settings.mobileNo}</p>
                                    </div>
                                </div>
                            )}

                            {settings?.whatsappNo && (
                                <a 
                                    href={`https://wa.me/${settings.whatsappNo.replace(/[^0-9]/g, "")}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 group hover:bg-emerald-50 dark:hover:bg-emerald-500/5 -mx-4 px-4 py-2 rounded-2xl transition-all"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <MessageCircle className="w-4 h-4 fill-current" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">WhatsApp Connect</p>
                                        <p className="text-[11px] font-black text-slate-900 dark:text-zinc-100">{settings.whatsappNo}</p>
                                    </div>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
