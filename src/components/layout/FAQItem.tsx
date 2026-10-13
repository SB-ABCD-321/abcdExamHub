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
        <div
            className={cn(
                "p-3.5 sm:p-4 rounded-xl transition-all duration-200 border cursor-pointer overflow-hidden",
                isOpen
                    ? "bg-card border-primary/40 shadow-xs"
                    : "bg-card/70 border-border/60 hover:border-primary/30"
            )}
            onClick={onClick}
        >
            <div className="flex items-center justify-between gap-3">
                <h3 className={cn(
                    "text-sm sm:text-base font-semibold tracking-tight transition-colors",
                    isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
                )}>
                    {question}
                </h3>
                <div className={cn(
                    "size-7 rounded-lg flex items-center justify-center transition-transform duration-200 shrink-0",
                    isOpen ? "bg-primary text-primary-foreground rotate-180" : "bg-muted text-muted-foreground"
                )}>
                    <ChevronDown className="size-4" />
                </div>
            </div>
            <div className={cn(
                "grid transition-all duration-200 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100 mt-2.5" : "grid-rows-[0fr] opacity-0"
            )}>
                <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-3">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
}
