"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Home, 
    ClipboardList, 
    User, 
    Settings, 
    Bell, 
    Target, 
    QrCode, 
    FileQuestion, 
    LayoutDashboard, 
    CalendarCheck, 
    MessageSquare, 
    Building2, 
    MoreHorizontal, 
    Users, 
    Terminal, 
    BookMarked, 
    IndianRupee, 
    Wallet, 
    ClipboardCheck 
} from "lucide-react";
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
    { label: "Requests", icon: ClipboardCheck, href: "/super-admin/requests" },
    { label: "Exams", icon: ClipboardList, href: "/super-admin/exams" },
    { label: "Questions", icon: FileQuestion, href: "/super-admin/questions" },
    { label: "Workspaces", icon: Building2, href: "/super-admin/workspaces" },
    { label: "Payments", icon: IndianRupee, href: "/super-admin/payments" },
    { label: "Notices", icon: Bell, href: "/super-admin/notices", isNotice: true },
    { label: "Site Settings", icon: Settings, href: "/super-admin/settings" },
    { label: "User Guide", icon: BookMarked, href: "/super-admin/guide" },
];

const adminMainRoutes = [
    { label: "Hub", icon: Home, href: "/admin" },
    { label: "Teachers", icon: User, href: "/admin/teachers" },
    { label: "Questions", icon: FileQuestion, href: "/teacher/questions" },
    { label: "Exams", icon: ClipboardList, href: "/teacher/exams" },
];

const adminMoreRoutes = [
    { label: "Billing & Renew", icon: Wallet, href: "/admin/billing" },
    { label: "Invites", icon: QrCode, href: "/admin/invitations" },
    { label: "Notices", icon: Bell, href: "/admin/notices", isNotice: true },
    { label: "Config", icon: Settings, href: "/admin/settings" },
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

    if (role === "SUPER_ADMIN" || role === "ADMIN") {
        const moreBadgeCount = (unreadNoticeCount > 0 ? unreadNoticeCount : 0);
        const mainRoutes = role === "SUPER_ADMIN" ? superAdminMainRoutes : adminMainRoutes;
        const moreRoutes = role === "SUPER_ADMIN" ? superAdminMoreRoutes : adminMoreRoutes;

        return (
            <nav 
                aria-label="Mobile Navigation"
                className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 dark:bg-card/95 backdrop-blur-xl border-t border-border/70 flex items-center justify-around z-40 pb-safe shadow-lg transition-colors"
            >
                {mainRoutes.map((item: any) => {
                    const isActive = pathname === item.href;
                    const showBadge = (item.isBooking && unreadBookingCount > 0) ||
                        (item.isInquiry && unreadInquiryCount > 0);

                    const displayCount = item.isBooking ? unreadBookingCount : unreadInquiryCount;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative group active:scale-95",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="relative">
                                <item.icon className={cn("size-5 transition-transform duration-200", isActive && "scale-110 drop-shadow-xs")} />
                                {showBadge && (
                                    <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-black rounded-full bg-rose-500 text-white border-2 border-background shadow-xs">
                                        {displayCount > 9 ? "9+" : displayCount}
                                    </span>
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-semibold tracking-tight transition-all",
                                isActive ? "opacity-100 font-bold" : "opacity-75 group-hover:opacity-100"
                            )}>
                                {item.label}
                            </span>
                            {isActive && (
                                <span className="absolute bottom-1 w-5 h-0.75 bg-primary rounded-full shadow-xs" />
                            )}
                        </Link>
                    );
                })}

                {mounted ? (
                    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger asChild>
                            <button
                                type="button"
                                aria-label="Open More Menu"
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative text-muted-foreground hover:text-foreground active:scale-95 cursor-pointer"
                                )}
                            >
                                <div className="relative">
                                    <MoreHorizontal className="size-5" />
                                    {moreBadgeCount > 0 && (
                                        <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-black rounded-full bg-rose-500 text-white border-2 border-background shadow-xs">
                                            {moreBadgeCount > 9 ? "9+" : moreBadgeCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-semibold tracking-tight opacity-75">More</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-3xl border-t border-border/80 bg-background/95 dark:bg-card/95 backdrop-blur-2xl p-5 max-h-[80vh] overflow-y-auto">
                            <SheetHeader className="pb-3 border-b border-border/60">
                                <SheetTitle className="text-base font-bold tracking-tight text-center">
                                    More Options
                                </SheetTitle>
                            </SheetHeader>
                            <div className="grid grid-cols-2 gap-2.5 mt-4">
                                {moreRoutes.map((item: any) => {
                                    const isActive = pathname === item.href;
                                    const showBadge = item.isNotice && unreadNoticeCount > 0;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSheetOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                                                isActive 
                                                    ? "bg-primary/10 text-primary border-primary/30 font-semibold shadow-xs" 
                                                    : "bg-muted/30 border-border/60 text-foreground/80 hover:bg-muted/80 hover:text-foreground"
                                            )}
                                        >
                                            <div className="relative shrink-0">
                                                <item.icon className={cn("size-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                                {showBadge && (
                                                    <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-black rounded-full bg-rose-500 text-white border-2 border-background shadow-xs">
                                                        {unreadNoticeCount > 99 ? "99+" : unreadNoticeCount}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[12.5px] font-medium tracking-tight truncate">{item.label}</span>
                                        </Link>
                                    );
                                })}

                                {role === "SUPER_ADMIN" && email && developerEmail && email.toLowerCase() === developerEmail.toLowerCase() && (
                                    <Link
                                        href="/super-admin/developer"
                                        onClick={() => setSheetOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 col-span-2",
                                            pathname === "/super-admin/developer" 
                                                ? "bg-primary/10 text-primary border-primary/30 font-semibold" 
                                                : "bg-muted/30 border-border/60 text-foreground/80 hover:bg-muted/80"
                                        )}
                                    >
                                        <Terminal className="size-5 text-primary shrink-0" />
                                        <span className="text-[12.5px] font-medium tracking-tight">Developer Terminal</span>
                                    </Link>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                ) : (
                    <button
                        type="button"
                        className={cn(
                            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative text-muted-foreground"
                        )}
                    >
                        <div className="relative">
                            <MoreHorizontal className="size-5" />
                        </div>
                        <span className="text-[10px] font-semibold tracking-tight opacity-75">More</span>
                    </button>
                )}
            </nav>
        );
    }

    let navItems = studentRoutes;
    if (role === "TEACHER") {
        navItems = teacherRoutes;
    }

    return (
        <nav 
            aria-label="Mobile Navigation"
            className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 dark:bg-card/95 backdrop-blur-xl border-t border-border/70 flex items-center justify-around z-40 pb-safe shadow-lg transition-colors"
        >
            {navItems.map((item: any) => {
                const isActive = pathname === item.href;
                const showBadge = (item.isNotice && unreadNoticeCount > 0);
                const displayCount = unreadNoticeCount;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative group active:scale-95",
                            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <div className="relative">
                            <item.icon className={cn("size-5 transition-transform duration-200", isActive && "scale-110 drop-shadow-xs")} />
                            {showBadge && (
                                <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-black rounded-full bg-rose-500 text-white border-2 border-background shadow-xs">
                                    {displayCount > 9 ? "9+" : displayCount}
                                </span>
                            )}
                        </div>
                        <span className={cn(
                            "text-[10px] font-semibold tracking-tight transition-all",
                            isActive ? "opacity-100 font-bold" : "opacity-75 group-hover:opacity-100"
                        )}>
                            {item.label}
                        </span>
                        {isActive && (
                            <span className="absolute bottom-1 w-5 h-0.75 bg-primary rounded-full shadow-xs" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
