"use client";

import { useState, useEffect } from "react";
import { Clock, ArrowRight, Calendar, Headphones, Globe, MessageCircle, MessageSquare, Sparkles, User, AlertCircle, CalendarCheck, Mail, MapPin } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUser, SignInButton } from "@clerk/nextjs";
import { submitSupportInquiry, bookCallAppointment, getSupportSettings, getAvailableSlots } from "./actions";
import { format, addDays } from "date-fns";
import TypingText from "@/components/shared/TypingText";

export default function SupportContent({ initialSettings }: { initialSettings?: any }) {
    const { user, isLoaded } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingDate, setBookingDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
    const [selectedSlot, setSelectedSlot] = useState("");
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [settings, setSettings] = useState(initialSettings || { 
        location: "Kolkata, WB", 
        whatsappNo: "8944899747",
        email: "support@abcdexamhub.com",
        phone: "8944899747" 
    });

    useEffect(() => {
        if (initialSettings) return;
        const fetchSettings = async () => {
            const data = await getSupportSettings();
            setSettings(data as any);
        };
        fetchSettings();
    }, [initialSettings]);

    useEffect(() => {
        const fetchSlots = async () => {
            if (!bookingDate) return;
            setLoadingSlots(true);
            const slots = await getAvailableSlots(bookingDate);
            setAvailableSlots(slots);
            setSelectedSlot("");
            setLoadingSlots(false);
        };
        fetchSlots();
    }, [bookingDate]);

    async function handeInquiry(formData: FormData) {
        setIsSubmitting(true);
        const res = await submitSupportInquiry(formData);
        if (res.success) {
            toast.success("Inquiry received. Our engineering team will contact you shortly.");
            (document.getElementById("inquiry-form") as HTMLFormElement).reset();
        } else {
            toast.error("Transmission failed. Please try again.");
        }
        setIsSubmitting(false);
    }

    async function handleBooking(formData: FormData) {
        if (!selectedSlot) {
            toast.error("Please select an available consultation slot.");
            return;
        }
        setIsSubmitting(true);
        const res = await bookCallAppointment(formData);
        if (res.success) {
            toast.success("Consultation demo scheduled. Check your email for confirmation.");
            (document.getElementById("booking-form") as HTMLFormElement).reset();
            setBookingDate(format(addDays(new Date(), 1), "yyyy-MM-dd"));
            setSelectedSlot("");
        } else {
            toast.error(res.error || "Booking failed. Slot may no longer be available.");
        }
        setIsSubmitting(false);
    }

    const suggestBestTime = () => {
        if (availableSlots.length > 0) {
            setSelectedSlot(availableSlots[0]);
            toast.info(`Recommended slot: ${availableSlots[0]}`);
        } else {
            toast.error("No slots available for this date. Please select another day.");
        }
    };

    return (
        <div className="flex-1 w-full">
            {/* Hero — consistent typing title in one line, description in strictly two lines, no buttons */}
            <section className="relative pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 overflow-hidden bg-background border-b border-border/50 transition-colors">
                <div className="container mx-auto max-w-4xl text-center space-y-3.5 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                        <Headphones className="size-3.5 text-primary" />
                        <span className="text-[11px] font-semibold text-primary">Global support desk</span>
                    </div>

                    {/* Single-line Typing Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto text-foreground">
                        <span>Support & </span>
                        <span className="text-primary">
                            <TypingText
                                texts={["Consultation", "Live Advisory", "Tech Assistance", "Platform Setup"]}
                                speed={75}
                                eraseSpeed={35}
                                pauseDelay={2000}
                                delay={350}
                                cursor={true}
                                className="text-primary font-extrabold"
                            />
                        </span>
                    </h1>

                    {/* Strictly Two-Line Description */}
                    <p className="text-sm sm:text-base text-muted-foreground font-normal max-w-2xl sm:max-w-3xl mx-auto leading-relaxed">
                        Need assistance with institutional workspace setup, security compliance, or scaling?
                        <br className="hidden sm:inline" />
                        Our dedicated EdTech engineering specialists are available to assist your team anytime.
                    </p>
                </div>
            </section>

            {/* Contact & Booking Grid — strictly equal height matching */}
            <section className="py-10 sm:py-12 md:py-14 px-4 sm:px-6">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
                        {/* Inquiry Form (Left Column) */}
                        <div className="flex flex-col h-full space-y-3.5">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                    <MessageSquare className="size-3" />
                                    <span className="text-[10px] font-semibold">Send an inquiry</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    Submit a <span className="text-primary">Request</span>
                                </h2>
                                <p className="text-xs sm:text-sm text-muted-foreground">Detailed inquiries help us provide faster, accurate solutions.</p>
                            </div>

                            <form id="inquiry-form" action={handeInquiry} className="flex-1 flex flex-col justify-between p-5 sm:p-6 bg-card rounded-2xl border border-border/60 shadow-xs space-y-3.5">
                                <div className="space-y-3">
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground">Full Name *</label>
                                            <input suppressHydrationWarning name="name" required type="text" placeholder="Your Name" className="w-full bg-background border border-border/70 rounded-xl h-9.5 px-3.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-normal" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground">Email Address *</label>
                                            <input suppressHydrationWarning name="email" required type="email" placeholder="name@institution.com" className="w-full bg-background border border-border/70 rounded-xl h-9.5 px-3.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-normal" />
                                        </div>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground">Mobile Number *</label>
                                            <input suppressHydrationWarning name="phone" required type="tel" placeholder="+91 ..." className="w-full bg-background border border-border/70 rounded-xl h-9.5 px-3.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-normal" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                                <span>WhatsApp Number</span>
                                                <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                                            </label>
                                            <input suppressHydrationWarning name="whatsapp" type="tel" placeholder="+91 ... (optional)" className="w-full bg-background border border-border/70 rounded-xl h-9.5 px-3.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-normal" />
                                        </div>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                                <span>Institute Name</span>
                                                <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                                            </label>
                                            <input suppressHydrationWarning name="institution" type="text" placeholder="e.g. Apex Academy" className="w-full bg-background border border-border/70 rounded-xl h-9.5 px-3.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-normal" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground">Subject *</label>
                                            <input suppressHydrationWarning name="subject" required type="text" placeholder="Technical / Workspace / Other" className="w-full bg-background border border-border/70 rounded-xl h-9.5 px-3.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-normal" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground">Message *</label>
                                        <textarea suppressHydrationWarning name="message" required rows={3} placeholder="Describe your inquiry, student cohort size, or specific requirements..." className="w-full bg-background border border-border/70 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-normal resize-none" />
                                    </div>

                                    {/* Informative Guidance & SLA Card */}
                                    <div className="p-3 sm:p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-1 text-xs">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
                                                <Sparkles className="size-3.5 text-primary" />
                                                <span>Dedicated Academic Support SLA</span>
                                            </div>
                                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                Avg. Reply &lt; 2h
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Our engineering team directly assists faculty and administrators with workspace onboarding, proctoring security, and student capacity configuration.
                                        </p>
                                    </div>
                                </div>
                                <Button disabled={isSubmitting} size="sm" className="w-full h-9.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95 group mt-2">
                                    {isSubmitting ? "Sending..." : "Submit Inquiry"} <ArrowRight className="size-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </form>
                        </div>

                        {/* Call Booking (Right Column) */}
                        <div className="flex flex-col h-full space-y-3.5">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                    <Clock className="size-3" />
                                    <span className="text-[10px] font-semibold">Book a session</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    Schedule a <span className="text-primary">Demo</span>
                                </h2>
                                <p className="text-xs sm:text-sm text-muted-foreground">Book a quick 15-minute consultation with our assessment specialists.</p>
                            </div>

                            {!user ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-card rounded-2xl border border-border/60 shadow-xs text-center space-y-5">
                                    <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                        <CalendarCheck className="size-7" />
                                    </div>
                                    <div className="space-y-2 max-w-sm">
                                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
                                            <span>Institutional Consultation</span>
                                        </div>
                                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">Authentication Required</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Please sign in to view live available schedule slots, reserve your preferred time, and receive calendar invites directly.
                                        </p>
                                    </div>
                                    <div className="w-full max-w-xs space-y-2.5">
                                        <SignInButton mode="modal">
                                            <Button size="sm" className="w-full h-9.5 rounded-xl font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-xs">
                                                <span>Sign in to Schedule Demo</span>
                                                <ArrowRight className="size-3.5" />
                                            </Button>
                                        </SignInButton>
                                        <p className="text-[10px] text-muted-foreground">Instant access via Google or institutional email</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 bg-card rounded-2xl border border-border/60 shadow-xs relative overflow-hidden">
                                    <form id="booking-form" action={handleBooking} className="flex-1 flex flex-col justify-between space-y-3.5">
                                        <input type="hidden" name="timeSlot" value={selectedSlot} />
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-foreground">Full Name</label>
                                                <input suppressHydrationWarning readOnly defaultValue={user.fullName || ""} name="name" required type="text" className="w-full bg-muted/50 border border-border/70 rounded-xl h-9.5 px-3.5 text-xs sm:text-sm font-semibold opacity-80" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-foreground">Preferred Date</label>
                                                <input
                                                    suppressHydrationWarning
                                                    name="date"
                                                    required
                                                    type="date"
                                                    min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                                                    value={bookingDate}
                                                    onChange={(e) => setBookingDate(e.target.value)}
                                                    className="w-full bg-background border border-border/70 rounded-xl h-9.5 px-3.5 text-xs sm:text-sm font-medium"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-semibold text-foreground">Available Slots</label>
                                                    <button
                                                        type="button"
                                                        onClick={suggestBestTime}
                                                        className="text-[10px] font-semibold text-primary flex items-center gap-1 hover:underline"
                                                    >
                                                        <Sparkles size={11} /> Auto Suggest
                                                    </button>
                                                </div>

                                                {loadingSlots ? (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                                            <div key={i} className="h-8.5 rounded-lg bg-muted animate-pulse" />
                                                        ))}
                                                    </div>
                                                ) : availableSlots.length > 0 ? (
                                                    <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                                                        {availableSlots.map(slot => (
                                                            <button
                                                                key={slot}
                                                                type="button"
                                                                onClick={() => setSelectedSlot(slot)}
                                                                className={cn(
                                                                    "h-8.5 rounded-lg text-xs font-semibold border transition-all active:scale-95",
                                                                    selectedSlot === slot
                                                                        ? "bg-primary border-primary text-primary-foreground shadow-xs"
                                                                        : "bg-background border-border text-foreground hover:border-primary/50"
                                                                )}
                                                            >
                                                                {slot}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-3 bg-muted/30 rounded-xl border border-dashed border-border">
                                                        <p className="text-xs text-muted-foreground">No available slots for this date.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-foreground">Email</label>
                                                    <input readOnly defaultValue={user.primaryEmailAddress?.emailAddress || ""} suppressHydrationWarning name="email" required type="email" className="w-full bg-muted/50 border border-border/70 rounded-xl h-9.5 px-3.5 text-xs font-semibold opacity-80" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-foreground">Mobile</label>
                                                    <input suppressHydrationWarning name="phone" required type="tel" placeholder="+91 ..." className="w-full bg-background border border-border/70 rounded-xl h-9.5 px-3.5 text-xs font-medium" />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-foreground">Notes (Optional)</label>
                                                <textarea suppressHydrationWarning name="notes" placeholder="Any specific requirements..." rows={2} className="w-full bg-background border border-border/70 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-normal" />
                                            </div>
                                        </div>
                                        <Button disabled={isSubmitting || !selectedSlot} size="sm" className="w-full h-9.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-xs transition-all hover:bg-primary/90 mt-2">
                                            {isSubmitting ? "Confirming..." : "Confirm Booking"}
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Direct Support Channels Section — Redesigned Modern Enterprise Cards */}
            <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 border-t border-border/50 bg-secondary/20 dark:bg-zinc-900/20 transition-colors">
                <div className="container mx-auto max-w-7xl">
                    <div className="text-center space-y-2 mb-10 sm:mb-12 max-w-xl mx-auto">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                            <Globe className="size-3.5" />
                            <span className="text-[11px] font-semibold">Instant connectivity</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            Direct Support <span className="text-primary">Channels</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Connect with our operations engineers and platform architects through your preferred channel.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
                        {/* 1. WhatsApp Card */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/60 hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-xl transition-transform group-hover:scale-105">
                                        <FaWhatsapp />
                                    </div>
                                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                        Live Chat
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        WhatsApp Desk
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Instant messaging for operational questions, onboarding assistance, and quick updates.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 mt-4 border-t border-border/40 space-y-3">
                                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="size-3 text-emerald-500" />
                                    <span>Mon–Sat, 9AM–9PM IST</span>
                                </div>
                                <Button asChild size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 text-xs font-semibold shadow-xs transition-transform group-hover:scale-102">
                                    <a href={`https://wa.me/${(settings.whatsappNo || "8944899747").replace(/\+/g, "").replace(/ /g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                                        <span>Chat on WhatsApp</span>
                                        <ArrowRight className="size-3.5" />
                                    </a>
                                </Button>
                            </div>
                        </div>

                        {/* 2. Virtual Demo Card */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-transform group-hover:scale-105">
                                        <Calendar className="size-5" />
                                    </div>
                                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                                        1-on-1 Walkthrough
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                        Virtual Consultation
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Schedule a live video screen-share to explore AI generation, proctoring tools, and grading.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 mt-4 border-t border-border/40 space-y-3">
                                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Globe className="size-3 text-primary" />
                                    <span>Google Meet / Zoom</span>
                                </div>
                                <Button variant="outline" size="sm" asChild className="w-full rounded-xl h-9 text-xs font-semibold border-border hover:bg-muted transition-colors">
                                    <a href="#booking-form" className="flex items-center justify-center gap-1.5">
                                        <span>Book a Demo</span>
                                        <ArrowRight className="size-3.5" />
                                    </a>
                                </Button>
                            </div>
                        </div>

                        {/* 3. Email Helpdesk Card */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/60 hover:border-sky-500/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="size-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 transition-transform group-hover:scale-105">
                                        <Mail className="size-5" />
                                    </div>
                                    <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
                                        Official SLA
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                        Email Helpdesk
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Submit RFP requests, enterprise security reviews, audit requests, and institutional agreements.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 mt-4 border-t border-border/40 space-y-3">
                                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                                    <span className="truncate">{settings.email || "support@abcdexamhub.com"}</span>
                                </div>
                                <Button variant="outline" size="sm" asChild className="w-full rounded-xl h-9 text-xs font-semibold border-border hover:bg-muted transition-colors">
                                    <a href={`mailto:${settings.email || "support@abcdexamhub.com"}`} className="flex items-center justify-center gap-1.5">
                                        <span>Send Email</span>
                                        <ArrowRight className="size-3.5" />
                                    </a>
                                </Button>
                            </div>
                        </div>

                        {/* 4. On-Site Institutional Office */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-transform group-hover:scale-105">
                                        <MapPin className="size-5" />
                                    </div>
                                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                                        Regional Hub
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                        Institutional Office
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        In-person consultations for university boards, regional school districts, and institutional leadership.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 mt-4 border-t border-border/40 space-y-3">
                                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                    <span>{settings.location || "Kolkata, WB"}</span>
                                </div>
                                <Button variant="outline" size="sm" asChild className="w-full rounded-xl h-9 text-xs font-semibold border-border hover:bg-muted transition-colors">
                                    <a href="#inquiry-form" className="flex items-center justify-center gap-1.5">
                                        <span>Schedule Visit</span>
                                        <ArrowRight className="size-3.5" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function SocialButton({ icon, label, href, color }: { icon: React.ReactNode, label: string, href: string, color: string }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl transition-all group", color)}>
            <div className="text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all">{icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">{label}</span>
        </a>
    )
}
