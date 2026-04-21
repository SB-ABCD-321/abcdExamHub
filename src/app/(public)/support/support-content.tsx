"use client";

import { useState, useEffect } from "react";
import { Clock, ArrowRight, Calendar, Headphones, Globe, MessageCircle, MessageSquare, Sparkles, User, AlertCircle, CalendarCheck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUser, SignInButton } from "@clerk/nextjs";
import { submitSupportInquiry, bookCallAppointment, getSupportSettings, getAvailableSlots } from "./actions";
import { format, addDays } from "date-fns";

export default function SupportContent() {
    const { user, isLoaded } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingDate, setBookingDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
    const [selectedSlot, setSelectedSlot] = useState("");
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [settings, setSettings] = useState({ 
        location: "Kolkata, WB", 
        whatsappNo: "8944899747",
        email: "support@abcdexamhub.com",
        phone: "8944899747" 
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const data = await getSupportSettings();
            setSettings(data as any);
        };
        fetchSettings();
    }, []);

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
            toast.success("Mission message transmitted. We will contact you shortly.");
            (document.getElementById("inquiry-form") as HTMLFormElement).reset();
        } else {
            toast.error("Transmission failed. Please try again.");
        }
        setIsSubmitting(false);
    }

    async function handleBooking(formData: FormData) {
        if (!selectedSlot) {
            toast.error("Please select a tactical time slot.");
            return;
        }
        setIsSubmitting(true);
        const res = await bookCallAppointment(formData);
        if (res.success) {
            toast.success("Consultation mission scheduled. Check your email for confirmation.");
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
            toast.info(`Strategic recommendation: ${availableSlots[0]}`);
        } else {
            toast.error("No units available for this date. Select another day.");
        }
    };

    return (
        <div className="flex-1">
            {/* Hero */}
            <section className="py-20 px-6">
                <div className="container mx-auto max-w-7xl text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                        <Headphones className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">24/7 Global Intelligence</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1]">
                        Mission <br />
                        <span className="text-primary italic">Support Center</span>
                    </h1>
                    <p className="text-xl text-muted-foreground font-medium italic max-w-2xl mx-auto leading-relaxed">
                        Need assistance with your workspace or looking to scale? Our strategic support team is ready to assist.
                    </p>
                </div>
            </section>

            {/* Contact & Booking Grid */}
            <section className="py-20 px-6">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* Inquiry Form */}
                        <div className="space-y-12">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-muted-foreground transition-all hover:bg-zinc-200/50">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Inquiry Pipeline</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                                    Mission <span className="text-primary">Inquiry</span>
                                </h2>
                                <p className="text-muted-foreground italic font-medium text-sm md:text-base">Detailed inquiries help us provide faster tactical solutions.</p>
                            </div>

                            <form id="inquiry-form" action={handeInquiry} className="space-y-6 p-10 bg-zinc-50 dark:bg-zinc-900 rounded-[3rem] border border-border/50 shadow-2xl">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                                        <input suppressHydrationWarning name="name" required type="text" placeholder="Commander Name" className="w-full bg-white dark:bg-zinc-950 border border-border/70 rounded-2xl h-14 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mission Email</label>
                                        <input suppressHydrationWarning name="email" required type="email" placeholder="name@base.com" className="w-full bg-white dark:bg-zinc-950 border border-border/70 rounded-2xl h-14 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">WhatsApp/Mobile</label>
                                        <input suppressHydrationWarning name="phone" required type="tel" placeholder="+91 ..." className="w-full bg-white dark:bg-zinc-950 border border-border/70 rounded-2xl h-14 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
                                        <input suppressHydrationWarning name="subject" required type="text" placeholder="Technical/SaaS/API" className="w-full bg-white dark:bg-zinc-950 border border-border/70 rounded-2xl h-14 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Message Content</label>
                                    <textarea suppressHydrationWarning name="message" required rows={4} className="w-full bg-white dark:bg-zinc-950 border border-border/70 rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                </div>
                                <Button disabled={isSubmitting} className="w-full h-16 bg-zinc-950 text-white dark:bg-white dark:text-zinc-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95 group">
                                    {isSubmitting ? "Transmitting..." : "Send Mission Brief"} <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </form>
                        </div>

                        {/* Call Booking */}
                        <div className="space-y-12">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary transition-all hover:bg-primary/15">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Strategic Slotting</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                                    Strategic <span className="text-primary">Demo</span>
                                </h2>
                                <p className="text-muted-foreground italic font-medium text-sm md:text-base">Book a 15-minute consultation mission with our experts.</p>
                            </div>

                            {!user ? (
                                <div className="p-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-primary/20 flex flex-col items-center text-center space-y-6">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <AlertCircle size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold tracking-tight">Identity Authentication Required</h3>
                                        <p className="text-sm text-muted-foreground font-medium italic">Please log in to your commander console to schedule a strategic mission.</p>
                                    </div>
                                    <SignInButton mode="modal">
                                        <Button className="h-14 px-10 bg-zinc-950 text-white dark:bg-white dark:text-zinc-900 font-black uppercase tracking-widest text-[10px] rounded-2xl group">
                                            Login to Proceed <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </SignInButton>
                                </div>
                            ) : (
                                <div className="p-10 bg-white dark:bg-zinc-950 rounded-[3rem] border-4 border-primary/20 shadow-2xl relative overflow-hidden flex flex-col h-fit">
                                    <div className="absolute top-0 right-0 p-8 text-primary/10">
                                        <CalendarCheck size={120} />
                                    </div>

                                    <form id="booking-form" action={handleBooking} className="relative z-10 space-y-8">
                                        <input type="hidden" name="timeSlot" value={selectedSlot} />
                                        <div className="grid sm:grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Officer Name</label>
                                                <input suppressHydrationWarning readOnly defaultValue={user.fullName || ""} name="name" required type="text" className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl h-14 px-6 text-sm font-bold opacity-70" />
                                            </div>
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Engagement Date</label>
                                                    <input
                                                        suppressHydrationWarning
                                                        name="date"
                                                        required
                                                        type="date"
                                                        min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                                                        value={bookingDate}
                                                        onChange={(e) => setBookingDate(e.target.value)}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl h-14 px-6 text-sm font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between ml-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tactical Slots</label>
                                                    <button
                                                        type="button"
                                                        onClick={suggestBestTime}
                                                        className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline"
                                                    >
                                                        <Sparkles size={12} /> Suggest Slot
                                                    </button>
                                                </div>

                                                {loadingSlots ? (
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                                            <div key={i} className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                                                        ))}
                                                    </div>
                                                ) : availableSlots.length > 0 ? (
                                                    <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                        {availableSlots.map(slot => (
                                                            <button
                                                                key={slot}
                                                                type="button"
                                                                onClick={() => setSelectedSlot(slot)}
                                                                className={cn(
                                                                    "h-12 rounded-xl text-[10px] font-bold border transition-all active:scale-95",
                                                                    selectedSlot === slot
                                                                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                                        : "bg-white dark:bg-zinc-900 border-border text-muted-foreground hover:border-primary/50"
                                                                )}
                                                            >
                                                                {slot}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-border">
                                                        <p className="text-[10px] font-bold text-muted-foreground italic">No available windows. Try another date.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mission Email</label>
                                                    <input readOnly defaultValue={user.primaryEmailAddress?.emailAddress || ""} suppressHydrationWarning name="email" required type="email" className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl h-14 px-6 text-sm font-bold opacity-70" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile Link</label>
                                                    <input suppressHydrationWarning name="phone" required type="tel" placeholder="+91 ..." className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl h-14 px-6 text-sm font-bold" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mission Brief (Optional)</label>
                                                <textarea suppressHydrationWarning name="notes" placeholder="Any specific requirements or tactical details..." rows={3} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                            </div>
                                        </div>
                                        <Button disabled={isSubmitting || !selectedSlot} className="w-full h-16 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
                                            {isSubmitting ? "Transmitting..." : "Confirm Deployment"}
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Support Channels */}
            <section className="py-20 px-6 border-t border-border/50">
                <div className="container mx-auto max-w-7xl">
                    <div className="text-center space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-muted-foreground mx-auto">
                            <Globe className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Global Ops</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                            Support <span className="text-primary">Channels</span>
                        </h2>
                        <p className="text-muted-foreground italic font-medium text-sm md:text-base">Connect with our team through your preferred channel.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {settings.whatsappNo && (
                            <div className="p-10 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 border border-border/50 hover:border-green-500/50 transition-all group flex flex-col items-center text-center space-y-6">
                                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform text-3xl">
                                    <FaWhatsapp />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold tracking-tight">WhatsApp Support</h3>
                                    <p className="text-sm text-muted-foreground font-medium italic">Instant messaging for quick tactical updates and technical queries.</p>
                                </div>
                                <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]">
                                    <a href={`https://wa.me/${settings.whatsappNo.replace(/\+/g, "").replace(/ /g, "")}`} target="_blank" rel="noopener noreferrer">
                                        Chat Now <ArrowRight className="ml-2 w-4 h-4" />
                                    </a>
                                </Button>
                            </div>
                        )}
                        {/* Virtual Support Card */}
                        <div className="p-10 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 border border-border/50 hover:border-primary/50 transition-all group flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Globe size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold tracking-tight">Virtual Support</h3>
                                <p className="text-sm text-muted-foreground font-medium italic">Schedule a video call or remote session with our experts.</p>
                            </div>
                            <Button variant="outline" className="w-full rounded-xl h-12 font-bold uppercase tracking-widest text-[10px] border-primary/20 hover:bg-primary/5">
                                <a href="#booking-form" className="inline-flex items-center">
                                    BOOK SESSION <ArrowRight className="ml-2 w-4 h-4" />
                                </a>
                            </Button>
                        </div>

                        {settings.location && settings.location !== "Not Configured" && (
                            <div className="p-10 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 border border-border/50 hover:border-zinc-500/50 transition-all group flex flex-col items-center text-center space-y-6">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-500/10 flex items-center justify-center text-zinc-500 group-hover:scale-110 transition-transform">
                                    <Headphones size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold tracking-tight">Offline Support</h3>
                                    <p className="text-sm text-muted-foreground font-medium italic">Visit our command center for on-site assistance and tactical planning.</p>
                                </div>
                                <div className="text-xs font-bold text-muted-foreground bg-zinc-200 dark:bg-zinc-800 px-4 py-2 rounded-lg">
                                    {settings.location}
                                </div>
                            </div>
                        )}                    </div>
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
