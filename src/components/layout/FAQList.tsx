"use client";

import { useState } from "react";
import { FAQItem } from "./FAQItem";

interface FAQListProps {
    faqs: { question: string; answer: string }[];
}

export function FAQList({ faqs }: FAQListProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    return (
        <div className="space-y-4">
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
