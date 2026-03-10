"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateTeacherAiLimitAction } from "@/actions/admin";

interface EditTeacherAiLimitModalProps {
    workspaceId: string;
    teacherId: string;
    teacherName: string;
    currentLimit: number;
    currentUsage: number;
}

export function EditTeacherAiLimitModal({ workspaceId, teacherId, teacherName, currentLimit, currentUsage }: EditTeacherAiLimitModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [limit, setLimit] = useState(currentLimit.toString());

    const handleSave = async () => {
        const numLimit = parseInt(limit);
        if (isNaN(numLimit) || numLimit < 0) {
            toast.error("Please enter a valid positive number");
            return;
        }

        setIsLoading(true);
        try {
            const result = await updateTeacherAiLimitAction(workspaceId, teacherId, numLimit);
            if (result.success) {
                toast.success("AI limit updated successfully");
                setOpen(false);
            } else {
                toast.error(result.error || "Failed to update limit");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 bg-white hover:bg-slate-50 border-slate-200">
                    <Settings2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">AI Access</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>AI Generation Limits</DialogTitle>
                    <DialogDescription>
                        Manage AI access for {teacherName}. They have currently used {currentUsage} generations.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="limit" className="text-right">
                            Limit
                        </Label>
                        <Input
                            id="limit"
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            className="col-span-3"
                            min="0"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
