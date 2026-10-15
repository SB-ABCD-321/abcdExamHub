"use client";

import React from "react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
    role?: string;
    userName?: string;
    email?: string;
    developerEmail?: string;
    unreadNoticeCount?: number;
    unreadInquiryCount?: number;
    unreadBookingCount?: number;
    workspaceBlocked?: React.ReactNode;
    pwaPrompt?: React.ReactNode;
    children: React.ReactNode;
}

function DashboardShellContent({
    role,
    userName,
    email,
    developerEmail,
    unreadNoticeCount,
    unreadInquiryCount,
    unreadBookingCount,
    workspaceBlocked,
    pwaPrompt,
    children,
}: DashboardShellProps) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="h-full relative antialiased min-h-screen bg-background text-foreground transition-colors">
            {/* Desktop Fixed Sidebar */}
            <div
                className={cn(
                    "hidden h-[100dvh] md:flex md:flex-col md:fixed md:inset-y-0 z-50 transition-[width] duration-200 ease-out will-change-[width]",
                    isCollapsed ? "md:w-[70px]" : "md:w-60"
                )}
            >
                <Sidebar
                    role={role}
                    userName={userName}
                    email={email}
                    developerEmail={developerEmail}
                    unreadNoticeCount={unreadNoticeCount}
                    unreadInquiryCount={unreadInquiryCount}
                    unreadBookingCount={unreadBookingCount}
                />
            </div>

            {/* Mobile Off-Canvas Drawer */}
            <MobileSidebar
                role={role}
                userName={userName}
                email={email}
                developerEmail={developerEmail}
                unreadNoticeCount={unreadNoticeCount}
                unreadInquiryCount={unreadInquiryCount}
                unreadBookingCount={unreadBookingCount}
            />

            {/* Main Content Area */}
            <main
                className={cn(
                    "min-h-[100dvh] pb-16 md:pb-0 relative transition-[padding-left] duration-200 ease-out flex flex-col will-change-[padding-left]",
                    isCollapsed ? "md:pl-[70px]" : "md:pl-60"
                )}
            >
                <Topbar role={role} />
                <div className="flex-1 px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-5 lg:pt-6 pb-8 w-full">
                    {workspaceBlocked ? workspaceBlocked : children}
                </div>

                <MobileBottomNav
                    role={role}
                    email={email}
                    developerEmail={developerEmail}
                    unreadNoticeCount={unreadNoticeCount}
                    unreadInquiryCount={unreadInquiryCount}
                    unreadBookingCount={unreadBookingCount}
                />
                {pwaPrompt}
            </main>
        </div>
    );
}

export function DashboardShell(props: DashboardShellProps) {
    return (
        <SidebarProvider>
            <DashboardShellContent {...props} />
        </SidebarProvider>
    );
}
