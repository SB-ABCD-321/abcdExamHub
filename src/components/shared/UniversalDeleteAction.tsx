"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { deleteWorkspace, removeTeacherFromWorkspace, removeStudentFromWorkspace, deleteTopic, deleteQuestion, deleteExam, deleteNotice } from "@/actions/crud";

type ActionType = "WORKSPACE" | "TEACHER" | "STUDENT" | "TOPIC" | "QUESTION" | "EXAM" | "NOTICE";

interface UniversalDeleteActionProps {
    id: string; // The ID of the primary entity to delete or remove
    name: string; // The display name for the confirmation dialog
    type: ActionType;
    workspaceId?: string; // Required for TEACHER or STUDENT removals from a specific workspace
    variant?: "icon" | "button";
    className?: string;
}

export function UniversalDeleteAction({ id, name, type, workspaceId, variant = "icon", className }: UniversalDeleteActionProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getTitles = () => {
        switch (type) {
            case "WORKSPACE": return { btn: "Delete Workspace", msg: "This cannot be undone. All exams, results, and staff links inside this workspace will be destroyed." };
            case "TEACHER": return { btn: "Remove Teacher", msg: "This teacher will lose access to your institute's question bank and exams." };
            case "STUDENT": return { btn: "Remove Student", msg: "This student will be kicked from your institute and won't see your notices or exams." };
            case "TOPIC": return { btn: "Delete Topic", msg: "Note: Depending on DB constraints, deleting a topic mapped to questions may fail if cascading deletes aren't configured." };
            case "QUESTION": return { btn: "Delete Question", msg: "This question will be removed permanently from your bank." };
            case "EXAM": return { btn: "Delete Exam", msg: "This will destroy the exam and permanently erase all student results associated with it." };
            case "NOTICE": return { btn: "Delete Notice", msg: "This broadcast announcement will be permanently removed." };
        }
    }

    const handleConfirm = async () => {
        setIsPending(true);
        try {
            let res;
            switch (type) {
                case "WORKSPACE": res = await deleteWorkspace(id); break;
                case "TEACHER": res = await removeTeacherFromWorkspace(id, workspaceId!); break;
                case "STUDENT": res = await removeStudentFromWorkspace(id, workspaceId!); break;
                case "TOPIC": res = await deleteTopic(id); break;
                case "QUESTION": res = await deleteQuestion(id); break;
                case "EXAM": res = await deleteExam(id); break;
                case "NOTICE": res = await deleteNotice(id); break;
            }

            if (res?.error) throw new Error(res.error);
            setIsOpen(false);
            router.refresh();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsPending(false);
        }
    };

    const strings = getTitles();

    return (
        <>
            {variant === "button" ? (
                <Button
                    variant="destructive"
                    className={className || "w-full flex justify-center items-center gap-2 h-9"}
                    onClick={() => setIsOpen(true)}
                >
                    <Trash className="h-4 w-4" />
                    {strings.btn}
                </Button>
            ) : (
                <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    onClick={() => setIsOpen(true)}
                    title={strings.btn}
                >
                    <span className="sr-only">{strings.btn}</span>
                    <Trash className="h-4 w-4" />
                </Button>
            )}

            {mounted && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to target <strong>{name}</strong>?<br /><br />
                                <span className="text-destructive font-medium">{strings.msg}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Cancel</Button>
                            <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
                                {isPending ? "Processing..." : "Confirm"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
