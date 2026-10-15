"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface NavbarProps {
    siteName?: string;
    logoUrl?: string;
    navbarItems?: { label: string; href: string }[];
}

export default function Navbar({
    siteName = "ABCD Exam Hub",
    logoUrl = "/abcdExamHub/branding/logo.png",
    navbarItems = []
}: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const { userId } = useAuth();

    useEffect(() => {
        setMounted(true);
        let rafId: number;
        const handleScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                setIsScrolled(window.scrollY > 15);
            });
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobileMenuOpen]);

    const defaultItems = [
        { label: "Home", href: "/" },
        { label: "Services", href: "/services" },
        { label: "Pricing", href: "/pricing" },
        { label: "Support", href: "/support" },
    ];

    const menuItems = navbarItems.length > 0 ? navbarItems : defaultItems;
    const isHomePage = pathname === "/";
    const useWhiteText = isHomePage && !isScrolled;

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6",
                    isScrolled
                        ? "py-2.5 bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-xs"
                        : "py-3.5 bg-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Brand */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        {logoUrl && (
                            <Image
                                src={logoUrl}
                                alt={siteName}
                                width={120}
                                height={32}
                                priority
                                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                        )}
                        {siteName && (
                            <span
                                className={cn(
                                    "text-lg sm:text-xl font-bold tracking-tight transition-colors duration-200",
                                    useWhiteText ? "text-white" : "text-foreground"
                                )}
                            >
                                {siteName}
                            </span>
                        )}
                    </Link>

                    {/* Desktop Menu */}
                    <nav suppressHydrationWarning className="hidden lg:flex items-center gap-1 px-1.5 py-1 bg-secondary/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-full border border-border/50">
                        {menuItems.map((item: { label: string; href: string }) => {
                            const isActive = mounted && pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all rounded-full",
                                        isActive
                                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                            : useWhiteText
                                            ? "text-zinc-200 hover:text-white hover:bg-white/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Direct One-Click Theme Toggle Button */}
                        <ThemeToggle
                            className={cn(
                                useWhiteText
                                    ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                                    : ""
                            )}
                        />

                        {/* User Actions for Desktop */}
                        <div className="hidden sm:flex items-center gap-2.5">
                            {userId ? (
                                <div className="flex items-center gap-2.5">
                                    <Link href="/dashboard">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "h-8.5 rounded-full px-3 text-xs font-medium gap-1.5 border-border/70",
                                                useWhiteText
                                                    ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                                                    : ""
                                            )}
                                        >
                                            <LayoutDashboard className="size-3.5" />
                                            <span>Dashboard</span>
                                        </Button>
                                    </Link>
                                    <div className="size-8.5 rounded-full border border-border/60 flex items-center justify-center p-0.5">
                                        <UserButton afterSignOutUrl="/" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/sign-in">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-8.5 px-3 text-xs font-semibold rounded-full",
                                                useWhiteText
                                                    ? "text-white hover:bg-white/10"
                                                    : "text-foreground hover:bg-muted"
                                            )}
                                        >
                                            Sign In
                                        </Button>
                                    </Link>
                                    <Link href="/sign-up">
                                        <Button
                                            size="sm"
                                            className="h-8.5 px-4 text-xs font-semibold rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-transform hover:scale-102 active:scale-98"
                                        >
                                            Get Started
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Hamburger Button */}
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle navigation menu"
                            className={cn(
                                "lg:hidden size-9 rounded-full flex items-center justify-center border transition-all active:scale-95",
                                useWhiteText
                                    ? "text-white border-white/20 bg-white/10 hover:bg-white/20"
                                    : "text-foreground border-border/70 bg-card/60 hover:bg-muted"
                            )}
                        >
                            {isMobileMenuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Drawer / Sheet */}
            <div
                className={cn(
                    "fixed inset-0 z-40 lg:hidden transition-all duration-300",
                    isMobileMenuOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                )}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Content Panel */}
                <div
                    className={cn(
                        "absolute top-0 right-0 w-[85%] max-w-sm h-full bg-background border-l border-border/60 shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 ease-out",
                        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    <div className="space-y-6 pt-12">
                        <div className="flex items-center justify-between pb-4 border-b border-border/50">
                            <span className="text-sm font-bold tracking-tight text-foreground">Navigation</span>
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="size-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div suppressHydrationWarning className="flex flex-col space-y-1">
                            {menuItems.map((item: { label: string; href: string }) => {
                                const isActive = mounted && pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between",
                                            isActive
                                                ? "bg-primary/10 text-primary font-semibold"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <span>{item.label}</span>
                                        {isActive && <span className="size-1.5 rounded-full bg-primary" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Drawer Actions */}
                    <div className="space-y-3 pt-6 border-t border-border/50">
                        {userId ? (
                            <div className="space-y-2">
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full block"
                                >
                                    <Button className="w-full h-10 rounded-xl font-medium text-xs tracking-wide">
                                        Go to Dashboard
                                    </Button>
                                </Link>
                                <div className="flex items-center justify-between px-2 pt-2">
                                    <span className="text-xs text-muted-foreground">Account</span>
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/sign-in"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 rounded-xl text-xs font-medium"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                                <Link
                                    href="/sign-up"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Button className="w-full h-10 rounded-xl text-xs font-semibold bg-primary text-primary-foreground">
                                        Get Started Free
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
