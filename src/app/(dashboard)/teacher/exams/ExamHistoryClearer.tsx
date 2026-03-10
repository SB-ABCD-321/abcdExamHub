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
}

export function ExamHistoryClearer({ examId }: Props) {
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

    return (
        <>
            <DropdownMenuItem
                onClick={(e) => {
                    e.preventDefault(); // prevent dropdown from closing immediately
                    setIsOpen(true);
                }}
                className="cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/50"
            >
                <Trash2 className="w-4 h-4 mr-2" /> Clear History
            </DropdownMenuItem>

            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
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
