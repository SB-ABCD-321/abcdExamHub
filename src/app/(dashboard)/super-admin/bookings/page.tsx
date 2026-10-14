import { getAllBookings, getBookingSettings } from "@/actions/bookings";
import BookingTable from "@/components/super-admin/BookingTable";
import { OperationSettingsSheet } from "@/components/super-admin/OperationSettingsSheet";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, XCircle, Users, ShieldCheck } from "lucide-react";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { cn } from "@/lib/utils";

export default async function SuperAdminBookingsPage() {
    const [bookings, bookingSettings] = await Promise.all([
        getAllBookings(),
        getBookingSettings()
    ]);

    // Metric aggregations
    const totalBookings = bookings.length;
    const scheduledCount = bookings.filter((b: any) => b.status === "SCHEDULED").length;
    const completedCount = bookings.filter((b: any) => b.status === "COMPLETED").length;
    const cancelledCount = bookings.filter((b: any) => b.status === "CANCELLED").length;
    const unreadCount = bookings.filter((b: any) => !b.isRead).length;

    const fulfillmentRate = totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 100;

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Consultation & <span className="text-primary font-black">Booking Hub</span></>}
                subtitle="Centralized institutional appointments, stakeholder consultations, and calendar slot oversight."
                actions={<OperationSettingsSheet initialSettings={bookingSettings} />}
            />

            {/* HIGH-DENSITY ANALYTICAL KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Upcoming Sessions"
                    value={scheduledCount}
                    subtitle={scheduledCount > 0 ? "Awaiting consultation time" : "No pending calendar slots"}
                    icon={<Clock className={cn("size-4", scheduledCount > 0 ? "text-blue-500" : "text-muted-foreground")} />}
                    badge={
                        scheduledCount > 0 ? (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {scheduledCount} Active
                            </span>
                        ) : (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                Clear
                            </span>
                        )
                    }
                />

                <DashboardMetricCard
                    title="Completed Sessions"
                    value={completedCount}
                    subtitle={`${fulfillmentRate}% resolution rate`}
                    icon={<CheckCircle2 className="size-4 text-emerald-500" />}
                    progress={fulfillmentRate}
                />

                <DashboardMetricCard
                    title="Cancelled Sessions"
                    value={cancelledCount}
                    subtitle="Archived non-attended slots"
                    icon={<XCircle className="size-4 text-rose-500" />}
                />

                <DashboardMetricCard
                    title="Engagement Pool"
                    value={totalBookings}
                    subtitle={unreadCount > 0 ? `${unreadCount} unreviewed inquiries` : "All consultations logged"}
                    icon={<Users className="size-4 text-indigo-500" />}
                    badge={
                        unreadCount > 0 ? (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                                {unreadCount} Unread
                            </span>
                        ) : undefined
                    }
                />
            </div>

            {/* UPGRADED BOOKING TABLE (SEARCH + STATUS TABS + PAGINATION) */}
            <BookingTable bookings={bookings} />

            {/* INTEGRITY & CALENDAR AUDIT PROTOCOL FOOTER */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-5" />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">Consultation Security & Slot Integrity</h4>
                        <p className="text-[11px] text-muted-foreground">
                            Session intervals and institutional calendar availability adhere to Super Admin operation window rules.
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold shrink-0">
                    Slot Synchronized
                </Badge>
            </div>
        </DashboardPage>
    );
}
