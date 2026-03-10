"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Play, Pause, XCircle } from "lucide-react";
import { updateExamStatus } from "./actions";
import { toast } from "sonner";
import { ExamStatus } from "@prisma/client";

interface Props {
    examId: string;
    currentStatus: ExamStatus;
}

export function ExamStatusSwitcher({ examId, currentStatus }: Props) {
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (newStatus: ExamStatus) => {
        setIsLoading(true);
        try {
            const res = await updateExamStatus(examId, newStatus);
            if (res.success) {
                toast.success(`Exam status updated to ${newStatus}`);
            } else {
                toast.error(res.error || "Failed to update status");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {currentStatus !== "ACTIVE" && (
                <DropdownMenuItem
                    disabled={isLoading}
                    onClick={() => handleToggle("ACTIVE")}
                    className="cursor-pointer text-emerald-600 dark:text-emerald-400 focus:text-emerald-700 dark:focus:text-emerald-300"
                >
                    <Play className="w-4 h-4 mr-2" /> Resume / Enable
                </DropdownMenuItem>
            )}

            {currentStatus !== "PAUSED" && (
                <DropdownMenuItem
                    disabled={isLoading}
                    onClick={() => handleToggle("PAUSED")}
                    className="cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-700 dark:focus:text-amber-300"
                >
                    <Pause className="w-4 h-4 mr-2" /> Pause Exam
                </DropdownMenuItem>
            )}

            {currentStatus !== "INACTIVE" && (
                <DropdownMenuItem
                    disabled={isLoading}
                    onClick={() => handleToggle("INACTIVE")}
                    className="cursor-pointer text-slate-600 dark:text-slate-400 focus:text-slate-700 dark:focus:text-slate-300"
                >
                    <XCircle className="w-4 h-4 mr-2" /> Disable Completely
                </DropdownMenuItem>
            )}
        </>
    );
}
