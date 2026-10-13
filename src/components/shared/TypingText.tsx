"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingTextProps {
    text?: string;
    texts?: string[];
    className?: string;
    speed?: number;
    delay?: number;
    eraseSpeed?: number;
    pauseDelay?: number;
    cursor?: boolean;
}

export default function TypingText({
    text,
    texts,
    className,
    speed = 75,
    delay = 350,
    eraseSpeed = 35,
    pauseDelay = 2000,
    cursor = true,
}: TypingTextProps) {
    const list = texts && texts.length > 0 ? texts : (text ? [text] : ["Exam Platform"]);
    const [displayedText, setDisplayedText] = useState(list[0]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [textIndex, setTextIndex] = useState(0);

    useEffect(() => {
        if (list.length === 0) return;

        const currentFullText = list[textIndex] || "";
        let timer: NodeJS.Timeout;

        if (!isDeleting) {
            // Typing forward
            if (displayedText.length < currentFullText.length) {
                timer = setTimeout(() => {
                    setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
                }, speed);
            } else {
                // Completed full word, pause before erasing
                timer = setTimeout(() => {
                    setIsDeleting(true);
                }, pauseDelay);
            }
        } else {
            // Deleting backward
            if (displayedText.length > 0) {
                timer = setTimeout(() => {
                    setDisplayedText(currentFullText.slice(0, displayedText.length - 1));
                }, eraseSpeed);
            } else {
                // Completely erased, short pause before typing next word
                timer = setTimeout(() => {
                    setIsDeleting(false);
                    setTextIndex((prev) => (prev + 1) % list.length);
                }, delay);
            }
        }

        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, textIndex, list, speed, eraseSpeed, pauseDelay, delay]);

    return (
        <span className={cn("inline-flex items-center whitespace-nowrap", className)}>
            <span>{displayedText || "\u200B"}</span>
            {cursor && (
                <span
                    aria-hidden="true"
                    className="inline-block w-[2.5px] h-[0.85em] ml-1 bg-primary align-middle rounded-full animate-pulse"
                />
            )}
        </span>
    );
}
