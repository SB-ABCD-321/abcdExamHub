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
        <div className="flex items-center p-4 h-16 bg-white dark:bg-zinc-950 border-b shadow-sm w-full justify-end px-6 gap-x-4">
            {/* Mobile Sidebar toggle or title could go here if needed. Leaving clean for now. */}

            <div className="flex w-full justify-between items-center md:justify-end gap-x-4">
                <h1 className="md:hidden font-bold text-lg tracking-tight">ABCD Exam Hub</h1>

                <div className="flex gap-x-4 items-center pl-auto ml-auto">
                    <ThemeToggle />
                    {mounted && <UserButton afterSignOutUrl="/" />}
                </div>
            </div>
        </div>
    );
}
