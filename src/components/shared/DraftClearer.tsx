"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
    storageKey: string;
    successTrigger: string; // The URL param value to look for, e.g. "created"
}

export function DraftClearer({ storageKey, successTrigger }: Props) {
    const searchParams = useSearchParams();
    
    useEffect(() => {
        if (searchParams.get("success") === successTrigger) {
            // Force remove the draft completely silently
            localStorage.removeItem(storageKey);
            
            // Also dispatch custom event in case any live components like AutoSaveForm are mounted (though unlikely)
            const event = new CustomEvent(`clear-draft-${storageKey}`);
            window.dispatchEvent(event);
        }
    }, [searchParams, storageKey, successTrigger]);

    return null; // Invisible functional component
}
