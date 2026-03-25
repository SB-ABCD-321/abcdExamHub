"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
    Settings2, Loader2, CheckCircle2, PauseCircle, XCircle,
    Trash2, DatabaseBackup, BadgeAlert, Sparkles, Users, GraduationCap,
    ClipboardList, FileQuestion, Zap
} from "lucide-react";
import { toast } from "sonner";
import {
    setWorkspaceStatusAction,
    clearWorkspaceResultsAction,
    clearWorkspaceDataAction,
    updateWorkspaceLimitsAction,
    deleteWorkspace
} from "@/actions/crud";
import { cn } from "@/lib/utils";

interface WorkspaceControlPanelProps {
    workspaceId: string;
    workspaceName: string;
    currentStatus: "ACTIVE" | "PAUSED" | "SUSPENDED";
    aiLimit: number;
    aiUsage: number;
    isUnlimited: boolean;
    maxTeachers: number;
    maxStudents: number;
    maxExams: number;
    maxQuestions: number;
    maxConcurrentExams?: number;
    trialExpiresAt?: string;
}

const STATUS_CONFIG = {
    ACTIVE: { label: "Active", color: "bg-emerald-500", icon: CheckCircle2, description: "Workspace is fully operational" },
    PAUSED: { label: "Paused", color: "bg-amber-500", icon: PauseCircle, description: "New activity is restricted but data remains" },
    SUSPENDED: { label: "Suspended", color: "bg-rose-500", icon: XCircle, description: "Workspace is locked — no access for any users" },
};

