"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    BookOpen, 
    Users, 
    Settings, 
    ClipboardList, 
    GraduationCap, 
    Building2, 
    Bell, 
    QrCode, 
    MessageSquare, 
    CalendarCheck, 
    Terminal, 
    BookMarked, 
    ClipboardCheck, 
    Wallet, 
    IndianRupee,
    Shield,
    GraduationCap as StudentIcon,
    School
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";

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
    { label: "Question Bank", icon: BookOpen, href: "/admin/questions" },
    { label: "Exams", icon: ClipboardList, href: "/teacher/exams" },
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

const roleMeta: Record<string, { label: string; badge: string; icon: any; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", badge: "Admin Control", icon: Shield, color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20" },
    ADMIN: { label: "Admin Workspace", badge: "Institution", icon: School, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
    TEACHER: { label: "Teacher Portal", badge: "Instructor", icon: BookOpen, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    STUDENT: { label: "Student Portal", badge: "Learner", icon: StudentIcon, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

interface SidebarProps {
    role?: string;
    userName?: string;
    email?: string;
    developerEmail?: string;
    unreadNoticeCount?: number;
    unreadInquiryCount?: number;
    unreadBookingCount?: number;
    isMobile?: boolean;
    onNavigate?: () => void;
}

export function Sidebar({
    role,
    userName,
    email,
    developerEmail,
    unreadNoticeCount = 0,
    unreadInquiryCount = 0,
    unreadBookingCount = 0,
    isMobile = false,
    onNavigate,
}: SidebarProps) {
    const pathname = usePathname();
    const { isCollapsed } = useSidebar();

    // Mobile sidebar is always full-width/expanded
    const collapsed = isMobile ? false : isCollapsed;

    let routes: { label: string; icon: any; href: string; isNotice?: boolean; isInquiry?: boolean; isBooking?: boolean }[] = studentRoutes;
    if (role === "SUPER_ADMIN") {
        routes = [...superAdminRoutes];
        if (email && developerEmail && email.toLowerCase() === developerEmail.toLowerCase()) {
            routes.push({ label: "Developer", icon: Terminal, href: "/super-admin/developer" });
        }
    } else if (role === "ADMIN") {
        routes = adminRoutes;
    } else if (role === "TEACHER") {
        routes = teacherRoutes;
    }

    const currentRole = roleMeta[role || "STUDENT"] || roleMeta.STUDENT;

    return (
        <aside
            aria-label="Dashboard Sidebar"
            className={cn(
                "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-200 ease-out will-change-[width] select-none",
                collapsed ? "w-[70px]" : "w-full md:w-60"
            )}
        >
            {/* Header / Brand Area */}
            <div className={cn(
                "border-b border-sidebar-border/70 flex items-center transition-[padding] duration-200 h-16",
                collapsed ? "px-2 justify-center" : "px-3.5 justify-start"
            )}>
                {!collapsed ? (
                    <Link
                        href="/"
                        onClick={() => onNavigate?.()}
                        className="flex items-center gap-3 w-full min-w-0 group"
                    >
                        {/* High-contrast solid profile/brand box - stays stable and visible on hover */}
                        <div className="size-10 rounded-xl bg-primary text-primary-foreground font-black text-base flex items-center justify-center shrink-0 shadow-xs select-none">
                            A
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 truncate">
                            <span 
                                className="text-[14.5px] md:text-[15.5px] font-bold tracking-tight text-sidebar-foreground group-hover:text-primary transition-colors truncate block w-full"
                                title="ABCD Exam Hub"
                            >
                                ABCD Exam Hub
                            </span>
                            {/* Simple text role label without background box, with ellipsis for long text */}
                            <span 
                                className="text-[11px] md:text-[11.5px] font-medium text-muted-foreground truncate block w-full leading-tight"
                                title={currentRole.label}
                            >
                                {currentRole.label}
                            </span>
                        </div>
                    </Link>
                ) : (
                    <Link
                        href="/"
                        className="size-10 rounded-xl bg-primary text-primary-foreground font-black text-base flex items-center justify-center shadow-xs select-none"
                    >
                        A
                    </Link>
                )}
            </div>

            {/* Navigation List */}
            <div className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden space-y-1 py-2.5 scrollbar-thin scrollbar-thumb-sidebar-border",
                collapsed ? "px-2" : "px-2.5"
            )}>
                {routes.map((route) => {
                    const isActive = pathname === route.href;
                    const showBadge = (route.isNotice && unreadNoticeCount > 0) ||
                        (route.isInquiry && unreadInquiryCount > 0) ||
                        (route.isBooking && unreadBookingCount > 0);

                    const displayCount = route.isNotice ? unreadNoticeCount :
                        route.isInquiry ? unreadInquiryCount :
                            unreadBookingCount;

                    return (
                        <div key={route.href} className="relative group">
                            <Link
                                href={route.href}
                                onClick={() => onNavigate?.()}
                                className={cn(
                                    "relative flex items-center rounded-xl cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                                    collapsed
                                        ? "size-10 mx-auto justify-center"
                                        : "w-full py-2 px-3 gap-3",
                                    isActive
                                        ? "bg-primary/12 text-foreground dark:text-white font-semibold border border-primary/25 shadow-2xs"
                                        : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 dark:hover:bg-sidebar-accent/60"
                                )}
                            >
                                {/* Active Indicator Bar for expanded mode */}
                                {!collapsed && isActive && (
                                    <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-primary shadow-2xs" />
                                )}

                                <div className="relative shrink-0 flex items-center justify-center">
                                    <route.icon
                                        className={cn(
                                            "size-[18px] md:size-[19.5px] transition-all duration-200",
                                            isActive
                                                ? "text-primary scale-105"
                                                : "text-muted-foreground group-hover:text-sidebar-foreground group-hover:scale-105"
                                        )}
                                    />
                                    {/* Mini badge dot for collapsed mode */}
                                    {collapsed && showBadge && (
                                        <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 text-[8.5px] font-black rounded-full bg-rose-500 text-white border-2 border-sidebar shadow-2xs">
                                            {displayCount > 9 ? "9+" : displayCount}
                                        </span>
                                    )}
                                </div>

                                {!collapsed && (
                                    <>
                                        <span className="text-[13.5px] md:text-[15px] font-medium tracking-tight truncate flex-1">
                                            {route.label}
                                        </span>
                                        {showBadge && (
                                            <span className="ml-auto shrink-0 flex items-center justify-center min-w-4.5 h-4.5 px-1.5 text-[10px] md:text-[11px] font-bold rounded-full bg-rose-500 text-white shadow-2xs">
                                                {displayCount > 99 ? "99+" : displayCount}
                                            </span>
                                        )}
                                    </>
                                )}
                            </Link>

                            {/* Floating Tooltip in collapsed mode */}
                            {collapsed && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-popover text-popover-foreground text-xs md:text-[13px] font-semibold shadow-xl border border-border/80 whitespace-nowrap">
                                    <span>{route.label}</span>
                                    {showBadge && (
                                        <span className="flex items-center justify-center px-1.5 h-4 text-[9.5px] md:text-[10.5px] font-bold rounded-full bg-rose-500 text-white">
                                            {displayCount > 99 ? "99+" : displayCount}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom User Area */}
            <div className={cn(
                "border-t border-sidebar-border/70 p-3 flex items-center transition-all duration-300",
                collapsed ? "justify-center" : "justify-between"
            )}>
                <div className="flex items-center gap-2.5 px-1 w-full min-w-0">
                    <div className="size-8.5 md:size-9 rounded-xl bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0 border border-sidebar-border/60">
                        <currentRole.icon className="size-4 md:size-4.5 text-primary" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col truncate min-w-0 flex-1">
                            <span 
                                className="text-[12px] md:text-[13px] font-semibold text-sidebar-foreground truncate block w-full"
                                title={userName || (role ? role.replace("_", " ") : "STUDENT")}
                            >
                                {userName || (role ? role.replace("_", " ") : "STUDENT")}
                            </span>
                            <span 
                                className="text-[10px] md:text-[11px] text-muted-foreground truncate block w-full"
                                title={email || "Signed in"}
                            >
                                {email || "Signed in"}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
