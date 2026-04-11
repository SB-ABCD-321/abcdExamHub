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
    speed = 70,
    delay = 500,
    eraseSpeed = 50,
    pauseDelay = 1500,
    cursor = true,
}: TypingTextProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [textIndex, setTextIndex] = useState(0);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const currentTexts = texts || (text ? [text] : []);
        if (currentTexts.length === 0) return;

        const currentFullText = currentTexts[textIndex];

        const handleTyping = () => {
            if (!isDeleting) {
                // Typing
                if (displayedText.length < currentFullText.length) {
                    setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
                    timeout = setTimeout(handleTyping, speed + Math.random() * 40); // Add slight randomness for "feel"
                } else {
                    // Finished typing one text
                    if (texts && texts.length > 1) {
                        timeout = setTimeout(() => setIsDeleting(true), pauseDelay);
                    }
                }
            } else {
                // Deleting
                if (displayedText.length > 0) {
                    setDisplayedText(currentFullText.slice(0, displayedText.length - 1));
                    timeout = setTimeout(handleTyping, eraseSpeed);
                } else {
                    // Finished deleting, move to next
                    setIsDeleting(false);
                    setTextIndex((prev) => (prev + 1) % currentTexts.length);
                    timeout = setTimeout(handleTyping, speed);
                }
            }
        };

        timeout = setTimeout(handleTyping, displayedText === "" ? delay : 0);

        return () => clearTimeout(timeout);
    }, [displayedText, isDeleting, textIndex, text, texts, speed, eraseSpeed, pauseDelay, delay]);

    return (
        <span className={cn("inline-block", className)} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {displayedText}
            {cursor && (
                <span
                    className="inline-block w-[3px] h-[1.1em] ml-1 bg-primary animate-pulse align-middle"
                    style={{ animationDuration: '0.8s' }}
                />
            )}
        </span>
    );
}
