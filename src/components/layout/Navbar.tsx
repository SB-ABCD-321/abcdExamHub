"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { BookOpenCheck, Menu, X, Star, ChevronDown, LayoutDashboard } from "lucide-react";
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
    const pathname = usePathname();
    const { userId } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-4",
                isScrolled
                    ? "bg-background/70 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/5 py-3"
                    : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center group gap-3">
                    {logoUrl && (
                        <Image src={logoUrl} alt={siteName} width={150} height={40} priority className="h-10 w-auto object-contain" />
                    )}
                    {siteName && (
                        <span className={cn(
                            "text-2xl font-black tracking-tighter transition-colors duration-300",
                            useWhiteText ? "text-white" : "text-foreground"
                        )}>
                            {siteName}
                        </span>
                    )}
                </Link>


                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-secondary/50 dark:bg-zinc-900/50 rounded-2xl border border-border/50">
                        {menuItems.map((item: { label: string; href: string }) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "px-4 py-2 text-sm font-bold transition-all rounded-xl hover:bg-primary/20 hover:text-primary",
                                    pathname === item.href
                                        ? "text-primary bg-primary/10"
                                        : useWhiteText ? "text-white" : "text-foreground"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "rounded-full border-2 transition-all duration-300 w-10 h-10 flex items-center justify-center",
                        useWhiteText
                            ? "border-white/40 text-white bg-white/5 backdrop-blur-sm"
                            : "border-primary/20 text-foreground"
                    )}>
                        <ThemeToggle />
                    </div>

                    <div className="hidden sm:flex items-center gap-4">
                        {userId ? (
                            <div className="flex items-center gap-4">
                                <Link href="/dashboard">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        suppressHydrationWarning
                                        className={cn(
                                            "rounded-full w-10 h-10 border-2 transition-all hover:scale-110 active:scale-95",
                                            useWhiteText
                                                ? "border-white/40 bg-white/10 text-white hover:bg-white/20"
                                                : "border-primary/20 text-primary hover:bg-primary/10"
                                        )}
                                    >
                                        <LayoutDashboard className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <div className={cn(
                                    "rounded-full border-2 transition-all duration-300 flex items-center justify-center w-10 h-10",
                                    useWhiteText
                                        ? "border-white/40 bg-white/5"
                                        : "border-primary/40 shadow-sm"
                                )}>
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <SignInButton mode="modal">
                                    <Button
                                        variant="ghost"
                                        suppressHydrationWarning
                                        className={cn(
                                            "text-sm font-bold transition-all hover:bg-white/10 rounded-xl px-6",
                                            useWhiteText ? "text-white" : "text-foreground"
                                        )}
                                    >
                                        Login
                                    </Button>
                                </SignInButton>
                                <Link href="/sign-up">
                                    <Button suppressHydrationWarning className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-6 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                        Register
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        suppressHydrationWarning
                        className={cn(
                            "lg:hidden p-2.5 rounded-xl transition-all duration-300 border-2 active:scale-90",
                            useWhiteText
                                ? "text-white border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-md"
                                : "text-foreground border-primary/20 bg-primary/5 hover:bg-primary/10"
                        )}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-background z-[90] lg:hidden transition-all duration-500 origin-top pt-24",
                    isMobileMenuOpen ? "scale-y-100 opacity-100 pointer-events-auto" : "scale-y-0 opacity-0 pointer-events-none"
                )}
            >
                <div className="flex flex-col p-8 gap-6 h-full overflow-y-auto">
                    {menuItems.map((item: { label: string; href: string }, idx: number) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                                "text-4xl font-black uppercase tracking-tighter transition-all hover:translate-x-4",
                                pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            style={{ transitionDelay: `${idx * 50}ms` }}
                        >
                            {item.label}
                        </Link>
                    ))}

                    <div className="mt-auto flex flex-col gap-4">
                        {userId ? (
                            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button className="w-full h-16 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest rounded-2xl">
                                    Go to Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <SignInButton mode="modal">
                                    <Button variant="outline" className="w-full h-16 border-2 border-primary/20 text-xs font-black uppercase tracking-widest rounded-2xl">
                                        Sign In
                                    </Button>
                                </SignInButton>
                                <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button className="w-full h-16 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20">
                                        Get Started Free
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
