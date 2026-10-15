import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle, ShieldCheck } from "lucide-react";
import { ProfileSetupForm } from "./ProfileSetupForm";

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
        <div className="h-screen max-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4 sm:p-6 font-sans overflow-hidden relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-[440px] max-h-[90vh] flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-3 sm:mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2 shadow-xs ring-4 ring-primary/5">
                        <UserCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider mb-1">
                            Account Setup
                        </Badge>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                            Complete Your Profile
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-xs mx-auto">
                            Provide your details to verify your identity on the platform.
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <Card className="border border-border/70 dark:border-zinc-800/80 shadow-2xl bg-card/95 backdrop-blur-xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-5 sm:p-6 pb-2.5 sm:pb-3 border-b border-border/40 bg-muted/10">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Identity Details</span>
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Please enter your legal name and an active mobile number.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-6 pt-4">
                        <ProfileSetupForm 
                            defaultFirstName={user?.firstName || ""} 
                            defaultLastName={user?.lastName || ""} 
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
