import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { completeProfile } from "@/actions/profile";
import { UserCircle, Phone, ArrowRight, ShieldCheck } from "lucide-react";

export default async function ProfileSetupPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const user = await currentUser();
    const dbUser = await db.user.findUnique({
        where: { clerkId: userId }
    });

    if ((dbUser as any)?.isProfileComplete) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-6 shadow-xl shadow-primary/10">
                        <UserCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Complete Your Profile</h1>
                    <p className="text-slate-500 dark:text-zinc-400 mt-2 font-medium italic">We need a few details to verify your identity on the platform.</p>
                </div>

                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-sm font-bold tracking-widest text-primary flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Identification
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium">Please enter your legal name and a valid mobile number.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4">
                        <form action={completeProfile} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" suppressHydrationWarning className="text-[10px] font-bold tracking-widest text-slate-500 ml-1">First Name</Label>
                                    <Input 
                                        id="firstName" 
                                        name="firstName" 
                                        required 
                                        placeholder="Suman" 
                                        defaultValue={user?.firstName || ""} 
                                        suppressHydrationWarning
                                        className="h-12 rounded-2xl bg-slate-100/50 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold px-4"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" suppressHydrationWarning className="text-[10px] font-bold tracking-widest text-slate-500 ml-1">Last Name</Label>
                                    <Input 
                                        id="lastName" 
                                        name="lastName" 
                                        required 
                                        placeholder="Baidya" 
                                        defaultValue={user?.lastName || ""} 
                                        className="h-12 rounded-2xl bg-slate-100/50 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold px-4"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber" suppressHydrationWarning className="text-[10px] font-bold tracking-widest text-slate-500 ml-1">Mobile Number</Label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        id="phoneNumber" 
                                        name="phoneNumber" 
                                        type="tel" 
                                        required 
                                        placeholder="+91 00000 00000" 
                                        suppressHydrationWarning
                                        className="h-12 rounded-2xl bg-slate-100/50 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold pl-12 pr-4 shadow-sm"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-medium italic mt-1 ml-1">* Used for exam verification and critical notifications only.</p>
                            </div>

                            <div className="pt-4">
                                <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                    Finalize Account <ArrowRight className="w-5 h-5" />
                                </Button>
                                <p className="text-center text-[10px] text-slate-400 font-medium mt-6">By continuing, you agree to our terms of academic integrity.</p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
