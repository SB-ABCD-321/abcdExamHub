"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, Settings, ClipboardList, GraduationCap, Building2, Bell, QrCode, MessageSquare, CalendarCheck, Terminal, BookMarked, ClipboardCheck, CircleDollarSign, Wallet, IndianRupee } from "lucide-react";

import { cn } from "@/lib/utils";

const superAdminRoutes = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/super-admin" },
    { label: "Requests", icon: ClipboardCheck, href: "/super-admin/requests" },
    { label: "Users", icon: Users, href: "/super-admin/users" },
    { label: "Payments", icon: IndianRupee, href: "/super-admin/payments" },
    { label: "Bookings", icon: CalendarCheck, href: "/super-admin/bookings", isBooking: true },
    { label: "Global Exams", icon: ClipboardList, href: "/super-admin/exams" },
    { label: "Question Bank", icon: BookOpen, href: "/super-admin/questions" },
    { label: "Workspaces", icon: Building2, href: "/super-admin/workspaces" },
    { label: "Site Settings", icon: Settings, href: "/super-admin/settings" },
    { label: "Notices", icon: Bell, href: "/super-admin/notices", isNotice: true },
    { label: "Inquiries", icon: MessageSquare, href: "/super-admin/inquiries", isInquiry: true },
    { label: "User Guide", icon: BookMarked, href: "/super-admin/guide" },
];


const adminRoutes = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { label: "Billing & Renew", icon: Wallet, href: "/admin/billing" },
    { label: "Teachers", icon: Users, href: "/admin/teachers" },
    { label: "Students", icon: GraduationCap, href: "/admin/students" },
    { label: "Invitations", icon: QrCode, href: "/admin/invitations" },
    { label: "Notices", icon: Bell, href: "/admin/notices", isNotice: true },
    { label: "User Guide", icon: BookMarked, href: "/admin/guide" },
];


const teacherRoutes = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/teacher" },
    { label: "Question Bank", icon: BookOpen, href: "/teacher/questions" },
    { label: "Exams", icon: ClipboardList, href: "/teacher/exams" },
    { label: "Notices", icon: Bell, href: "/teacher/notices", isNotice: true },
    { label: "User Guide", icon: BookMarked, href: "/teacher/guide" },
];

const studentRoutes = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/student" },
    { label: "Take Exam", icon: ClipboardList, href: "/student/exams" },
    { label: "Results", icon: BookOpen, href: "/student/results" },
    { label: "Notices", icon: Bell, href: "/student/notices", isNotice: true },
    { label: "User Guide", icon: BookMarked, href: "/student/guide" },
];

export function Sidebar({
    role,
    email,
    developerEmail,
    unreadNoticeCount = 0,
    unreadInquiryCount = 0,
    unreadBookingCount = 0
}: {
    role?: string;
    email?: string;
    developerEmail?: string;
    unreadNoticeCount?: number;
    unreadInquiryCount?: number;
    unreadBookingCount?: number
}) {
    const pathname = usePathname();

    let routes: { label: string; icon: any; href: string; isNotice?: boolean; isInquiry?: boolean; isBooking?: boolean }[] = studentRoutes;
    if (role === "SUPER_ADMIN") {
        routes = [...superAdminRoutes];
        if (email && developerEmail && email.toLowerCase() === developerEmail.toLowerCase()) {
            routes.push({ label: "Developer", icon: Terminal, href: "/super-admin/developer" });
        }
    }
    else if (role === "ADMIN") routes = [
        ...adminRoutes,
        ...teacherRoutes.filter(r => r.label !== "Dashboard" && r.label !== "Notices" && r.label !== "User Guide")
    ];
    else if (role === "TEACHER") routes = teacherRoutes;

    return (
        <aside className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-colors">
            <div className="px-3 py-3 border-b border-sidebar-border/60">
                <Link href="/" className="flex items-center px-2 py-1.5 group gap-2.5">
                    <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        A
                    </div>
                    <span className="text-base font-bold tracking-tight text-sidebar-foreground transition-colors group-hover:text-primary">
                        ABCD Exam Hub
                    </span>
                </Link>
            </div>

            <div className="px-2.5 py-3 flex-1 overflow-y-auto space-y-1">
                {routes.map((route) => {
                    const isActive = pathname === route.href;
                    const showBadge = (route.isNotice && unreadNoticeCount > 0) ||
                        (route.isInquiry && unreadInquiryCount > 0) ||
                        (route.isBooking && unreadBookingCount > 0);

                    const displayCount = route.isNotice ? unreadNoticeCount :
                        route.isInquiry ? unreadInquiryCount :
                            unreadBookingCount;

                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-xs sm:text-sm group flex py-2 px-3 w-full justify-start font-medium cursor-pointer rounded-lg transition-all items-center gap-3",
                                isActive
                                    ? "bg-primary/10 text-primary font-semibold shadow-xs"
                                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                        >
                            <route.icon className={cn("size-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                            <span className="truncate">{route.label}</span>
                            {showBadge && (
                                <span className="ml-auto flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                                    {displayCount > 99 ? "99+" : displayCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </aside>
    );
}
