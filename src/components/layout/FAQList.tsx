"use client";

import { useState } from "react";
import { FAQItem } from "./FAQItem";
import { cn } from "@/lib/utils";

interface FAQListProps {
    faqs: { question: string; answer: string }[];
    className?: string;
}

export function FAQList({ faqs, className }: FAQListProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    return (
        <div className={cn("space-y-2.5 flex flex-col justify-between h-full", className)}>
            {faqs.map((faq, idx) => (
                <FAQItem
                    key={idx}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={activeIndex === idx}
                    onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                />
            ))}
        </div>
    );
}
