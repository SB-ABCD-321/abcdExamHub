"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, User, Settings, Bell, Target, QrCode, FileQuestion, LayoutDashboard, CalendarCheck, MessageSquare, Building2, MoreHorizontal, Users, Terminal, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const superAdminMainRoutes = [
    { label: "Hub", icon: LayoutDashboard, href: "/super-admin" },
    { label: "Users", icon: Users, href: "/super-admin/users" },
    { label: "Bookings", icon: CalendarCheck, href: "/super-admin/bookings", isBooking: true },
    { label: "Inquiry", icon: MessageSquare, href: "/super-admin/inquiries", isInquiry: true },
];

const superAdminMoreRoutes = [
    { label: "Exams", icon: ClipboardList, href: "/super-admin/exams" },
    { label: "Questions", icon: FileQuestion, href: "/super-admin/questions" },
    { label: "Workspaces", icon: Building2, href: "/super-admin/workspaces" },
    { label: "Notices", icon: Bell, href: "/super-admin/notices", isNotice: true },
    { label: "Site Settings", icon: Settings, href: "/super-admin/settings" },
    { label: "User Guide", icon: BookMarked, href: "/super-admin/guide" },
];

const adminRoutes = [
    { label: "Hub", icon: Home, href: "/admin" },
    { label: "Teachers", icon: User, href: "/admin/teachers" },
    { label: "Invites", icon: QrCode, href: "/admin/invitations" },
    { label: "Config", icon: Settings, href: "/admin/settings" },
    { label: "Notices", icon: Bell, href: "/admin/notices", isNotice: true },
    { label: "Guide", icon: BookMarked, href: "/admin/guide" }
];

const teacherRoutes = [
    { label: "Hub", icon: Home, href: "/teacher" },
    { label: "Questions", icon: FileQuestion, href: "/teacher/questions" },
    { label: "Exams", icon: ClipboardList, href: "/teacher/exams" },
    { label: "Notices", icon: Bell, href: "/teacher/notices", isNotice: true },
    { label: "Guide", icon: BookMarked, href: "/teacher/guide" },
];

const studentRoutes = [
    { label: "Hub", icon: Home, href: "/student" },
    { label: "Exams", icon: ClipboardList, href: "/student/exams" },
    { label: "Results", icon: Target, href: "/student/results" },
    { label: "Notices", icon: Bell, href: "/student/notices", isNotice: true },
    { label: "Guide", icon: BookMarked, href: "/student/guide" }
];

interface MobileBottomNavProps {
    role?: string;
    email?: string;
    developerEmail?: string;
    unreadNoticeCount?: number;
    unreadInquiryCount?: number;
    unreadBookingCount?: number;
}

export function MobileBottomNav({
    role,
    email,
    developerEmail,
    unreadNoticeCount = 0,
    unreadInquiryCount = 0,
    unreadBookingCount = 0
}: MobileBottomNavProps) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (role === "SUPER_ADMIN") {
        const moreBadgeCount = (unreadNoticeCount > 0 ? unreadNoticeCount : 0);

        return (
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-950 border-t flex items-center justify-around z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
                {superAdminMainRoutes.map((item: any) => {
                    const isActive = pathname === item.href;
                    const showBadge = (item.isBooking && unreadBookingCount > 0) ||
                        (item.isInquiry && unreadInquiryCount > 0);

                    const displayCount = item.isBooking ? unreadBookingCount : unreadInquiryCount;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                            )}
                        >
                            <div className="relative">
                                <item.icon className={cn("w-5 h-5 transition-transform duration-200", isActive && "fill-primary/20 scale-110")} />
                                {showBadge && (
                                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[8px] font-black rounded-full bg-rose-500 text-white border-2 border-white dark:border-zinc-950">
                                        {displayCount > 9 ? "9+" : displayCount}
                                    </span>
                                )}
                            </div>
                            <span className={cn("text-[9px] font-bold uppercase tracking-tighter opacity-80", isActive && "opacity-100")}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                {mounted ? (
                    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger asChild>
                            <button
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative text-muted-foreground hover:text-primary/70"
                                )}
                            >
                                <div className="relative">
                                    <MoreHorizontal className="w-5 h-5" />
                                    {moreBadgeCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[8px] font-black rounded-full bg-rose-500 text-white border-2 border-white dark:border-zinc-950">
                                            {moreBadgeCount > 9 ? "9+" : moreBadgeCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-tighter opacity-80">More</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-[2rem] border-t-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl p-6">
                            <SheetHeader className="pb-4 border-b border-black/5 dark:border-white/5">
                                <SheetTitle className="text-xl font-black uppercase tracking-widest text-center">Intelligence Menu</SheetTitle>
                            </SheetHeader>
                            <div className="grid grid-cols-1 gap-2 mt-4">
                                {superAdminMoreRoutes.map((item: any) => {
                                    const isActive = pathname === item.href;
                                    const showBadge = item.isNotice && unreadNoticeCount > 0;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSheetOpen(false)}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300",
                                                isActive ? "bg-primary/10 text-primary shadow-inner" : "text-slate-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className="relative">
                                                <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
                                                {showBadge && (
                                                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1.5 text-[10px] font-black rounded-full bg-rose-500 text-white border-2 border-white dark:border-zinc-950">
                                                        {unreadNoticeCount > 99 ? "99+" : unreadNoticeCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                                            </div>
                                        </Link>
                                    );
                                })}

                                {email && developerEmail && email.toLowerCase() === developerEmail.toLowerCase() && (
                                    <Link
                                        href="/super-admin/developer"
                                        onClick={() => setSheetOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300",
                                            pathname === "/super-admin/developer" ? "bg-primary/10 text-primary shadow-inner" : "text-slate-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <div className="relative">
                                            <Terminal className={cn("w-6 h-6", pathname === "/super-admin/developer" && "fill-primary/20")} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black uppercase tracking-widest">Developer</span>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                ) : (
                    <button
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative text-muted-foreground hover:text-primary/70"
                        )}
                    >
                        <div className="relative">
                            <MoreHorizontal className="w-5 h-5" />
                            {moreBadgeCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[8px] font-black rounded-full bg-rose-500 text-white border-2 border-white dark:border-zinc-950">
                                    {moreBadgeCount > 9 ? "9+" : moreBadgeCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-tighter opacity-80">More</span>
                    </button>
                )}
            </div>
        );
    }

    let navItems = studentRoutes;
    if (role === "ADMIN") {
        navItems = [
            ...adminRoutes,
            ...teacherRoutes.filter(r => r.label !== "Hub" && r.label !== "Notices" && r.label !== "Guide")
        ];
    } else if (role === "TEACHER") {
        navItems = teacherRoutes;
    }

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-950 border-t flex items-center justify-around z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
            {navItems.map((item: any) => {
                const isActive = pathname === item.href;
                const showBadge = (item.isNotice && unreadNoticeCount > 0);
                const displayCount = unreadNoticeCount;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative",
                            isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                        )}
                    >
                        <div className="relative">
                            <item.icon className={cn("w-5 h-5 transition-transform duration-200", isActive && "fill-primary/20 scale-110")} />
                            {showBadge && (
                                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[8px] font-black rounded-full bg-rose-500 text-white border-2 border-white dark:border-zinc-950">
                                    {displayCount > 9 ? "9+" : displayCount}
                                </span>
                            )}
                        </div>
                        <span className={cn("text-[9px] font-bold uppercase tracking-tighter opacity-80", isActive && "opacity-100")}>
                            {item.label}
                        </span>
                    </Link>
                )
            })}
        </div>
    );
}
