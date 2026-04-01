import { db } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, UserCircle, Phone, Globe, ChevronRight } from "lucide-react";
import { cookies } from "next/headers";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { auth } from "@clerk/nextjs/server";

export default async function GuestExamEntryPage(props: { params: Promise<{ examId: string }>, searchParams: Promise<{ error?: string }> }) {
    const { examId } = await props.params;
    const searchParams = await props.searchParams;

    // Check if the exam exists
    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: { workspace: true }
    });

    if (!exam || exam.status !== "ACTIVE") {
        return notFound();
    }

    // If it's not an OPEN_GUEST exam, redirect to the secure student platform
    if ((exam as any).accessType !== "OPEN_GUEST") {
        redirect(`/student/exams/${examId}/take`);
    }

    // If the user happens to be logged in via Clerk, we can pre-fill or allow direct transit
    // But per requirements, they still need the exam password unless they are specifically assigned.
    // For OPEN_GUEST exams, we will require the password universally.
    const { userId } = await auth();
    let prefillName = "";
    let prefillPhone = "";

    if (userId) {
        const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
        if (dbUser) {
            prefillName = `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim();
            prefillPhone = dbUser.phoneNumber || "";
        }
    }

    async function authorizeGuest(formData: FormData) {
        "use server";
        
        const name = formData.get("name") as string;
        const mobile = formData.get("mobile") as string;
        const password = formData.get("password") as string;

        if (password !== exam!.password) {
            redirect(`/live/${examId}?error=invalid_password`);
        }

        if (!name.trim() || !mobile.trim()) {
            redirect(`/live/${examId}?error=missing_fields`);
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(mobile)) {
            redirect(`/live/${examId}?error=invalid_phone`);
        }

        // Set secure cookie
        const cookieStore = await cookies();
        cookieStore.set(`guest_exam_${examId}`, JSON.stringify({ name, mobile }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 12, // 12 hours
            path: `/live/${examId}`
        });

        redirect(`/live/${examId}/take`);
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            <Card className="w-full max-w-lg border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] overflow-hidden relative z-10">
                <div className="bg-slate-950 p-8 sm:p-10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    
                    <div className="mx-auto w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative z-10">
                        <Globe className="w-8 h-8 text-primary" />
                    </div>
                    
                    <Badge className="bg-primary/20 text-primary border-none text-[10px] uppercase font-black tracking-widest px-3 py-1 mb-4">
                        Open Global Examination
                    </Badge>
                    <h1 className="text-2xl sm:text-3xl font-black text-white px-2 mt-2 leading-tight tracking-tight capitalize relative z-10">{exam.title}</h1>
                    <p className="text-slate-400 font-medium text-xs mt-3 capitalize">{exam.workspace.name}</p>
                </div>

                <CardContent className="p-8 sm:p-12">
                    <form action={authorizeGuest} className="space-y-6">
                        {searchParams.error === "invalid_password" && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold text-center">
                                Invalid exam password attempting entry.
                            </div>
                        )}
                        {searchParams.error === "missing_fields" && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold text-center">
                                Please provide both Name and Mobile Number.
                            </div>
                        )}
                        {searchParams.error === "invalid_phone" && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold text-center">
                                Please enter a valid 10-digit mobile number.
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Identity</Label>
                                <div className="relative">
                                    <UserCircle className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input 
                                        name="name" 
                                        placeholder="Your Full Name" 
                                        required 
                                        defaultValue={prefillName}
                                        className="h-14 pl-12 rounded-2xl border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 focus-visible:ring-primary" 
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mobile Number</Label>
                                <div className="relative">
                                    <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input 
                                        name="mobile" 
                                        placeholder="E.g., 9876543210" 
                                        required 
                                        pattern="[6-9][0-9]{9}"
                                        title="Please enter a valid 10-digit mobile number starting with 6-9."
                                        defaultValue={prefillPhone}
                                        className="h-14 pl-12 rounded-2xl border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 focus-visible:ring-primary" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Secure Passphrase</Label>
                                <PasswordInput 
                                    name="password" 
                                    placeholder="Enter the 16-digit or custom exam PIN" 
                                    required 
                                    className="h-14 rounded-2xl border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 focus-visible:ring-primary" 
                                />
                            </div>
                        </div>

                        <Button type="submit" size="lg" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-8">
                            Authenticate & Enter <ChevronRight className="w-5 h-5" />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest text-center max-w-sm">
                Protected by abcdExamHub Security Infrastructure
            </p>
        </div>
    );
}
