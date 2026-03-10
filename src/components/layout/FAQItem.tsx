"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

export function FAQItem({ question, answer, isOpen, onClick }: FAQItemProps) {
    return (
        <div className={cn(
            "p-6 md:p-8 rounded-[2rem] transition-all duration-500 border group cursor-pointer overflow-hidden",
            isOpen
                ? "bg-white dark:bg-zinc-900 border-primary/30 shadow-2xl shadow-primary/5"
                : "bg-white/50 dark:bg-zinc-900/50 border-border/50 hover:border-primary/20 shadow-sm"
        )}
            onClick={onClick}
        >
            <div className="flex items-center justify-between gap-4">
                <h3 className={cn(
                    "text-lg font-bold tracking-tight transition-colors duration-300",
                    isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
                )}>
                    {question}
                </h3>
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0",
                    isOpen ? "bg-primary text-primary-foreground rotate-180" : "bg-primary/10 text-primary"
                )}>
                    <ChevronDown className="w-5 h-5" />
                </div>
            </div>
            <div className={cn(
                "grid transition-all duration-500 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100 mt-6" : "grid-rows-[0fr] opacity-0"
            )}>
                <div className="overflow-hidden">
                    <p className="text-sm text-muted-foreground font-medium italic leading-relaxed border-l-2 border-primary/20 pl-6">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
}
