"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { completeProfile } from "@/actions/profile";
import { Phone, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileSetupFormProps {
    defaultFirstName?: string;
    defaultLastName?: string;
}

export function ProfileSetupForm({ defaultFirstName = "", defaultLastName = "" }: ProfileSetupFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);
            const firstName = (formData.get("firstName") as string)?.trim();
            const lastName = (formData.get("lastName") as string)?.trim();
            const phoneNumber = (formData.get("phoneNumber") as string)?.trim();

            if (!firstName || !lastName) {
                toast.error("Please enter both your first and last name.");
                setIsSubmitting(false);
                return;
            }

            if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 7) {
                toast.error("Please enter a valid mobile number.");
                setIsSubmitting(false);
                return;
            }

            await completeProfile(formData);
            toast.success("Profile completed successfully!");
            router.push("/dashboard");
            router.refresh();
        } catch (error: any) {
            toast.error(error?.message || "Failed to update profile. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-semibold text-foreground/90">
                        First Name
                    </Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        required
                        defaultValue={defaultFirstName}
                        placeholder="First name"
                        className="h-10 sm:h-11 rounded-xl bg-background/60 border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium px-3.5 transition-all shadow-xs"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-semibold text-foreground/90">
                        Last Name
                    </Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        required
                        defaultValue={defaultLastName}
                        placeholder="Last name"
                        className="h-10 sm:h-11 rounded-xl bg-background/60 border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium px-3.5 transition-all shadow-xs"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="phoneNumber" className="text-xs font-semibold text-foreground/90">
                    Mobile Number
                </Label>
                <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        required
                        placeholder="+91 00000 00000"
                        className="h-10 sm:h-11 rounded-xl bg-background/60 border border-border/80 pl-10 pr-3.5 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
                    />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Used exclusively for identity verification & exam notifications.</span>
                </div>
            </div>

            <div className="pt-2">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 sm:h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Finalizing Account...
                        </>
                    ) : (
                        <>
                            Finalize Account
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </Button>
                <p className="text-center text-[10px] sm:text-[11px] text-muted-foreground/80 mt-2.5">
                    By continuing, you agree to our terms of academic integrity.
                </p>
            </div>
        </form>
    );
}
