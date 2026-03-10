"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    User,
    Phone,
    Mail,
    ChevronRight,
    Search,
    Filter,
    Trash2,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateBookingStatus, deleteBooking, markBookingAsRead } from "@/actions/bookings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookingTableProps {
    bookings: any[];
}

export default function BookingTable({ bookings: initialBookings }: BookingTableProps) {
    const [bookings, setBookings] = useState(initialBookings);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const res = await updateBookingStatus(id, newStatus);
        if (res.success) {
            setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
            toast.success(`Booking status updated to ${newStatus}`);
        } else {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this booking?")) return;
        const res = await deleteBooking(id);
        if (res.success) {
            setBookings(bookings.filter(b => b.id !== id));
            toast.success("Booking deleted successfully");
        } else {
            toast.error("Failed to delete booking");
        }
    };

    const handleMarkAsRead = async (id: string) => {
        const res = await markBookingAsRead(id);
        if (res.success) {
            setBookings(bookings.map(b => b.id === id ? { ...b, isRead: true } : b));
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.email.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = filterStatus === "all" || b.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-border sm:px-10">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-12 pr-4 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {["all", "SCHEDULED", "COMPLETED", "CANCELLED"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                filterStatus === status
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            )}
                        >
                            {status === "all" ? "All Bookings" : status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {filteredBookings.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border border-dashed border-border">
                        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground font-medium italic">No appointments found matching your criteria.</p>
                    </div>
                ) : (
                    filteredBookings.map((booking) => (
                        <div key={booking.id} className="group bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5">
                            <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center">
                                {/* Date and Time */}
                                <div className="flex items-center gap-6 min-w-[200px]">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                                            <span className="text-[10px] font-black leading-none uppercase">{format(new Date(booking.date), 'MMM')}</span>
                                            <span className="text-xl font-black leading-none">{format(new Date(booking.date), 'dd')}</span>
                                        </div>
                                        {!booking.isRead && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
                                            <Clock className="w-4 h-4 text-primary" />
                                            {booking.timeSlot}
                                        </div>
                                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                                            {format(new Date(booking.date), 'EEEE, yyyy')}
                                        </div>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="flex-1 grid md:grid-cols-2 gap-6 w-full">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground">
                                                <User size={14} />
                                            </div>
                                            <span className="text-sm font-bold tracking-tight">{booking.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground">
                                                <Mail size={14} />
                                            </div>
                                            <span className="text-xs text-muted-foreground font-medium">{booking.email}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground">
                                                <Phone size={14} />
                                            </div>
                                            <span className="text-xs text-muted-foreground font-medium">{booking.phone}</span>
                                        </div>
                                        {booking.notes && (
                                            <div className="text-xs bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl italic text-muted-foreground border border-border/50">
                                                "{booking.notes}"
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status and Actions */}
                                <div className="flex flex-row xl:flex-col gap-3 w-full xl:w-48">
                                    <div className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex-1 transition-all",
                                        booking.status === "SCHEDULED" && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
                                        booking.status === "COMPLETED" && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                                        booking.status === "CANCELLED" && "bg-red-500/10 text-red-500 border border-red-500/20",
                                    )}>
                                        {booking.status}
                                    </div>
                                    <div className="flex gap-2">
                                        {!booking.isRead && (
                                            <Button
                                                onClick={() => handleMarkAsRead(booking.id)}
                                                variant="ghost"
                                                className="h-10 w-10 p-0 rounded-xl text-primary hover:bg-primary/10"
                                                title="Mark as Seen"
                                            >
                                                <Eye size={18} />
                                            </Button>
                                        )}
                                        {booking.status === "SCHEDULED" && (
                                            <>
                                                <Button
                                                    onClick={() => handleStatusUpdate(booking.id, "COMPLETED")}
                                                    className="h-10 w-10 p-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                                                    title="Mark Completed"
                                                >
                                                    <CheckCircle size={18} />
                                                </Button>
                                                <Button
                                                    onClick={() => handleStatusUpdate(booking.id, "CANCELLED")}
                                                    variant="destructive"
                                                    className="h-10 w-10 p-0 rounded-xl"
                                                    title="Cancel Mission"
                                                >
                                                    <XCircle size={18} />
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            onClick={() => handleDelete(booking.id)}
                                            variant="ghost"
                                            className="h-10 w-10 p-0 rounded-xl text-rose-500 hover:bg-rose-500/10"
                                            title="Delete Entry"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
