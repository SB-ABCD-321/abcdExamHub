"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
    isCollapsed: boolean;
    toggleCollapsed: () => void;
    setCollapsed: (collapsed: boolean) => void;
    isMobileOpen: boolean;
    toggleMobile: () => void;
    setMobileOpen: (open: boolean) => void;
    mounted: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
    const [mounted, setMounted] = useState<boolean>(false);
    const pathname = usePathname();

    // Initialize from localStorage safely on client mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("abcd_sidebar_collapsed");
            if (saved !== null) {
                setIsCollapsed(saved === "true");
            }
        } catch {
            // ignore localStorage errors (e.g. incognito/iframe)
        }
        setMounted(true);
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const toggleCollapsed = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem("abcd_sidebar_collapsed", String(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    const setCollapsed = (val: boolean) => {
        setIsCollapsed(val);
        try {
            localStorage.setItem("abcd_sidebar_collapsed", String(val));
        } catch {
            // ignore
        }
    };

    const toggleMobile = () => {
        setIsMobileOpen((prev) => !prev);
    };

    return (
        <SidebarContext.Provider
            value={{
                isCollapsed,
                toggleCollapsed,
                setCollapsed,
                isMobileOpen,
                toggleMobile,
                setMobileOpen: setIsMobileOpen,
                mounted
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}
