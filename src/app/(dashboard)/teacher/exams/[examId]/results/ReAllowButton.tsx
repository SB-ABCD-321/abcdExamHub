"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2 } from "lucide-react";
import { reAllowStudent } from "./actions";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
    resultId: string;
    examId: string;
    studentName: string;
}

export function ReAllowButton({ resultId, examId, studentName }: Props) {
    const [isLoading, setIsLoading] = useState(false);

    const handleReAllow = async () => {
        setIsLoading(true);
        const result = await reAllowStudent(resultId, examId);
        if (result.success) {
            toast.success(`${studentName} has been re-allowed to retake this exam.`);
        } else {
            toast.error(result.error || "Failed to re-allow student.");
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg gap-1.5"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Re-allow
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-bold">Re-allow {studentName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will delete <strong>{studentName}&apos;s</strong> current exam result and allow them to retake the exam. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleReAllow}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                        disabled={isLoading}
                    >
                        {isLoading ? "Processing..." : "Yes, Re-allow"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
