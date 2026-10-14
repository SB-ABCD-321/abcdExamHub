"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSidebar } from "@/context/SidebarContext";

interface MobileSidebarProps {
    role?: string;
    userName?: string;
    email?: string;
    developerEmail?: string;
    unreadNoticeCount?: number;
    unreadInquiryCount?: number;
    unreadBookingCount?: number;
}

export function MobileSidebar({
    role,
    userName,
    email,
    developerEmail,
    unreadNoticeCount,
    unreadInquiryCount,
    unreadBookingCount,
}: MobileSidebarProps) {
    const { isMobileOpen, setMobileOpen } = useSidebar();

    return (
        <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent
                side="left"
                className="p-0 w-[245px] sm:w-[255px] max-w-[80vw] border-r border-sidebar-border bg-sidebar shadow-2xl overflow-hidden focus-visible:outline-none"
            >
                <SheetTitle className="sr-only">Dashboard Navigation Menu</SheetTitle>
                <Sidebar
                    role={role}
                    userName={userName}
                    email={email}
                    developerEmail={developerEmail}
                    unreadNoticeCount={unreadNoticeCount}
                    unreadInquiryCount={unreadInquiryCount}
                    unreadBookingCount={unreadBookingCount}
                    isMobile={true}
                    onNavigate={() => setMobileOpen(false)}
                />
            </SheetContent>
        </Sheet>
    );
}
