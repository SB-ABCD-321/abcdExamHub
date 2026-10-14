"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
    Settings, 
    Clock, 
    Calendar, 
    Zap, 
    Check, 
    Loader2, 
    ShieldCheck,
    Sliders,
    Sparkles
} from "lucide-react";
import { updateBookingSettings } from "@/actions/bookings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OperationSettingsSheetProps {
    initialSettings: any;
}

const DAYS = [
    { label: "Mon", value: "MONDAY", full: "Monday" },
    { label: "Tue", value: "TUESDAY", full: "Tuesday" },
    { label: "Wed", value: "WEDNESDAY", full: "Wednesday" },
    { label: "Thu", value: "THURSDAY", full: "Thursday" },
    { label: "Fri", value: "FRIDAY", full: "Friday" },
    { label: "Sat", value: "SATURDAY", full: "Saturday" },
    { label: "Sun", value: "SUNDAY", full: "Sunday" },
];

const SLOT_DURATIONS = [
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "45 min", value: 45 },
    { label: "60 min", value: 60 },
];

export function OperationSettingsSheet({ initialSettings }: OperationSettingsSheetProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [workingDays, setWorkingDays] = useState<string[]>(initialSettings?.workingDays || [
        "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"
    ]);
    const [startTime, setStartTime] = useState(initialSettings?.startTime || "09:00");
    const [endTime, setEndTime] = useState(initialSettings?.endTime || "17:00");
    const [slotDuration, setSlotDuration] = useState<number>(initialSettings?.slotDuration || 30);
    const [autoApprove, setAutoApprove] = useState<boolean>(initialSettings?.autoApprove ?? true);

    const toggleDay = (day: string) => {
        setWorkingDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const handlePreset = (type: "weekdays" | "all" | "weekend") => {
        if (type === "weekdays") {
            setWorkingDays(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
        } else if (type === "all") {
            setWorkingDays(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);
        } else if (type === "weekend") {
            setWorkingDays(["SATURDAY", "SUNDAY"]);
        }
    };

    const handleSave = async () => {
        if (workingDays.length === 0) {
            toast.error("Please select at least one active working day.");
            return;
        }

        setLoading(true);
        try {
            const res = await updateBookingSettings({
                workingDays,
                startTime,
                endTime,
                slotDuration,
                autoApprove
            });

            if (res.success) {
                toast.success("Operation Window & Booking Settings saved successfully!");
                setOpen(false);
            } else {
                toast.error(res.error || "Failed to save settings");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8.5 px-3 rounded-xl border-border/60 hover:bg-muted font-semibold text-xs gap-1.5 shadow-2xs cursor-pointer select-none"
                >
                    <Settings className="size-3.5 text-primary" />
                    <span>Operation Settings</span>
                </Button>
            </SheetTrigger>

            <SheetContent 
                side="right" 
                className="w-full sm:max-w-md p-0 flex flex-col justify-between border-l border-border/60 bg-card text-card-foreground shadow-2xl"
            >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-border/50 space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Sliders className="size-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-sm sm:text-base font-bold text-foreground">
                                Operation Window Settings
                            </SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground">
                                Configure active consultation days, hours, and booking rules.
                            </SheetDescription>
                        </div>
                    </div>
                </div>

                {/* Form Fields (Scrollable) */}
                <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 no-scrollbar">
                    {/* Working Days */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-primary" />
                                <span>Active Operation Days</span>
                            </Label>
                            <div className="flex items-center gap-1 text-[10px]">
                                <button
                                    type="button"
                                    onClick={() => handlePreset("weekdays")}
                                    className="text-primary hover:underline font-semibold"
                                >
                                    Weekdays
                                </button>
                                <span>•</span>
                                <button
                                    type="button"
                                    onClick={() => handlePreset("all")}
                                    className="text-primary hover:underline font-semibold"
                                >
                                    All 7
                                </button>
                            </div>
                        </div>

                        {/* 7-Day Pills */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {DAYS.map((day) => {
                                const isSelected = workingDays.includes(day.value);
                                return (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={cn(
                                            "h-12 rounded-xl flex flex-col items-center justify-center border text-xs font-bold transition-all cursor-pointer select-none",
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary shadow-xs scale-[1.02]"
                                                : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted/80"
                                        )}
                                        title={day.full}
                                    >
                                        <span className="text-[10px] leading-none uppercase">{day.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            {workingDays.length} days active per week for scheduling appointments.
                        </p>
                    </div>

                    {/* Operational Hours Window */}
                    <div className="space-y-3 pt-1 border-t border-border/40">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="size-3.5 text-primary" />
                            <span>Daily Operational Hours</span>
                        </Label>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground font-semibold">Start Time</span>
                                <div className="relative">
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="h-9 rounded-xl text-xs bg-background border-border/60 font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground font-semibold">End Time</span>
                                <div className="relative">
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="h-9 rounded-xl text-xs bg-background border-border/60 font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Slot Duration Selection */}
                    <div className="space-y-3 pt-1 border-t border-border/40">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="size-3.5 text-primary" />
                            <span>Session Slot Duration</span>
                        </Label>

                        <div className="grid grid-cols-4 gap-2">
                            {SLOT_DURATIONS.map((slot) => {
                                const isSelected = slotDuration === slot.value;
                                return (
                                    <button
                                        key={slot.value}
                                        type="button"
                                        onClick={() => setSlotDuration(slot.value)}
                                        className={cn(
                                            "h-9 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer select-none",
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                                                : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted/80"
                                        )}
                                    >
                                        {slot.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Auto-Approve Protocol Switch */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <span className="text-xs font-bold text-foreground block">Auto-Approve Bookings</span>
                                <p className="text-[10px] text-muted-foreground">
                                    Automatically mark incoming consultation slots as Scheduled.
                                </p>
                            </div>
                            <Switch
                                checked={autoApprove}
                                onCheckedChange={setAutoApprove}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Save Actions */}
                <div className="p-4 sm:p-5 border-t border-border/50 bg-card flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpen(false)}
                        className="h-9 flex-1 text-xs rounded-xl"
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        disabled={loading}
                        onClick={handleSave}
                        className="h-9 flex-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
                    >
                        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        <span>Save Window</span>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
