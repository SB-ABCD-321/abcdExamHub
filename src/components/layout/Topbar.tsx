"use client";

import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { Menu, PanelLeftClose, PanelLeftOpen, Shield, School, BookOpen, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TopbarProps {
    role?: string;
}

const roleLabels: Record<string, { label: string; icon: any; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", icon: Shield, color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20" },
    ADMIN: { label: "Admin Portal", icon: School, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
    TEACHER: { label: "Teacher Portal", icon: BookOpen, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    STUDENT: { label: "Student Hub", icon: GraduationCap, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

export function Topbar({ role }: TopbarProps) {
    const [mounted, setMounted] = useState(false);
    const { isCollapsed, toggleCollapsed, toggleMobile } = useSidebar();

    useEffect(() => {
        setMounted(true);
    }, []);

    const roleInfo = roleLabels[role || "STUDENT"] || roleLabels.STUDENT;

    return (
        <header className="sticky top-0 z-40 flex items-center h-16 bg-background/80 dark:bg-card/75 backdrop-blur-xl border-b border-border/60 px-3.5 sm:px-6 w-full justify-between transition-colors shadow-2xs">
            {/* Left section: Toggles and Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Mobile Drawer Trigger (Hamburger) */}
                <button
                    type="button"
                    onClick={toggleMobile}
                    aria-label="Open mobile menu"
                    className="md:hidden size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all cursor-pointer border border-border/40"
                >
                    <Menu className="size-5" />
                </button>

                {/* Desktop Sidebar Collapse Toggle */}
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="hidden md:flex size-9 rounded-xl items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all cursor-pointer border border-border/40"
                >
                    {isCollapsed ? (
                        <PanelLeftOpen className="size-4.5 text-primary" />
                    ) : (
                        <PanelLeftClose className="size-4.5" />
                    )}
                </button>

                {/* Mobile Brand Link */}
                <Link href="/" className="md:hidden flex items-center gap-2 group">
                    <div className="size-7.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shadow-2xs">
                        A
                    </div>
                    <span className="font-bold text-[14.5px] tracking-tight text-foreground group-hover:text-primary transition-colors">
                        ABCD Exam Hub
                    </span>
                </Link>

                {/* Role indicator badge for quick reference */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold tracking-tight shadow-2xs">
                    <roleInfo.icon className="size-3.5 text-primary" />
                    <span className="text-[11.5px] text-foreground/80">{roleInfo.label}</span>
                </div>
            </div>

            {/* Right section: Theme Toggle & User Button */}
            <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
                <ThemeToggle />
                {mounted && (
                    <div className="size-9 rounded-full border border-border/60 flex items-center justify-center p-0.5 hover:ring-2 hover:ring-primary/20 transition-all shadow-2xs">
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "size-7.5",
                                },
                            }}
                        />
                    </div>
                )}
            </div>
        </header>
    );
}