export function WorkspaceControlPanel({
    workspaceId, workspaceName, currentStatus,
    aiLimit, aiUsage, isUnlimited,
    maxTeachers, maxStudents, maxExams, maxQuestions,
    maxConcurrentExams, trialExpiresAt
}: WorkspaceControlPanelProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);

    // Capacity state
    const [teachers, setTeachers] = useState(maxTeachers.toString());
    const [students, setStudents] = useState(maxStudents.toString());
    const [exams, setExams] = useState(maxExams.toString());
    const [questions, setQuestions] = useState(maxQuestions.toString());
    const [concurrentExams, setConcurrentExams] = useState(maxConcurrentExams?.toString() || "100");
    const [trialDate, setTrialDate] = useState(trialExpiresAt ? trialExpiresAt.slice(0, 16) : "");
    const [aiLimitVal, setAiLimitVal] = useState(aiLimit.toString());
    const [unlimited, setUnlimited] = useState(isUnlimited);
    const [status, setStatus] = useState<"ACTIVE" | "PAUSED" | "SUSPENDED">(currentStatus);

    const run = async (key: string, fn: () => Promise<{ success?: boolean; error?: string }>) => {
        setLoading(key);
        try {
            const res = await fn();
            if (res.success) toast.success("Done!");
            else toast.error(res.error || "Something went wrong");
        } catch { toast.error("Unexpected error"); }
        finally { setLoading(null); }
    };

    const handleStatusChange = (newStatus: "ACTIVE" | "PAUSED" | "SUSPENDED") => {
        run("status", async () => {
            const res = await setWorkspaceStatusAction(workspaceId, newStatus);
            if (res.success) setStatus(newStatus);
            return res;
        });
    };

    const handleSaveCapacity = () => {
        run("capacity", () => updateWorkspaceLimitsAction(
            workspaceId,
            parseInt(aiLimitVal) || 0,
            unlimited,
            parseInt(teachers) || 0,
            parseInt(students) || 0,
            parseInt(exams) || 0,
            parseInt(questions) || 0,
            parseInt(concurrentExams) || 100,
            trialDate ? new Date(trialDate) : null
        ));
    };

    const StatusIcon = STATUS_CONFIG[status].icon;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider"
                >
                    <Settings2 className="w-3.5 h-3.5" />
                    Manage
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", STATUS_CONFIG[status].color)} />
                        {workspaceName}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Full administrative control over this workspace.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Status Control */}
                    <section className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b pb-2">
                            Workspace Status
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {(["ACTIVE", "PAUSED", "SUSPENDED"] as const).map((s) => {
                                const cfg = STATUS_CONFIG[s];
                                const Icon = cfg.icon;
                                const isSelected = status === s;
                                return (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        disabled={loading === "status" || isSelected}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-center",
                                            isSelected
                                                ? `border-transparent ${s === "ACTIVE" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" : s === "PAUSED" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600" : "bg-rose-50 dark:bg-rose-950/30 text-rose-600"}`
                                                : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-500"
                                        )}
                                    >
                                        {loading === "status" && isSelected
                                            ? <Loader2 className="w-5 h-5 animate-spin" />
                                            : <Icon className="w-5 h-5" />
                                        }
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest">{cfg.label}</p>
                                            <p className="text-[9px] font-medium opacity-70 mt-0.5 leading-tight hidden sm:block">{cfg.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Capacity Controls */}
                    <section className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b pb-2">
                            Capacity Limits
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Max Teachers", value: teachers, setter: setTeachers, icon: Users, color: "text-indigo-500" },
                                { label: "Max Students", value: students, setter: setStudents, icon: GraduationCap, color: "text-emerald-500" },
                                { label: "Max Exams", value: exams, setter: setExams, icon: ClipboardList, color: "text-amber-500" },
                                { label: "Max Questions", value: questions, setter: setQuestions, icon: FileQuestion, color: "text-violet-500" },
                                { label: "Concurrent Exams", value: concurrentExams, setter: setConcurrentExams, icon: Zap, color: "text-blue-500" },
                            ].map(({ label, value, setter, icon: Icon, color }) => (
                                <div key={label} className="space-y-1.5">
                                    <Label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5", color)}>
                                        <Icon className="w-3.5 h-3.5" /> {label}
                                    </Label>
                                    <Input
                                        type="number"
                                        value={value}
                                        onChange={e => setter(e.target.value)}
                                        min="0"
                                        className="h-10 rounded-xl text-sm font-bold"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Trial Setting */}
                        <div className="space-y-1.5 pt-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Trial Expiration Date
                            </Label>
                            <Input
                                type="datetime-local"
                                value={trialDate}
                                onChange={e => setTrialDate(e.target.value)}
                                className="h-10 rounded-xl text-sm font-bold w-full"
                            />
                            <p className="text-[10px] text-muted-foreground opacity-80">Clear this to grant lifetime access to the workspace without trial limitations.</p>
                        </div>

                        {/* AI Limits */}
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" /> AI Generation Limit
                                </Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-amber-600">Unlimited</span>
                                    <Switch checked={unlimited} onCheckedChange={setUnlimited} />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    value={aiLimitVal}
                                    onChange={e => setAiLimitVal(e.target.value)}
                                    min="0"
                                    disabled={unlimited}
                                    className="h-10 rounded-xl text-sm font-bold flex-1"
                                />
                                <p className="text-[10px] text-amber-600/80 font-medium whitespace-nowrap">Used: {aiUsage}</p>
                            </div>
                        </div>

                        <Button
                            onClick={handleSaveCapacity}
                            disabled={loading === "capacity"}
                            className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-[10px]"
                        >
                            {loading === "capacity" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                            Save Capacity Settings
                        </Button>
                    </section>

                    {/* Danger Zone */}
                    <section className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400 border-b border-rose-200 dark:border-rose-800/40 pb-2 flex items-center gap-1.5">
                            <BadgeAlert className="w-3.5 h-3.5" /> Danger Zone
                        </h3>
                        <div className="grid gap-2">
                            {/* Clear Results */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="w-full h-11 rounded-xl border-rose-200 dark:border-rose-800/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs justify-start gap-2">
                                        <DatabaseBackup className="w-4 h-4" />
                                        Clear All Exam Results & History
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear All Results?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete all student exam results, submissions, and drafts for <strong>{workspaceName}</strong>. The exams themselves remain intact. This cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                                            onClick={() => run("results", () => clearWorkspaceResultsAction(workspaceId))}
                                        >
                                            {loading === "results" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Yes, Clear Results
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Clear All Data */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="w-full h-11 rounded-xl border-rose-300 dark:border-rose-800/60 text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/30 font-bold text-xs justify-start gap-2">
                                        <Trash2 className="w-4 h-4" />
                                        Clear All Content (Exams, Questions, Topics)
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear All Workspace Content?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete <strong>all exams, questions, and topics</strong> for <strong>{workspaceName}</strong>, including all associated results. The workspace and its users will remain. This cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                                            onClick={() => run("data", () => clearWorkspaceDataAction(workspaceId))}
                                        >
                                            {loading === "data" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Yes, Clear Everything
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Delete Workspace */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] justify-start gap-2 shadow-lg shadow-rose-500/20">
                                        <XCircle className="w-4 h-4" />
                                        Delete Workspace Permanently
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-rose-600">Delete &quot;{workspaceName}&quot;?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will <strong>permanently and irreversibly</strong> delete the entire workspace including all users, exams, questions, results, and topics. The admin will be demoted to Student. There is <strong>no recovery</strong>.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                                            onClick={() => run("delete", async () => {
                                                const res = await deleteWorkspace(workspaceId);
                                                if (res.success) setOpen(false);
                                                return res;
                                            })}
                                        >
                                            {loading === "delete" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Delete Forever
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}
