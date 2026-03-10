"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Settings2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { updateWorkspaceLimitsAction } from "@/actions/crud";

interface EditWorkspaceAiLimitModalProps {
    workspaceId: string;
    workspaceName: string;
    currentLimit: number;
    currentUsage: number;
    isUnlimited: boolean;
    maxTeachers: number;
    maxStudents: number;
    maxExams: number;
}

export function EditWorkspaceAiLimitModal({ workspaceId, workspaceName, currentLimit, currentUsage, isUnlimited, maxTeachers, maxStudents, maxExams }: EditWorkspaceAiLimitModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [limit, setLimit] = useState(currentLimit.toString());
    const [unlimited, setUnlimited] = useState(isUnlimited);
    const [teachersLimit, setTeachersLimit] = useState((maxTeachers ?? 5).toString());
    const [studentsLimit, setStudentsLimit] = useState((maxStudents ?? 100).toString());
    const [examsLimit, setExamsLimit] = useState((maxExams ?? 10).toString());

    const handleSave = async () => {
        const numLimit = parseInt(limit);
        const numTeachers = parseInt(teachersLimit);
        const numStudents = parseInt(studentsLimit);
        const numExams = parseInt(examsLimit);

        if (isNaN(numLimit) || numLimit < 0 || isNaN(numTeachers) || numTeachers < 0 || isNaN(numStudents) || numStudents < 0 || isNaN(numExams) || numExams < 0) {
            toast.error("Please enter valid positive numbers for all limits.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await updateWorkspaceLimitsAction(workspaceId, numLimit, unlimited, numTeachers, numStudents, numExams);
            if (result.success) {
                toast.success("Workspace AI settings updated successfully");
                setOpen(false);
            } else {
                toast.error(result.error || "Failed to update AI settings");
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
                <Button variant="outline" size="sm" className="h-8 gap-2 bg-white hover:bg-amber-50 border-amber-200 text-amber-700 hover:text-amber-800 transition-colors">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Configure AI & Limits</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Workspace Configuration</DialogTitle>
                    <DialogDescription>
                        Manage AI generation limits and capacity limits for "{workspaceName}".
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-0.5">
                            <Label className="text-base font-semibold">Unlimited Access</Label>
                            <p className="text-[12px] text-muted-foreground">Grant unlimited AI generations (ignores limit).</p>
                        </div>
                        <Switch checked={unlimited} onCheckedChange={setUnlimited} />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="limit" className="text-right font-semibold">
                            AI Limit
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="limit"
                                type="number"
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                min="0"
                                disabled={unlimited}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Current Usage: {currentUsage}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxTeachers" className="text-right font-semibold">
                            Max Teachers
                        </Label>
                        <Input
                            id="maxTeachers"
                            type="number"
                            value={teachersLimit}
                            onChange={(e) => setTeachersLimit(e.target.value)}
                            className="col-span-3"
                            min="0"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxStudents" className="text-right font-semibold">
                            Max Students
                        </Label>
                        <Input
                            id="maxStudents"
                            type="number"
                            value={studentsLimit}
                            onChange={(e) => setStudentsLimit(e.target.value)}
                            className="col-span-3"
                            min="0"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxExams" className="text-right font-semibold">
                            Max Exams
                        </Label>
                        <Input
                            id="maxExams"
                            type="number"
                            value={examsLimit}
                            onChange={(e) => setExamsLimit(e.target.value)}
                            className="col-span-3"
                            min="0"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
