import { getAllBookings } from "@/actions/bookings";
import BookingTable from "@/components/super-admin/BookingTable";
import { Button } from "@/components/ui/button";
import { Calendar, Settings, CalendarCheck } from "lucide-react";
import Link from "next/link";

export default async function SuperAdminBookingsPage() {
    const bookings = await getAllBookings();

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                        Mission <span className="text-primary">Schedule</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl italic">
                        Manage tactical consultations and strategic appointments with unified oversight.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button asChild variant="outline" className="h-12 px-6 rounded-xl border-primary/20 hover:bg-primary/5 font-bold uppercase tracking-widest text-[10px] shadow-sm">
                        <Link href="/super-admin/bookings/settings">
                            <Settings className="mr-2 w-4 h-4" /> Operation Settings
                        </Link>
                    </Button>
                </div>
            </div>

            <BookingTable bookings={bookings} />
        </div>
    );
}
