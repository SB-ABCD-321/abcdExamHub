"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { Menu, X, LayoutDashboard, Home, Layers, CreditCard, HelpCircle, ChevronRight, Sparkles, ShieldCheck } from "lucide-react";
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
                    "fixed inset-0 z-[70] lg:hidden transition-all duration-300",
                    isMobileMenuOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                )}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Content Panel */}
                <div
                    className={cn(
                        "absolute top-0 right-0 w-[88%] max-w-sm h-full bg-background border-l border-border/70 shadow-2xl p-5 sm:p-6 flex flex-col justify-between transition-transform duration-300 ease-out overflow-y-auto",
                        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    <div className="space-y-6 pt-4">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-border/50">
                            <div className="flex items-center gap-2.5">
                                {logoUrl && (
                                    <Image
                                        src={logoUrl}
                                        alt={siteName}
                                        width={28}
                                        height={28}
                                        className="h-7 w-auto object-contain"
                                    />
                                )}
                                <span className="text-sm font-bold tracking-tight text-foreground">{siteName}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                aria-label="Close navigation"
                                className="size-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Navigation Links — Modern, properly styled interactive rows */}
                        <div suppressHydrationWarning className="space-y-2">
                            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                                Navigation
                            </div>
                            <div className="flex flex-col space-y-2">
                                {menuItems.map((item: { label: string; href: string }) => {
                                    const isActive = mounted && pathname === item.href;
                                    const l = item.label.toLowerCase();
                                    const IconComponent = l.includes("home")
                                        ? Home
                                        : l.includes("service")
                                        ? Layers
                                        : l.includes("price") || l.includes("pricing")
                                        ? CreditCard
                                        : l.includes("support") || l.includes("help") || l.includes("contact")
                                        ? HelpCircle
                                        : Sparkles;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "px-3.5 py-3 rounded-2xl text-sm font-medium transition-all flex items-center justify-between border",
                                                isActive
                                                    ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-xs"
                                                    : "bg-card/50 hover:bg-card border-border/60 text-foreground hover:border-primary/30"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "size-8 rounded-xl flex items-center justify-center transition-colors",
                                                    isActive 
                                                        ? "bg-primary text-primary-foreground shadow-xs" 
                                                        : "bg-muted text-muted-foreground"
                                                )}>
                                                    <IconComponent className="size-4" />
                                                </div>
                                                <span className="font-semibold text-sm">{item.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {isActive && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary uppercase">
                                                        Active
                                                    </span>
                                                )}
                                                <ChevronRight className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground/50")} />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Trust / Info Highlight Pill */}
                        <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-xs space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-foreground">
                                <ShieldCheck className="size-3.5 text-primary" />
                                <span>Secured Assessment Hub</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                AI-powered question authoring & bank-grade anti-cheat telemetry.
                            </p>
                        </div>
                    </div>

                    {/* Bottom Drawer Actions — Kept at bottom, with ample safe padding and clean styling */}
                    <div className="space-y-3 pt-5 pb-6 border-t border-border/50 shrink-0">
                        {userId ? (
                            <div className="space-y-3">
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full block"
                                >
                                    <Button className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 gap-2 cursor-pointer">
                                        <LayoutDashboard className="size-4" />
                                        <span>Go to Dashboard</span>
                                    </Button>
                                </Link>
                                <div className="flex items-center justify-between px-2 pt-1">
                                    <span className="text-xs font-semibold text-muted-foreground">Account</span>
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                <Link
                                    href="/sign-in"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 rounded-xl text-xs font-bold border-border"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                                <Link
                                    href="/sign-up"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Button className="w-full h-11 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20">
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
