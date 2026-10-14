"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    User,
    Phone,
    Mail,
    Search,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    X,
    MessageSquare,
    Check,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from "@/components/ui/alert-dialog";
import { updateBookingStatus, deleteBooking, markBookingAsRead } from "@/actions/bookings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookingTableProps {
    bookings: any[];
}

const ITEMS_PER_PAGE = 10;

export default function BookingTable({ bookings: initialBookings }: BookingTableProps) {
    const [bookings, setBookings] = useState(initialBookings);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Custom Alert Dialog states
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [cancelTarget, setCancelTarget] = useState<any | null>(null);
    const [completeTarget, setCompleteTarget] = useState<any | null>(null);
    const [isActionPending, setIsActionPending] = useState(false);

    const handleConfirmStatus = async (id: string, newStatus: string) => {
        setIsActionPending(true);
        try {
            const res = await updateBookingStatus(id, newStatus);
            if (res.success) {
                setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
                toast.success(`Booking status marked as ${newStatus.toLowerCase()}`);
                setCancelTarget(null);
                setCompleteTarget(null);
            } else {
                toast.error(res.error || "Failed to update status");
            }
        } catch {
            toast.error("Failed to update status. Please try again.");
        } finally {
            setIsActionPending(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsActionPending(true);
        try {
            const res = await deleteBooking(deleteTarget.id);
            if (res.success) {
                setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
                toast.success("Appointment record deleted successfully");
                setDeleteTarget(null);
            } else {
                toast.error(res.error || "Failed to delete booking");
            }
        } catch {
            toast.error("An error occurred while deleting the appointment.");
        } finally {
            setIsActionPending(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        const res = await markBookingAsRead(id);
        if (res.success) {
            setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, isRead: true } : b)));
            toast.success("Marked as reviewed");
        }
    };

    // Filter by search text and status
    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            const matchesSearch =
                !search.trim() ||
                b.name.toLowerCase().includes(search.toLowerCase()) ||
                b.email.toLowerCase().includes(search.toLowerCase()) ||
                (b.phone && b.phone.toLowerCase().includes(search.toLowerCase())) ||
                (b.notes && b.notes.toLowerCase().includes(search.toLowerCase())) ||
                (b.timeSlot && b.timeSlot.toLowerCase().includes(search.toLowerCase()));

            if (filterStatus === "unread") {
                return matchesSearch && !b.isRead;
            }

            const matchesStatus = filterStatus === "all" || b.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [bookings, search, filterStatus]);

    // Status counts
    const counts = useMemo(() => {
        return {
            all: bookings.length,
            scheduled: bookings.filter((b) => b.status === "SCHEDULED").length,
            completed: bookings.filter((b) => b.status === "COMPLETED").length,
            cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
            unread: bookings.filter((b) => !b.isRead).length,
        };
    }, [bookings]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
    const paginatedBookings = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredBookings, currentPage]);

    return (
        <div className="space-y-3.5">
            {/* Search and Status Filters Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60 shadow-2xs">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by client name, email, phone, or notes..."
                        className="pl-8.5 pr-8 h-8 text-xs rounded-lg bg-background border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setCurrentPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="h-8 bg-muted/60 p-0.5 rounded-lg border border-border/60 flex items-center overflow-x-auto no-scrollbar gap-0.5 max-w-full">
                    {[
                        { id: "all", label: "All", count: counts.all },
                        { id: "SCHEDULED", label: "Scheduled", count: counts.scheduled, dot: "bg-blue-500" },
                        { id: "COMPLETED", label: "Completed", count: counts.completed, dot: "bg-emerald-500" },
                        { id: "CANCELLED", label: "Cancelled", count: counts.cancelled, dot: "bg-rose-500" },
                        ...(counts.unread > 0 ? [{ id: "unread", label: "Unread", count: counts.unread, dot: "bg-amber-500 animate-pulse" }] : [])
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setFilterStatus(tab.id);
                                setCurrentPage(1);
                            }}
                            className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap select-none",
                                filterStatus === tab.id
                                    ? "bg-card text-foreground shadow-2xs font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab.dot && <span className={cn("size-1.5 rounded-full", tab.dot)} />}
                            <span>{tab.label}</span>
                            <span className="font-mono text-[10px] opacity-70 tabular-nums">({tab.count})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bookings List */}
            {paginatedBookings.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-border/60 p-6 shadow-2xs">
                    <div className="size-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-2.5">
                        <Calendar className="size-5" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">No Consultations Found</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                        {search || filterStatus !== "all"
                            ? "No appointment bookings match your active search terms or status filter."
                            : "No consultation sessions are currently scheduled on the calendar."}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {paginatedBookings.map((booking) => {
                        const isScheduled = booking.status === "SCHEDULED";
                        const isCompleted = booking.status === "COMPLETED";
                        const isCancelled = booking.status === "CANCELLED";

                        return (
                            <div
                                key={booking.id}
                                className={cn(
                                    "group relative overflow-hidden border border-border/60 bg-card rounded-xl shadow-2xs hover:border-primary/40 transition-all duration-150",
                                    !booking.isRead && "ring-1 ring-amber-500/30 border-amber-500/40"
                                )}
                            >
                                {/* Left Status Accent Bar */}
                                <div
                                    className={cn(
                                        "absolute left-0 top-0 bottom-0 w-1",
                                        isScheduled ? "bg-blue-500" : isCompleted ? "bg-emerald-500" : "bg-rose-500"
                                    )}
                                />

                                {/* DESKTOP LAYOUT (md:flex) - Balanced 3 Sections Across Full Row */}
                                <div className="hidden md:flex items-center justify-between py-3 px-4 pl-4.5 gap-4">
                                    {/* Left Section: Date & Time Schedule */}
                                    <div className="flex items-center gap-3.5 min-w-[210px] shrink-0">
                                        <div className="relative shrink-0">
                                            <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-primary shadow-2xs">
                                                <span className="text-[9px] font-black uppercase tracking-wider leading-none">
                                                    {format(new Date(booking.date), 'MMM')}
                                                </span>
                                                <span className="text-base font-black leading-tight tabular-nums">
                                                    {format(new Date(booking.date), 'dd')}
                                                </span>
                                            </div>
                                            {!booking.isRead && (
                                                <span
                                                    className="absolute -top-1 -right-1 size-2.5 bg-amber-500 rounded-full ring-2 ring-card animate-pulse"
                                                    title="Unread appointment"
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                                <Clock className="size-3.5 text-primary" />
                                                <span>{booking.timeSlot}</span>
                                            </div>
                                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                {format(new Date(booking.date), 'EEEE, yyyy')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center Section: Client Info & Notes (Center-Centered, Spanning Middle Space) */}
                                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-4 px-4 border-x border-border/40">
                                        {/* Client Identity & Email */}
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                                    <User className="size-3.5" />
                                                </div>
                                                <span
                                                    className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[130px] lg:max-w-[170px] xl:max-w-[220px] block"
                                                    title={booking.name}
                                                >
                                                    {booking.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 pl-0.5 text-[11px] text-muted-foreground">
                                                <Mail className="size-3 text-muted-foreground/70 shrink-0" />
                                                <a
                                                    href={`mailto:${booking.email}`}
                                                    className="hover:text-primary transition-colors truncate max-w-[130px] lg:max-w-[170px] xl:max-w-[200px] block"
                                                    title={booking.email}
                                                >
                                                    {booking.email}
                                                </a>
                                            </div>
                                        </div>

                                        {/* Phone & Consultation Notes */}
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex items-center gap-2 text-[11px]">
                                                <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                                    <Phone className="size-3.5" />
                                                </div>
                                                {booking.phone ? (
                                                    <a
                                                        href={`tel:${booking.phone}`}
                                                        className="font-mono text-foreground font-semibold hover:text-primary transition-colors truncate max-w-[120px] lg:max-w-[150px] block"
                                                        title={booking.phone}
                                                    >
                                                        {booking.phone}
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground/60 italic text-[10px]">No phone provided</span>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex items-center gap-1.5 pl-0.5 text-[11px] text-muted-foreground">
                                                <MessageSquare className="size-3 text-primary/70 shrink-0" />
                                                {booking.notes ? (
                                                    <span
                                                        className="italic truncate max-w-[130px] lg:max-w-[180px] xl:max-w-[220px] block text-foreground/80"
                                                        title={booking.notes}
                                                    >
                                                        &ldquo;{booking.notes}&rdquo;
                                                    </span>
                                                ) : (
                                                    <span className="italic text-muted-foreground/60 text-[10px]">General consultation</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Section: Status Badge & Actions */}
                                    <div className="flex items-center justify-end gap-3 min-w-[200px] shrink-0">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0",
                                                isScheduled && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
                                                isCompleted && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
                                                isCancelled && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                                            )}
                                        >
                                            {booking.status}
                                        </Badge>

                                        <div className="flex items-center gap-1">
                                            {!booking.isRead && (
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => handleMarkAsRead(booking.id)}
                                                    className="size-8 rounded-lg text-primary hover:bg-primary/10 border-border/60 cursor-pointer"
                                                    title="Mark as Seen"
                                                >
                                                    <Eye className="size-3.5" />
                                                </Button>
                                            )}

                                            {isScheduled && (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={() => setCompleteTarget(booking)}
                                                        className="size-8 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-border/60 cursor-pointer"
                                                        title="Mark Consultation Completed"
                                                    >
                                                        <CheckCircle className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={() => setCancelTarget(booking)}
                                                        className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10 border-border/60 cursor-pointer"
                                                        title="Cancel Appointment"
                                                    >
                                                        <XCircle className="size-3.5" />
                                                    </Button>
                                                </>
                                            )}

                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => setDeleteTarget(booking)}
                                                className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border-border/60 cursor-pointer"
                                                title="Delete Booking Record"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* MOBILE LAYOUT (md:hidden) - Clean, Dedicated Mobile Card */}
                                <div className="md:hidden p-3.5 space-y-3 pl-4">
                                    {/* Mobile Header: Date + Name + Status */}
                                    <div className="flex items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-primary shadow-2xs">
                                                    <span className="text-[8px] font-black uppercase tracking-wider leading-none">
                                                        {format(new Date(booking.date), 'MMM')}
                                                    </span>
                                                    <span className="text-xs font-black leading-tight tabular-nums">
                                                        {format(new Date(booking.date), 'dd')}
                                                    </span>
                                                </div>
                                                {!booking.isRead && (
                                                    <span className="absolute -top-1 -right-1 size-2 bg-amber-500 rounded-full ring-2 ring-card animate-pulse" />
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <h4
                                                    className="text-xs font-bold text-foreground truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[220px]"
                                                    title={booking.name}
                                                >
                                                    {booking.name}
                                                </h4>
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                                                    <Clock className="size-3 text-primary" />
                                                    <span>{booking.timeSlot}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                                                isScheduled && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
                                                isCompleted && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
                                                isCancelled && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                                            )}
                                        >
                                            {booking.status}
                                        </Badge>
                                    </div>

                                    {/* Mobile Contact & Notes */}
                                    <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40 space-y-1.5 text-[11px]">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="size-3 text-muted-foreground/70 shrink-0" />
                                            <a href={`mailto:${booking.email}`} className="truncate hover:text-primary max-w-[200px]" title={booking.email}>
                                                {booking.email}
                                            </a>
                                        </div>
                                        {booking.phone && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="size-3 text-emerald-500 shrink-0" />
                                                <a href={`tel:${booking.phone}`} className="font-mono font-medium hover:text-primary">
                                                    {booking.phone}
                                                </a>
                                            </div>
                                        )}
                                        {booking.notes && (
                                            <div className="pt-1 border-t border-border/40 flex items-start gap-1.5 text-foreground/80 italic text-[10.5px]">
                                                <MessageSquare className="size-3 text-primary shrink-0 mt-0.5" />
                                                <span className="line-clamp-2" title={booking.notes}>&ldquo;{booking.notes}&rdquo;</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile Actions Toolbar */}
                                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            {format(new Date(booking.date), 'EEEE, dd MMM yyyy')}
                                        </span>

                                        <div className="flex items-center gap-1.5">
                                            {!booking.isRead && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleMarkAsRead(booking.id)}
                                                    className="h-7 px-2 text-[10px] rounded-lg text-primary gap-1"
                                                >
                                                    <Eye className="size-3" />
                                                    <span>Seen</span>
                                                </Button>
                                            )}

                                            {isScheduled && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setCompleteTarget(booking)}
                                                        className="h-7 px-2 text-[10px] rounded-lg text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 cursor-pointer"
                                                    >
                                                        <CheckCircle className="size-3" />
                                                        <span>Complete</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setCancelTarget(booking)}
                                                        className="h-7 px-2 text-[10px] rounded-lg text-rose-500 border-rose-500/30 hover:bg-rose-500/10 gap-1 cursor-pointer"
                                                    >
                                                        <XCircle className="size-3" />
                                                        <span>Cancel</span>
                                                    </Button>
                                                </>
                                            )}

                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => setDeleteTarget(booking)}
                                                className="size-7 rounded-lg text-rose-500 hover:bg-rose-500/10 border-border/60 cursor-pointer"
                                                title="Delete record"
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls for Many Bookings */}
            {filteredBookings.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 px-1 text-xs text-muted-foreground border-t border-border/40">
                    <div>
                        Showing <span className="font-semibold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-semibold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)}</span> of <span className="font-semibold text-foreground">{filteredBookings.length}</span> consultation appointments
                    </div>

                    <div className="flex items-center gap-1 self-center sm:self-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            aria-label="Previous Page"
                        >
                            <ChevronLeft className="size-3.5" />
                        </Button>

                        {/* Page Numbers with Elision */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => {
                                const page = i + 1;
                                if (totalPages > 7) {
                                    if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                                        if (page === 2 || page === totalPages - 1) {
                                            return <span key={page} className="px-1 text-xs text-muted-foreground">...</span>;
                                        }
                                        return null;
                                    }
                                }

                                const isSelected = currentPage === page;
                                return (
                                    <Button
                                        key={page}
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        disabled={isSelected}
                                        className={cn(
                                            "size-8 p-0 rounded-lg text-xs cursor-pointer transition-all",
                                            isSelected ? "font-bold shadow-2xs opacity-100" : "hover:bg-muted/50"
                                        )}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            aria-label="Next Page"
                        >
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Custom Alert Dialog for Deletion */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="rounded-2xl border-border/60 bg-card p-5 sm:p-6 shadow-2xl max-w-[420px]">
                    <AlertDialogHeader className="space-y-2 text-left">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-base font-bold text-foreground">
                                    Delete Consultation Record
                                </AlertDialogTitle>
                                <span className="text-[11px] text-muted-foreground font-medium">Permanent Action</span>
                            </div>
                        </div>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                            Are you sure you want to permanently delete the consultation booking for{" "}
                            <strong className="text-foreground">{deleteTarget?.name}</strong> on{" "}
                            <strong className="text-foreground">
                                {deleteTarget?.date ? format(new Date(deleteTarget.date), "dd MMM yyyy") : ""}
                            </strong>{" "}
                            at <span className="text-foreground font-semibold">{deleteTarget?.timeSlot}</span>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex sm:flex-row items-center gap-2 pt-3">
                        <AlertDialogCancel
                            disabled={isActionPending}
                            className="h-9 px-4 rounded-xl text-xs font-semibold flex-1 border-border/60 cursor-pointer"
                        >
                            Keep Record
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirmDelete();
                            }}
                            disabled={isActionPending}
                            className="h-9 px-4 rounded-xl text-xs font-bold flex-1 bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs cursor-pointer"
                        >
                            {isActionPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            <span>Delete Permanently</span>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Custom Alert Dialog for Appointment Cancellation */}
            <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
                <AlertDialogContent className="rounded-2xl border-border/60 bg-card p-5 sm:p-6 shadow-2xl max-w-[420px]">
                    <AlertDialogHeader className="space-y-2 text-left">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <XCircle className="size-5" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-base font-bold text-foreground">
                                    Cancel Consultation Appointment
                                </AlertDialogTitle>
                                <span className="text-[11px] text-muted-foreground font-medium">Status Modification</span>
                            </div>
                        </div>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                            Are you sure you want to cancel the scheduled session for{" "}
                            <strong className="text-foreground">{cancelTarget?.name}</strong> at{" "}
                            <span className="text-foreground font-semibold">{cancelTarget?.timeSlot}</span>? The slot will be marked as Cancelled.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex sm:flex-row items-center gap-2 pt-3">
                        <AlertDialogCancel
                            disabled={isActionPending}
                            className="h-9 px-4 rounded-xl text-xs font-semibold flex-1 border-border/60 cursor-pointer"
                        >
                            Keep Scheduled
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                if (cancelTarget) handleConfirmStatus(cancelTarget.id, "CANCELLED");
                            }}
                            disabled={isActionPending}
                            className="h-9 px-4 rounded-xl text-xs font-bold flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-xs cursor-pointer"
                        >
                            {isActionPending ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                            <span>Confirm Cancellation</span>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Custom Alert Dialog for Completion */}
            <AlertDialog open={!!completeTarget} onOpenChange={(open) => !open && setCompleteTarget(null)}>
                <AlertDialogContent className="rounded-2xl border-border/60 bg-card p-5 sm:p-6 shadow-2xl max-w-[420px]">
                    <AlertDialogHeader className="space-y-2 text-left">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <CheckCircle className="size-5" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-base font-bold text-foreground">
                                    Mark Consultation Completed
                                </AlertDialogTitle>
                                <span className="text-[11px] text-muted-foreground font-medium">Session Conclusion</span>
                            </div>
                        </div>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                            Confirm that the consultation with <strong className="text-foreground">{completeTarget?.name}</strong> for slot{" "}
                            <span className="text-foreground font-semibold">{completeTarget?.timeSlot}</span> has concluded successfully.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex sm:flex-row items-center gap-2 pt-3">
                        <AlertDialogCancel
                            disabled={isActionPending}
                            className="h-9 px-4 rounded-xl text-xs font-semibold flex-1 border-border/60 cursor-pointer"
                        >
                            Dismiss
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                if (completeTarget) handleConfirmStatus(completeTarget.id, "COMPLETED");
                            }}
                            disabled={isActionPending}
                            className="h-9 px-4 rounded-xl text-xs font-bold flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs cursor-pointer"
                        >
                            {isActionPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                            <span>Mark Completed</span>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
