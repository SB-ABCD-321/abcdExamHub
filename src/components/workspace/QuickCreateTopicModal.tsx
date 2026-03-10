"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTopicAction } from "@/app/(dashboard)/teacher/topics/actions";

interface QuickCreateTopicModalProps {
    workspaceId: string;
    onTopicCreated?: (topic: { id: string; name: string }) => void;
}

export function QuickCreateTopicModal({ workspaceId, onTopicCreated }: QuickCreateTopicModalProps) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Topic name cannot be empty.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await createTopicAction(name.trim(), workspaceId);

            if (result.success && result.topic) {
                toast.success(`Topic "${name}" created successfully!`);
                if (onTopicCreated) {
                    onTopicCreated(result.topic);
                }
                setName("");
                setOpen(false);
            } else {
                toast.error(result.error || "Failed to create topic.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) {
        return (
            <Button type="button" variant="outline" size="sm" className="gap-1 h-10 px-3 shrink-0">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">New Topic</span>
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1 h-10 px-3 shrink-0">
                    <PlusCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">New Topic</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Topic</DialogTitle>
                    <DialogDescription>
                        Quickly add a new category to group your questions without leaving this page.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Topic Name</Label>
                        <Input
                            id="name"
                            placeholder="E.g., Quantum Physics Module 1"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleCreate();
                                }
                            }}
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isLoading || !name.trim()}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Customizing...
                            </>
                        ) : (
                            "Create Topic"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
