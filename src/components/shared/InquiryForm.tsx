"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitInquiry } from "@/actions/inquiry";

export function InquiryForm() {
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const res = await submitInquiry(formData);
            if (res.success) {
                toast.success("Mission Inquiry Submitted! We'll get back to you soon.");
                // Reset form
                (document.getElementById("inquiry-form") as HTMLFormElement)?.reset();
            } else {
                toast.error(res.error || "Failed to submit inquiry.");
            }
        });
    }

    return (
        <div className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-2xl p-10 md:p-16 rounded-[3rem] border border-border/50 shadow-2xl relative group overflow-hidden h-full">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative z-10">
                <div className="space-y-4 mb-10">
                    <h3 className="text-3xl font-bold tracking-tight">Send a Message</h3>
                    <p className="text-sm text-muted-foreground italic font-medium">Fill out the form below and we'll get back to you within 24 hours.</p>
                </div>
                <form id="inquiry-form" action={handleSubmit} className="space-y-6">
                    {/* Honeypot field for spam protection - hidden from users */}
                    <div className="hidden">
                        <label htmlFor="address">Address</label>
                        <input type="text" id="address" name="address" tabIndex={-1} autoComplete="off" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="Suman Baidya"
                                required
                                suppressHydrationWarning
                                className="w-full bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl border border-border/70 rounded-2xl h-14 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work Email</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="suman@abcd.com"
                                required
                                suppressHydrationWarning
                                className="w-full bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl border border-border/70 rounded-2xl h-14 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label>
                            <input
                                name="phone"
                                type="tel"
                                placeholder="+91 00000 00000"
                                suppressHydrationWarning
                                className="w-full bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl border border-border/70 rounded-2xl h-14 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
                            <input
                                name="subject"
                                type="text"
                                placeholder="Institution Partnership"
                                suppressHydrationWarning
                                className="w-full bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl border border-border/70 rounded-2xl h-14 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Your Message</label>
                        <textarea
                            name="message"
                            placeholder="How can we help your institution?"
                            rows={5}
                            required
                            suppressHydrationWarning
                            className="w-full bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl border border-border/70 rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full h-16 bg-primary hover:bg-zinc-900 dark:hover:bg-white text-primary-foreground hover:text-primary transition-all font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isPending ? "Transmitting..." : "Submit Mission Inquiry"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
