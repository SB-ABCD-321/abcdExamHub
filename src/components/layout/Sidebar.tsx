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
    { label: "Global Question Bank", icon: BookOpen, href: "/super-admin/questions" },
    { label: "Workspaces", icon: Building2, href: "/super-admin/workspaces" },
    { label: "Site Settings", icon: Settings, href: "/super-admin/settings" },
    { label: "Notices", icon: Bell, href: "/super-admin/notices", isNotice: true },
    { label: "Inquiries", icon: MessageSquare, href: "/super-admin/inquiries", isInquiry: true },
    { label: "User Guide", icon: BookMarked, href: "/super-admin/guide" },
];


const adminRoutes = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { label: "Billing & Subscription", icon: Wallet, href: "/admin/billing" },
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
        <div className="space-y-4 py-4 flex flex-col h-full bg-zinc-950 text-white border-r border-white/5">
            <div className="px-3 py-2 flex-1">
                <Link href="/" className="flex items-center pl-3 mb-10 group gap-3">
                    <h1 className="text-2xl font-black tracking-tighter text-white transition-colors">
                        ABCD Exam Hub
                    </h1>
                </Link>
                <div className="space-y-1">
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
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-white/5 rounded-lg transition-all items-center",
                                    isActive ? "text-primary bg-primary/10" : "text-zinc-400 hover:text-white"
                                )}
                            >
                                <div className="flex items-center flex-1">
                                    <route.icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary" : "text-zinc-400 group-hover:text-white")} />
                                    {route.label}
                                </div>
                                {showBadge && (
                                    <span className="ml-auto flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                                        {displayCount > 99 ? "99+" : displayCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
