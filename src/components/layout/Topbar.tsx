"use client";

import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";

export function Topbar() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="sticky top-0 z-40 flex items-center h-14 bg-background/80 dark:bg-card/60 backdrop-blur-md border-b border-border/60 px-4 sm:px-6 w-full justify-between transition-colors">
            <div className="flex items-center gap-3">
                <span className="md:hidden font-bold text-sm tracking-tight text-foreground">
                    ABCD Exam Hub
                </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
                <ThemeToggle />
                {mounted && (
                    <div className="size-8.5 rounded-full border border-border/60 flex items-center justify-center p-0.5">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                )}
            </div>
        </header>
    );
}
