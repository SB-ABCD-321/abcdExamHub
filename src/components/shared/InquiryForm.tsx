"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitInquiry } from "@/actions/inquiry";
import { ArrowRight, Send } from "lucide-react";

export function InquiryForm() {
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const res = await submitInquiry(formData);
            if (res.success) {
                toast.success("Inquiry submitted! We will contact you soon.");
                (document.getElementById("inquiry-form") as HTMLFormElement)?.reset();
            } else {
                toast.error(res.error || "Failed to submit inquiry.");
            }
        });
    }

    return (
        <div className="rounded-2xl bg-card border border-border/60 shadow-sm p-6 sm:p-7 flex flex-col justify-between h-full relative overflow-hidden group">
            <div className="space-y-1.5 mb-5">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Send a Message</h3>
                <p className="text-xs text-muted-foreground">Fill out the form below and our team will reach out within 24 hours.</p>
            </div>

            <form id="inquiry-form" action={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                {/* Honeypot field for spam protection */}
                <div className="hidden">
                    <label htmlFor="address">Address</label>
                    <input type="text" id="address" name="address" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-foreground">Full Name *</label>
                        <input
                            name="name"
                            type="text"
                            placeholder="e.g. Dr. Alex Mercer"
                            required
                            suppressHydrationWarning
                            className="w-full bg-background border border-border/60 rounded-xl h-10 px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-foreground">Work Email *</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="admin@academy.edu"
                            required
                            suppressHydrationWarning
                            className="w-full bg-background border border-border/60 rounded-xl h-10 px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-foreground">Phone Number</label>
                        <input
                            name="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            suppressHydrationWarning
                            className="w-full bg-background border border-border/60 rounded-xl h-10 px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-foreground">Subject</label>
                        <input
                            name="subject"
                            type="text"
                            placeholder="Institutional Partnership"
                            suppressHydrationWarning
                            className="w-full bg-background border border-border/60 rounded-xl h-10 px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col">
                    <label className="text-[11px] font-semibold text-foreground">Your Message *</label>
                    <textarea
                        name="message"
                        placeholder="Tell us about your institution, expected cohort size, or specific requirements..."
                        rows={4}
                        required
                        suppressHydrationWarning
                        className="w-full flex-1 min-h-[96px] bg-background border border-border/60 rounded-xl p-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium resize-none"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground transition-all font-semibold text-xs rounded-xl shadow-sm gap-2"
                >
                    <span>{isPending ? "Submitting inquiry..." : "Submit message"}</span>
                    <Send className="size-3.5" />
                </Button>
            </form>
        </div>
    );
}
