"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateBookingSettings } from "@/actions/bookings";
import { toast } from "sonner";
import {
    Clock,
    Calendar,
    Zap,
    ArrowRight,
    Save,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = [
    { label: "Mon", value: "MONDAY" },
    { label: "Tue", value: "TUESDAY" },
    { label: "Wed", value: "WEDNESDAY" },
    { label: "Thu", value: "THURSDAY" },
    { label: "Fri", value: "FRIDAY" },
    { label: "Sat", value: "SATURDAY" },
    { label: "Sun", value: "SUNDAY" },
];

export default function BookingSettingsForm({ initialSettings }: { initialSettings: any }) {
    const [loading, setLoading] = useState(false);
    const [workingDays, setWorkingDays] = useState<string[]>(initialSettings?.workingDays || []);
    const [startTime, setStartTime] = useState(initialSettings?.startTime || "09:00");
    const [endTime, setEndTime] = useState(initialSettings?.endTime || "17:00");
    const [slotDuration, setSlotDuration] = useState(initialSettings?.slotDuration || 30);
    const [autoApprove, setAutoApprove] = useState(initialSettings?.autoApprove ?? true);

    const toggleDay = (day: string) => {
        setWorkingDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        const res = await updateBookingSettings({
            workingDays,
            startTime,
            endTime,
            slotDuration,
            autoApprove
        });
        if (res.success) {
            toast.success("Booking settings updated successfully");
        } else {
            toast.error("Failed to update settings");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 md:p-16 border border-border shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 text-primary/5 -rotate-12 pointer-events-none">
                    <ShieldCheck size={200} />
                </div>

                <div className="relative z-10 space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
                            <Zap className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deployment Configuration</span>
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight">Availability Controls</h2>
                        <p className="text-muted-foreground italic font-medium">Define your strategic operational windows and mission durations.</p>
                    </div>

                    <div className="grid gap-12">
                        {/* Working Days */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                                <Calendar size={14} className="text-primary" /> Active Operation Days
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {DAYS.map(day => (
                                    <button
                                        key={day.value}
                                        onClick={() => toggleDay(day.value)}
                                        className={cn(
                                            "w-16 h-16 rounded-2xl flex flex-col items-center justify-center border transition-all active:scale-95",
                                            workingDays.includes(day.value)
                                                ? "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105"
                                                : "bg-zinc-50 dark:bg-zinc-800 border-border text-muted-foreground hover:border-primary/50"
                                        )}
                                    >
                                        <span className="text-xs font-black">{day.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Timing Grid */}
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                                    <Clock size={14} className="text-primary" /> Mission Hours
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Commence</label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl h-14 px-6 text-sm font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Conclude</label>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl h-14 px-6 text-sm font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                                    <AlertCircle size={14} className="text-primary" /> Strategy Parameters
                                </h3>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Slot Duration (Minutes)</label>
                                    <select
                                        value={slotDuration}
                                        onChange={(e) => setSlotDuration(parseInt(e.target.value))}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl h-14 px-6 text-sm font-bold"
                                    >
                                        {[15, 20, 30, 45, 60, 90, 120].map(v => (
                                            <option key={v} value={v}>{v} Minutes Mission</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button
                        disabled={loading}
                        onClick={handleSave}
                        className="w-full h-16 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] group"
                    >
                        {loading ? "Sycing Data..." : "Apply Strategic Settings"} <Save className="ml-2 w-4 h-4 group-hover:rotate-12 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
