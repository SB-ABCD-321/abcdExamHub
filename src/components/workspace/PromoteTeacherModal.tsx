"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowUpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { promoteStudentToTeacherAction } from "@/app/(dashboard)/admin/students/actions";

interface PromoteModalProps {
    studentId: string;
    studentName: string;
    studentEmail: string;
    workspaceId: string;
}

export function PromoteTeacherModal({ studentId, studentName, studentEmail, workspaceId }: PromoteModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handlePromote = async () => {
        setIsLoading(true);
        const toastId = toast.loading(`Promoting ${studentName}...`);

        try {
            const result = await promoteStudentToTeacherAction(studentId, workspaceId);

            if (result.success) {
                toast.success(`${studentName} is now a Teacher!`, { id: toastId });
                setOpen(false);
            } else {
                toast.error(result.error || "Failed to promote student.", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) {
        return (
            <Button variant="outline" size="sm" className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200">
                <ArrowUpCircle className="h-4 w-4" />
                Promote to Teacher
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200">
                    <ArrowUpCircle className="h-4 w-4" />
                    Promote to Teacher
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowUpCircle className="h-5 w-5 text-indigo-600" />
                        Promote Student
                    </DialogTitle>
                    <DialogDescription>
                        You are about to promote <strong>{studentName} ({studentEmail})</strong> from Student to Teacher.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 text-sm text-muted-foreground">
                    This action will immediately grant them access to the Teacher Dashboard. They will be able to create questions, build mock tests, and review student grades for this workspace.
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePromote}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Promoting...
                            </>
                        ) : (
                            "Confirm Promotion"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
