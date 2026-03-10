"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { updateStudentInterests } from "@/app/(dashboard)/student/actions";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const AVAILABLE_INTERESTS = [
    "Government Jobs", "Technical", "Medical", "AI & Tech", "Engineering", "Banking", "Defence", "Management"
];

interface Props {
    currentInterests: string[];
}

export function InterestsSelector({ currentInterests }: Props) {
    const [selected, setSelected] = useState<string[]>(currentInterests || []);
    const [isSaving, setIsSaving] = useState(false);

    const toggleInterest = async (interest: string) => {
        const next = selected.includes(interest)
            ? selected.filter(i => i !== interest)
            : [...selected, interest];

        setSelected(next);
        setIsSaving(true);

        const res = await updateStudentInterests(next);
        setIsSaving(false);

        if (res.success) {
            toast.success("Preferences updated. We'll tune your recommendations!");
        } else {
            toast.error("Failed to update preferences.");
            setSelected(selected); // revert
        }
    };

    return (
        <div className="bg-white dark:bg-[#0c0c0e] border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Personalize Your Mission</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Select your target domains to get specialized exam recommendations.</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {AVAILABLE_INTERESTS.map(interest => {
                    const isSelected = selected.includes(interest);
                    return (
                        <button
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            disabled={isSaving}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${isSelected
                                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"
                                    : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300"
                                }`}
                        >
                            {interest}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
