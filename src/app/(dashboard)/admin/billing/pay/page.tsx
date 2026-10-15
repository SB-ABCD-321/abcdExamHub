import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { OfflinePaymentForm } from "@/components/admin/OfflinePaymentForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, ShieldCheck, Mail, Phone, MessageCircle, ArrowLeft } from "lucide-react";
import { PaymentStatus } from "@prisma/client";
import { DashboardPage, DashboardHeader } from "@/components/layout/DashboardTemplate";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
            orderBy: { order: "asc" }
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
        <DashboardPage>
            {/* Standardized Dashboard Header */}
            <DashboardHeader
                title={<>Institutional <span className="text-primary font-black">Checkout</span></>}
                subtitle="Upgrade or renew your workspace tier via our verified offline settlement gateway."
                actions={
                    <Link href="/admin/billing">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 border-border/70 text-foreground hover:bg-muted/50"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Billing</span>
                        </Button>
                    </Link>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1 pb-12">
                {/* Main Payment Checkout Flow */}
                <div className="lg:col-span-8">
                    <OfflinePaymentForm 
                        workspace={user.adminWorkspace} 
                        plans={plans} 
                        settings={settings} 
                    />
                </div>

                {/* Right Column: Platform Integrity & Direct Institutional Support */}
                <div className="lg:col-span-4 space-y-5">
                    {/* Verification Cycle Card */}
                    <Card className="border border-border/70 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-border/40">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                Platform Integrity
                            </span>
                            <CardTitle className="text-sm font-bold text-foreground">
                                Verification Protocol
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-3.5 space-y-3 text-xs">
                            <div className="flex gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <p className="font-bold text-foreground text-[11px]">Manual Audit</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Offline transactions are audited by our accounts desk against banking statements for compliance.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                                <CreditCard className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <p className="font-bold text-foreground text-[11px]">Automated Provisioning</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Once cleared, your workspace limits and candidate caps are expanded instantly and a GST invoice is generated.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Official Support Card */}
                    <Card className="border border-border/70 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-border/40">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Direct Assistance
                            </span>
                            <CardTitle className="text-sm font-bold text-foreground">
                                Institutional Support
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-3.5 space-y-3 text-xs">
                            {settings?.email && (
                                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/40">
                                    <div className="w-7 h-7 rounded-lg bg-card border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
                                        <Mail className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Accounts Desk</span>
                                        <span className="text-xs font-semibold text-foreground truncate block select-all">{settings.email}</span>
                                    </div>
                                </div>
                            )}

                            {settings?.mobileNo && (
                                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/40">
                                    <div className="w-7 h-7 rounded-lg bg-card border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
                                        <Phone className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Phone Support</span>
                                        <span className="text-xs font-semibold text-foreground truncate block select-all">{settings.mobileNo}</span>
                                    </div>
                                </div>
                            )}

                            {settings?.whatsappNo && (
                                <a 
                                    href={`https://wa.me/${settings.whatsappNo.replace(/[^0-9]/g, "")}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-all group"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">WhatsApp Priority</span>
                                        <span className="text-xs font-bold text-foreground truncate block">{settings.whatsappNo}</span>
                                    </div>
                                </a>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardPage>
    );
}
