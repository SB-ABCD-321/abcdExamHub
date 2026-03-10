import { getBookingSettings } from "@/actions/bookings";
import BookingSettingsForm from "@/components/super-admin/BookingSettingsForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield } from "lucide-react";
import Link from "next/link";

export default async function BookingSettingsPage() {
    const settings = await getBookingSettings();

    return (
        <div className="p-8 md:p-12 space-y-12 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                        <Shield className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Global Configuration</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Operation Window</h1>
                    <p className="text-muted-foreground italic font-medium">Configure active mission days and tactical operational hours.</p>
                </div>
                <div className="flex gap-4">
                    <Button asChild variant="ghost" className="h-14 px-6 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold uppercase tracking-widest text-[10px]">
                        <Link href="/super-admin/bookings">
                            <ChevronLeft className="mr-2 w-4 h-4" /> Back to Registry
                        </Link>
                    </Button>
                </div>
            </div>

            <BookingSettingsForm initialSettings={settings} />
        </div>
    );
}
