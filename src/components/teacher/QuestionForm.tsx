"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    PlusCircle,
    Trash2,
    Save,
    Wifi,
    WifiOff,
    Check,
    RotateCcw,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    FileText,
    Layers,
    Building2,
    ImageIcon,
    Eye,
    EyeOff,
    Sparkles,
    HelpCircle,
    Command
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { QuickCreateTopicModal } from "@/components/workspace/QuickCreateTopicModal";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { cn } from "@/lib/utils";

interface QuestionFormProps {
    topics: { id: string; name: string; workspaceId: string | null; isGlobal?: boolean }[];
    workspaces: { id: string; name: string }[];
    initialData?: any;
    backHref?: string;
}

interface OfflineDraft {
    text: string;
    imageUrl?: string;
    topicId: string;
    workspaceId: string;
    isPublic: boolean;
    options: string[];
    correctAnswerIndex: number;
    savedAt: number;
}

export function QuestionForm({
    topics: initialTopics,
    workspaces,
    initialData,
    backHref = "/teacher/questions"
}: QuestionFormProps) {
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [showPreview, setShowPreview] = useState(false);

    const [topics, setTopics] = useState(initialTopics);
    const [text, setText] = useState(initialData?.text || "");
    const [topicId, setTopicId] = useState(initialData?.topicId || (topics[0]?.id || ""));
    const [workspaceId, setWorkspaceId] = useState(initialData?.workspaceId || (workspaces[0]?.id || ""));
    const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");

    const defaultIndex = initialData && initialData.options ? initialData.options.indexOf(initialData.correctAnswer) : 0;
    const [options, setOptions] = useState<string[]>(initialData?.options || ["", "", "", ""]);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0);

    // Offline draft detection & recovery
    const draftKey = `offline_q_draft_${initialData?.id || "new"}`;
    const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);
    const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
    const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);

    // Custom Alert Dialog for discarding changes
    const [showDiscardAlert, setShowDiscardAlert] = useState(false);

    // Detect Online/Offline status & register background sync
    useEffect(() => {
        setMounted(true);
        setIsOnline(typeof window !== "undefined" ? window.navigator.onLine : true);

        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Network connection restored. Syncing offline drafts...");
            syncPendingOfflineQuestions();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning("Network connection lost. Offline mode active — your work is being saved locally.");
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Check if recoverable draft exists
        try {
            const rawDraft = localStorage.getItem(draftKey);
            if (rawDraft) {
                const parsed: OfflineDraft = JSON.parse(rawDraft);
                // If new question and has text, or edit question with different text
                const textChanged = parsed?.text?.trim() && parsed.text.trim() !== (initialData?.text || "").trim();
                const optionsChanged = parsed?.options?.some((o, i) => o !== initialData?.options?.[i]);
                if (parsed && (textChanged || optionsChanged)) {
                    setHasRecoverableDraft(true);
                    setDraftTimestamp(parsed.savedAt);
                }
            }
        } catch (e) {
            console.error("Error reading draft:", e);
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [draftKey, initialData]);

    // Keyboard shortcut (Ctrl+S / Cmd+S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveQuestionDirectly();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });

    // Auto-save to LocalStorage whenever form fields change (debounced)
    useEffect(() => {
        if (!mounted) return;

        const timer = setTimeout(() => {
            try {
                if (text.trim() || options.some(o => o.trim()) || imageUrl) {
                    const draft: OfflineDraft = {
                        text,
                        imageUrl,
                        topicId,
                        workspaceId,
                        isPublic,
                        options,
                        correctAnswerIndex,
                        savedAt: Date.now()
                    };
                    localStorage.setItem(draftKey, JSON.stringify(draft));
                    setLastAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                }
            } catch (err) {
                console.warn("Auto-save failed to write to local storage", err);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [text, imageUrl, topicId, workspaceId, isPublic, options, correctAnswerIndex, draftKey, mounted]);

    // Background offline queue sync
    const syncPendingOfflineQuestions = useCallback(async () => {
        try {
            const queueKey = "offline_pending_questions_queue";
            const rawQueue = localStorage.getItem(queueKey);
            if (!rawQueue) return;

            const queue: any[] = JSON.parse(rawQueue);
            if (!queue.length) return;

            const remaining: any[] = [];
            let syncedCount = 0;

            for (const item of queue) {
                try {
                    const url = item.id ? `/api/teacher/questions/${item.id}` : "/api/teacher/questions";
                    const method = item.id ? "PUT" : "POST";
                    const res = await fetch(url, {
                        method,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(item.payload)
                    });
                    if (res.ok) {
                        syncedCount++;
                    } else {
                        remaining.push(item);
                    }
                } catch {
                    remaining.push(item);
                }
            }

            if (remaining.length > 0) {
                localStorage.setItem(queueKey, JSON.stringify(remaining));
            } else {
                localStorage.removeItem(queueKey);
            }

            if (syncedCount > 0) {
                toast.success(`${syncedCount} offline question(s) successfully synced to cloud!`);
                router.refresh();
            }
        } catch (e) {
            console.error("Sync error:", e);
        }
    }, [router]);

    // Restore draft from local storage
    const handleRestoreDraft = () => {
        try {
            const rawDraft = localStorage.getItem(draftKey);
            if (!rawDraft) return;
            const parsed: OfflineDraft = JSON.parse(rawDraft);

            if (parsed.text) setText(parsed.text);
            if (parsed.topicId) setTopicId(parsed.topicId);
            if (parsed.workspaceId) setWorkspaceId(parsed.workspaceId);
            if (typeof parsed.isPublic === "boolean") setIsPublic(parsed.isPublic);
            if (parsed.imageUrl !== undefined) setImageUrl(parsed.imageUrl);
            if (Array.isArray(parsed.options)) setOptions(parsed.options);
            if (typeof parsed.correctAnswerIndex === "number") setCorrectAnswerIndex(parsed.correctAnswerIndex);

            setHasRecoverableDraft(false);
            toast.success("Draft successfully restored from local storage!");
        } catch (e) {
            toast.error("Failed to restore draft");
        }
    };

    // Discard draft
    const handleDiscardDraft = () => {
        localStorage.removeItem(draftKey);
        setHasRecoverableDraft(false);
        toast.info("Offline draft discarded.");
    };

    const updateOption = (index: number, val: string) => {
        const newOps = [...options];
        newOps[index] = val;
        setOptions(newOps);
    };

    const addOption = () => {
        if (options.length >= 6) {
            toast.info("Maximum 6 choices allowed per question.");
            return;
        }
        setOptions([...options, ""]);
        toast.success(`Option ${String.fromCharCode(65 + options.length)} added`);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) {
            toast.error("A question must have at least 2 choices.");
            return;
        }
        const newOps = options.filter((_, i) => i !== index);
        setOptions(newOps);
        if (correctAnswerIndex >= index) {
            setCorrectAnswerIndex(Math.max(0, correctAnswerIndex - 1));
        }
        toast.info("Option removed");
    };

    // Core save function
    const saveQuestionDirectly = async () => {
        if (text.trim().length < 5) {
            toast.error("Question statement must be at least 5 characters.");
            return;
        }

        if (options.some(o => !o.trim())) {
            toast.error("All option choices must have text before saving.");
            return;
        }

        if (options.length < 2) {
            toast.error("Please add at least 2 options.");
            return;
        }

        const chosenCorrectAnswer = options[correctAnswerIndex];
        if (!chosenCorrectAnswer?.trim()) {
            toast.error("Please select a valid option as the correct answer.");
            return;
        }

        setLoading(true);

        const payload = {
            text: text.trim(),
            imageUrl: imageUrl || null,
            topicId,
            workspaceId,
            isPublic,
            options: options.map(o => o.trim()),
            correctAnswer: chosenCorrectAnswer.trim()
        };

        // If offline: save directly to offline sync queue
        if (!isOnline || (typeof window !== "undefined" && !window.navigator.onLine)) {
            try {
                const queueKey = "offline_pending_questions_queue";
                const currentQueue: any[] = JSON.parse(localStorage.getItem(queueKey) || "[]");
                currentQueue.push({
                    id: initialData?.id || null,
                    payload,
                    timestamp: Date.now()
                });
                localStorage.setItem(queueKey, JSON.stringify(currentQueue));
                localStorage.removeItem(draftKey);

                toast.warning("Saved in Offline Storage! Your question will be synced to the cloud once you are back online.");
                setLoading(false);
                router.push(backHref);
                return;
            } catch (err: any) {
                toast.error("Failed to save to local offline queue: " + err.message);
                setLoading(false);
                return;
            }
        }

        try {
            const url = initialData ? `/api/teacher/questions/${initialData.id}` : "/api/teacher/questions";
            const method = initialData ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const txt = await response.text();
                throw new Error(txt || (initialData ? "Failed to update question" : "Failed to create question"));
            }

            // Remove draft from local storage upon successful cloud write
            localStorage.removeItem(draftKey);

            toast.success(initialData ? "Question updated successfully!" : "Question saved to Question Bank!");
            router.push(backHref);
            router.refresh();
        } catch (err: any) {
            // Network fallback: if fetch failed due to connectivity drop
            if (err.name === "TypeError" && err.message?.includes("fetch")) {
                const queueKey = "offline_pending_questions_queue";
                const currentQueue: any[] = JSON.parse(localStorage.getItem(queueKey) || "[]");
                currentQueue.push({
                    id: initialData?.id || null,
                    payload,
                    timestamp: Date.now()
                });
                localStorage.setItem(queueKey, JSON.stringify(currentQueue));
                localStorage.removeItem(draftKey);

                toast.warning("Connection dropped: Question preserved in offline queue. Will auto-sync when online.");
                router.push(backHref);
            } else {
                toast.error(err.message || "An error occurred while saving the question");
            }
        } finally {
            setLoading(false);
        }
    };

    const hasModifications = text.trim() !== (initialData?.text || "").trim() || options.some((o, i) => o !== (initialData?.options?.[i] || ""));

    const handleCancelClick = () => {
        if (hasModifications) {
            setShowDiscardAlert(true);
        } else {
            router.push(backHref);
        }
    };

    const confirmDiscard = () => {
        localStorage.removeItem(draftKey);
        setShowDiscardAlert(false);
        router.push(backHref);
    };

    if (!mounted) return null;

    const selectedTopic = topics.find(t => t.id === topicId);
    const selectedWorkspace = workspaces.find(w => w.id === workspaceId);

    return (
        <form onSubmit={(e) => { e.preventDefault(); saveQuestionDirectly(); }} className="space-y-6">
            {/* SLEEK TELEMETRY & AUTO-SAVE STATUS STRIP */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-5 sm:py-3 rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs">
                {/* Left: Network Status */}
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                        isOnline 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse"
                    )}>
                        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                                {isOnline ? "Cloud Sync Ready" : "Offline Mode Active"}
                            </span>
                            <span className={cn(
                                "text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                isOnline 
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            )}>
                                {isOnline ? "Online" : "Local First"}
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Check className="w-3 h-3 text-emerald-500" />
                            {lastAutoSaveTime ? `Auto-saved locally at ${lastAutoSaveTime}` : "Realtime offline caching enabled"}
                        </p>
                    </div>
                </div>

                {/* Right: Quick Tools (Preview Toggle & Shortcut Hint) */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="hidden md:flex items-center gap-1 text-[10.5px] text-muted-foreground/80 bg-muted/40 px-2.5 py-1 rounded-lg border border-border/50">
                        <Command className="w-3 h-3" />
                        <span>S to Quick Save</span>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className={cn(
                            "h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 border-border/70 transition-all",
                            showPreview ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPreview ? "Hide Preview" : "Candidate Preview"}</span>
                    </Button>
                </div>
            </div>

            {/* RECOVERABLE DRAFT BANNER */}
            {hasRecoverableDraft && (
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                            <h4 className="text-xs font-bold text-foreground">Unsaved Offline Draft Found</h4>
                            <p className="text-[11px] text-muted-foreground">
                                A local draft from {draftTimestamp ? new Date(draftTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "earlier"} was recovered on this device.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleDiscardDraft}
                            className="h-8 px-3 rounded-xl text-xs font-bold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                        >
                            Discard
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleRestoreDraft}
                            className="h-8 px-3.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            Restore Draft
                        </Button>
                    </div>
                </div>
            )}

            {/* LIVE CANDIDATE SIMULATION PREVIEW (IF TOGGLED) */}
            {showPreview && (
                <Card className="border-2 border-primary/30 bg-primary/5 backdrop-blur-xl rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-primary">Candidate Exam Preview</h3>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground">
                            {selectedTopic?.name || "General Topic"} • 1 Mark
                        </span>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                            {text.trim() || <span className="text-muted-foreground italic">Your question prompt will appear here...</span>}
                        </p>

                        {imageUrl && (
                            <div className="max-w-md rounded-xl overflow-hidden border border-border/60 bg-background/50 p-1">
                                <img src={imageUrl} alt="Diagram Preview" className="w-full max-h-60 object-contain rounded-lg" />
                            </div>
                        )}

                        <div className="grid gap-2 pt-1">
                            {options.map((opt, i) => {
                                const letter = String.fromCharCode(65 + i);
                                const isCorrect = correctAnswerIndex === i;
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all",
                                            isCorrect 
                                                ? "bg-emerald-500/15 border-emerald-500/50 text-foreground" 
                                                : "bg-background/80 border-border/70 text-foreground"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                                            isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                                        )}>
                                            {letter}
                                        </div>
                                        <span className="flex-1">{opt || <span className="text-muted-foreground italic">Choice {letter}...</span>}</span>
                                        {isCorrect && (
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                Correct Answer
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            )}

            {/* PRIMARY AUTHORING CARD */}
            <Card className="border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs rounded-2xl overflow-hidden">
                <CardContent className="p-5 sm:p-7 space-y-6">
                    {/* Chapter & Workspace Selector */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-primary" />
                                <span>Subject Chapter</span>
                            </Label>
                            <div className="flex gap-2">
                                <Select value={topicId} onValueChange={setTopicId} required>
                                    <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs font-semibold">
                                        <SelectValue placeholder="Select a chapter" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {topics.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name} {t.isGlobal ? "(Platform Global)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <QuickCreateTopicModal
                                    workspaceId={workspaceId}
                                    onTopicCreated={(newTopic: any) => {
                                        setTopics(prev => [...prev, { ...newTopic, workspaceId, isGlobal: false }]);
                                        setTopicId(newTopic.id);
                                        toast.success(`Chapter "${newTopic.name}" created`);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-primary" />
                                <span>Owning Workspace</span>
                            </Label>
                            <Select value={workspaceId} onValueChange={setWorkspaceId} required disabled={workspaces.length === 1}>
                                <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs font-semibold">
                                    <SelectValue placeholder="Select workspace" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {workspaces.map(w => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Question Statement */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-primary" />
                                <span>Question Statement</span>
                            </Label>
                            <span className="text-[10.5px] font-bold text-muted-foreground tabular-nums">
                                {text.length} Characters
                            </span>
                        </div>
                        <Textarea
                            placeholder="Type the question prompt or problem statement clearly..."
                            className="min-h-[120px] text-sm sm:text-base rounded-xl border-border/60 bg-muted/20 focus-visible:bg-card leading-relaxed resize-y font-medium"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            required
                        />
                    </div>

                    {/* Visual Diagram Context */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                            <span>Visual Diagram / Illustration (Optional)</span>
                        </Label>
                        <ImageUpload
                            value={imageUrl}
                            onChange={(url) => {
                                setImageUrl(url);
                                toast.success("Diagram attached to question");
                            }}
                            onRemove={() => {
                                setImageUrl("");
                                toast.info("Diagram removed");
                            }}
                        />
                    </div>

                    {/* Multiple Choice Options */}
                    <div className="space-y-3 pt-2 border-t border-border/40">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Answer Options ({options.length})
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                    Click any option letter to mark it as the correct answer.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOption}
                                disabled={options.length >= 6}
                                className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-border/60"
                            >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Add Choice</span>
                            </Button>
                        </div>

                        <div className="space-y-2.5">
                            {options.map((opt, i) => {
                                const letter = String.fromCharCode(65 + i);
                                const isCorrect = correctAnswerIndex === i;

                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border transition-all group",
                                            isCorrect
                                                ? "bg-emerald-500/10 border-emerald-500/40 shadow-xs"
                                                : "bg-muted/20 border-border/60 hover:border-border"
                                        )}
                                    >
                                        {/* Correct Radio Button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCorrectAnswerIndex(i);
                                                toast.success(`Option ${letter} marked as the correct answer`);
                                            }}
                                            className={cn(
                                                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-all cursor-pointer",
                                                isCorrect
                                                    ? "bg-emerald-500 text-white shadow-xs"
                                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                            )}
                                            title={`Click to set Option ${letter} as correct answer`}
                                        >
                                            {letter}
                                        </button>

                                        <Input
                                            placeholder={`Option ${letter} choice text...`}
                                            value={opt}
                                            onChange={e => updateOption(i, e.target.value)}
                                            required
                                            className="h-10 rounded-xl border-border/60 bg-background/60 text-xs sm:text-sm font-medium flex-1 focus-visible:bg-background"
                                        />

                                        {isCorrect && (
                                            <span className="hidden sm:inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Correct</span>
                                            </span>
                                        )}

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={options.length <= 2}
                                            onClick={() => removeOption(i)}
                                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                                            title="Delete Option"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Scope & Public Switch */}
                    <div className="flex items-center gap-3 pt-3 border-t border-border/40">
                        <Checkbox
                            id="isPublic"
                            checked={isPublic}
                            onCheckedChange={(c) => setIsPublic(c as boolean)}
                            className="rounded-md"
                        />
                        <div className="grid gap-0.5 leading-none">
                            <Label htmlFor="isPublic" className="text-xs font-bold text-foreground cursor-pointer">
                                Share as Public Curriculum Asset
                            </Label>
                            <p className="text-[11px] text-muted-foreground">
                                Allows faculty across other institutional clusters to include this question in global mock exams.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* BOTTOM ACTION BAR */}
            <div className="flex items-center justify-between pt-2">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelClick}
                    disabled={loading}
                    className="h-10 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                    Cancel & Return
                </Button>

                <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-7 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-2"
                >
                    <Save className="w-4 h-4" />
                    <span>{loading ? "Saving to Bank..." : initialData ? "Update Question" : "Save Question"}</span>
                </Button>
            </div>

            {/* CUSTOM ALERT DIALOG FOR DISCARD CONFIRMATION */}
            <Dialog open={showDiscardAlert} onOpenChange={setShowDiscardAlert}>
                <DialogContent className="max-w-md rounded-2xl p-6 bg-card border-border/80">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-2">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Discard Unsaved Question Changes?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            You have modified this question. If you discard now, any unsubmitted changes will be cleared from this device.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowDiscardAlert(false)}
                            className="rounded-xl text-xs font-bold"
                        >
                            Keep Editing
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDiscard}
                            className="rounded-xl text-xs font-bold"
                        >
                            Discard & Leave
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </form>
    );
}
