"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { updateTopicAction } from "@/app/(dashboard)/teacher/topics/actions";

interface Props {
    topicId: string;
    currentName: string;
}

export function TopicRenameDialog({ topicId, currentName }: Props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(currentName);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        if (!name.trim()) return toast.error("Chapter name cannot be empty");
        if (name === currentName) return setOpen(false);

        setIsSaving(true);
        try {
            const res = await updateTopicAction(topicId, name);
            if (!res.success) {
                toast.error(res.error);
                return;
            }
            toast.success("Chapter renamed successfully");
            setOpen(false);
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div
                    role="button"
                    tabIndex={0}
                    className="inline-flex shrink-0 items-center justify-center gap-2 h-8 w-8 ml-2 text-inherit opacity-50 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all cursor-pointer"
                    title="Rename Chapter"
                    onClick={(e) => {
                        e.stopPropagation(); // prevent accordion toggle
                    }}
                >
                    <Edit2 className="h-4 w-4" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl dark:bg-zinc-900 border-indigo-100 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">Rename Chapter</DialogTitle>
                    <DialogDescription>
                        Update the title of this curriculum chapter.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">New Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
                            }}
                            className="h-11 font-medium"
                            placeholder="e.g., Advanced Calculus"
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
