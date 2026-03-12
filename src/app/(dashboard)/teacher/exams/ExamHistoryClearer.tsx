"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";
import { clearExamHistory } from "./actions";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
    examId: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function ExamHistoryClearer({ examId, open, onOpenChange, trigger }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleClear = async () => {
        setIsLoading(true);
        try {
            const res = await clearExamHistory(examId);
            if (res.success) {
                toast.success("Exam history and participant records cleared.");
                setIsOpen(false);
            } else {
                toast.error(res.error || "Failed to clear history");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const isControlled = open !== undefined;
    const effectiveOpen = isControlled ? open : isOpen;
    const setEffectiveOpen = isControlled ? onOpenChange : setIsOpen;

    return (
        <>
            {trigger && trigger}
            <AlertDialog open={effectiveOpen} onOpenChange={setEffectiveOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all student submissions, scores, and active text sessions (drafts) for this exam.
                            This action cannot be undone. Use this if you want to reuse the exact same exam for a new class.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isLoading}
                            onClick={(e) => {
                                e.preventDefault();
                                handleClear();
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isLoading ? "Deleting..." : "Yes, Delete History"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
