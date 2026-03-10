"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
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

interface GlobalDeleteButtonProps {
    id: string;
    resourceName: string;
    action: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function GlobalDeleteButton({ id, resourceName, action }: GlobalDeleteButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await action(id);
            if (result.success) {
                toast.success(`${resourceName} deleted successfully`);
            } else {
                toast.error(result.error || `Failed to delete ${resourceName}`);
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/40 group/del">
                    {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                    ) : (
                        <Trash2 className="h-4 w-4 text-slate-400 group-hover/del:text-rose-500 transition-colors" />
                    )}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold tracking-tight">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground font-medium">
                        This action cannot be undone. This will permanently delete the <strong>{resourceName}</strong> from the entire system across all workspaces.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20"
                    >
                        Delete Permanently
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
