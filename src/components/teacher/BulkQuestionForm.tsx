"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    PlusCircle,
    Trash2,
    Save,
    FileText,
    AlertCircle,
    Copy,
    Download,
    Upload,
    Sparkles,
    CheckCircle2,
    RotateCcw,
    Layers,
    Building2,
    Check,
    HelpCircle,
    Wifi,
    WifiOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { QuickCreateTopicModal } from "@/components/workspace/QuickCreateTopicModal";
import { cn } from "@/lib/utils";

interface BulkQuestionFormProps {
    topics: { id: string; name: string; workspaceId: string | null; isGlobal?: boolean }[];
    workspaces: { id: string; name: string }[];
}

interface QuestionItem {
    id: string;
    text: string;
    options: string[];
    correctAnswerIndex: number;
}

export function BulkQuestionForm({ topics: initialTopics, workspaces }: BulkQuestionFormProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    const [topics, setTopics] = useState(initialTopics);
    const [topicId, setTopicId] = useState(topics[0]?.id || "");
    const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id || "");
    const [isPublic, setIsPublic] = useState(false);

    const [activeSubTab, setActiveSubTab] = useState<"builder" | "paste">("builder");
    const [rawText, setRawText] = useState("");

    const [questions, setQuestions] = useState<QuestionItem[]>([
        { id: "q-1", text: "", options: ["", "", "", ""], correctAnswerIndex: 0 }
    ]);

    const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);
    const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);

    const DRAFT_KEY = "offline_bulk_questions_draft_v2";

    // Setup network telemetry and initial draft recovery
    useEffect(() => {
        setMounted(true);
        setIsOnline(typeof window !== "undefined" ? window.navigator.onLine : true);

        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Network restored. Offline drafts ready to sync.");
        };
        const handleOffline = () => {
            setIsOnline(false);
            toast.warning("Network connection lost. Offline draft caching active.");
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Check for offline draft
        try {
            const rawDraft = localStorage.getItem(DRAFT_KEY);
            if (rawDraft) {
                const parsed = JSON.parse(rawDraft);
                if (parsed?.questions?.length > 0 && (parsed.questions[0].text || parsed.questions.length > 1)) {
                    setHasRecoverableDraft(true);
                }
            }
        } catch (e) {
            console.error("Failed to read bulk draft", e);
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Debounced draft auto-save
    useEffect(() => {
        if (!mounted) return;

        const timer = setTimeout(() => {
            try {
                const hasContent = questions.some(q => q.text.trim() || q.options.some(o => o.trim()));
                if (hasContent) {
                    const draftData = {
                        topicId,
                        workspaceId,
                        isPublic,
                        questions,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
                    setLastAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                }
            } catch (err) {
                console.warn("Bulk draft autosave failed:", err);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [questions, topicId, workspaceId, isPublic, mounted]);

    const restoreDraft = () => {
        try {
            const rawDraft = localStorage.getItem(DRAFT_KEY);
            if (!rawDraft) return;
            const parsed = JSON.parse(rawDraft);
            if (parsed.questions) setQuestions(parsed.questions);
            if (parsed.topicId && topics.some(t => t.id === parsed.topicId)) setTopicId(parsed.topicId);
            if (parsed.workspaceId && workspaces.some(w => w.id === parsed.workspaceId)) setWorkspaceId(parsed.workspaceId);
            if (parsed.isPublic !== undefined) setIsPublic(parsed.isPublic);
            setHasRecoverableDraft(false);
            toast.success("Bulk draft restored successfully!");
        } catch (e) {
            toast.error("Failed to restore draft.");
        }
    };

    const discardDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setHasRecoverableDraft(false);
        setQuestions([{ id: "q-1", text: "", options: ["", "", "", ""], correctAnswerIndex: 0 }]);
        toast.info("Offline bulk draft discarded.");
    };

    // Card question modification handlers
    const updateQuestionText = (index: number, text: string) => {
        const next = [...questions];
        next[index].text = text;
        setQuestions(next);
    };

    const updateOption = (qIndex: number, oIndex: number, val: string) => {
        const next = [...questions];
        next[qIndex].options[oIndex] = val;
        setQuestions(next);
    };

    const setCorrectAnswer = (qIndex: number, oIndex: number) => {
        const next = [...questions];
        next[qIndex].correctAnswerIndex = oIndex;
        setQuestions(next);
    };

    const addQuestion = () => {
        setQuestions(prev => [
            ...prev,
            { id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, text: "", options: ["", "", "", ""], correctAnswerIndex: 0 }
        ]);
    };

    const duplicateQuestion = (index: number) => {
        const target = questions[index];
        const copy: QuestionItem = {
            id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            text: target.text ? `${target.text} (Copy)` : "",
            options: [...target.options],
            correctAnswerIndex: target.correctAnswerIndex
        };
        const next = [...questions];
        next.splice(index + 1, 0, copy);
        setQuestions(next);
        toast.success(`Question #${index + 1} duplicated`);
    };

    const removeQuestion = (index: number) => {
        if (questions.length <= 1) {
            toast.info("At least one question is required.");
            return;
        }
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const addOption = (qIndex: number) => {
        if (questions[qIndex].options.length >= 6) {
            toast.info("Maximum 6 options per question.");
            return;
        }
        const next = [...questions];
        next[qIndex].options.push("");
        setQuestions(next);
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        if (questions[qIndex].options.length <= 2) {
            toast.error("A question must have at least 2 choices.");
            return;
        }
        const next = [...questions];
        next[qIndex].options = next[qIndex].options.filter((_, i) => i !== oIndex);
        if (next[qIndex].correctAnswerIndex >= oIndex) {
            next[qIndex].correctAnswerIndex = Math.max(0, next[qIndex].correctAnswerIndex - 1);
        }
        setQuestions(next);
    };

    // SMART PASTE TEXT PARSER
    const parseRawText = () => {
        if (!rawText.trim()) {
            toast.error("Please paste text before parsing.");
            return;
        }

        try {
            // Split by blocks (separated by blank lines or numbers like "1. ", "Q1:", etc.)
            const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            const parsedList: QuestionItem[] = [];

            let currentQ: Partial<QuestionItem> | null = null;
            let currentOptions: string[] = [];
            let currentCorrectIndex = 0;

            const commitCurrent = () => {
                if (currentQ?.text && currentOptions.length >= 2) {
                    parsedList.push({
                        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        text: currentQ.text,
                        options: currentOptions.length === 2 ? [...currentOptions, "", ""] : currentOptions,
                        correctAnswerIndex: currentCorrectIndex
                    });
                }
            };

            for (const line of lines) {
                // Check if this is a question line (e.g., "1. What is...", "Q1: What is...", "Question 1: ...")
                const qMatch = line.match(/^(?:(?:\d+[\.\)]|Q\d*[:\.\)]|Question\s*\d*[:\.\)])\s*)(.+)/i);
                // Check if this is an option line (e.g., "A) Choice", "a. Choice", "(A) Choice", "1) Choice")
                const optMatch = line.match(/^(?:\(?([A-Fa-f1-6])[\.\)]\s*)(.+)/);
                // Check if this is an answer indicator (e.g., "Ans: A", "Answer: B", "Correct: Option A")
                const ansMatch = line.match(/^(?:(?:Ans(?:wer)?|Correct(?:\s*Answer)?)\s*[:=-]?\s*)([A-Fa-f1-6]|.+)/i);

                if (ansMatch && currentQ) {
                    const ansRaw = ansMatch[1].trim().toUpperCase();
                    // Match letter A-F
                    if (ansRaw.length === 1 && ansRaw >= "A" && ansRaw <= "F") {
                        currentCorrectIndex = ansRaw.charCodeAt(0) - 65;
                    } else if (ansRaw.length === 1 && ansRaw >= "1" && ansRaw <= "6") {
                        currentCorrectIndex = parseInt(ansRaw) - 1;
                    } else {
                        // Try to find matching option text
                        const idx = currentOptions.findIndex(o => o.toLowerCase().includes(ansRaw.toLowerCase()));
                        if (idx >= 0) currentCorrectIndex = idx;
                    }
                } else if (optMatch && currentQ) {
                    const optText = optMatch[2].trim();
                    currentOptions.push(optText);
                } else if (qMatch) {
                    commitCurrent();
                    currentQ = { text: qMatch[1].trim() };
                    currentOptions = [];
                    currentCorrectIndex = 0;
                } else if (!currentQ) {
                    // First line without prefix is treated as question
                    currentQ = { text: line };
                    currentOptions = [];
                    currentCorrectIndex = 0;
                } else if (currentOptions.length === 0) {
                    // Continuation of question text
                    currentQ.text += " " + line;
                }
            }

            commitCurrent();

            if (parsedList.length === 0) {
                toast.error("Could not recognize question format. Please check the sample format.");
                return;
            }

            setQuestions(parsedList);
            setActiveSubTab("builder");
            toast.success(`Successfully parsed ${parsedList.length} question(s)!`);
        } catch (e: any) {
            console.error("Parse error:", e);
            toast.error("Failed to parse text: " + e.message);
        }
    };

    // CSV Template Download
    const downloadCsvTemplate = () => {
        const header = "Question Statement,Option A,Option B,Option C,Option D,Correct Answer (A/B/C/D)";
        const sample1 = '"What is the capital of France?","London","Berlin","Paris","Madrid","C"';
        const sample2 = '"Which planet is known as the Red Planet?","Mars","Jupiter","Saturn","Venus","A"';
        const csvContent = "data:text/csv;charset=utf-8," + [header, sample1, sample2].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "question_bulk_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Template downloaded");
    };

    // CSV File Upload
    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const rows = text.split(/\r?\n/).map(r => r.trim()).filter(Boolean);
                if (rows.length <= 1) {
                    toast.error("CSV file contains no data rows.");
                    return;
                }

                const parsedList: QuestionItem[] = [];
                // Skip header (index 0)
                for (let i = 1; i < rows.length; i++) {
                    // Regex to handle quoted CSV entries
                    const cols = rows[i].match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,]+))/g)?.map(c => c.replace(/^"|"$/g, '').trim()) || [];
                    if (cols.length >= 3) {
                        const qText = cols[0];
                        const optA = cols[1] || "";
                        const optB = cols[2] || "";
                        const optC = cols[3] || "";
                        const optD = cols[4] || "";
                        const correctCol = (cols[5] || cols[cols.length - 1] || "A").toUpperCase().trim();

                        let correctIdx = 0;
                        if (correctCol === "B" || correctCol === "2") correctIdx = 1;
                        if (correctCol === "C" || correctCol === "3") correctIdx = 2;
                        if (correctCol === "D" || correctCol === "4") correctIdx = 3;

                        parsedList.push({
                            id: `csv-${i}`,
                            text: qText,
                            options: [optA, optB, optC, optD].filter(Boolean),
                            correctAnswerIndex: correctIdx
                        });
                    }
                }

                if (parsedList.length > 0) {
                    setQuestions(parsedList);
                    setActiveSubTab("builder");
                    toast.success(`Imported ${parsedList.length} questions from CSV!`);
                } else {
                    toast.error("Failed to parse valid rows from CSV.");
                }
            } catch (err: any) {
                toast.error("Error reading CSV: " + err.message);
            }
        };
        reader.readAsText(file);
    };

    // Validation Status
    const invalidQuestions = questions.filter(
        q => !q.text.trim() || q.options.filter(o => o.trim()).length < 2 || !q.options[q.correctAnswerIndex]?.trim()
    );
    const isValid = invalidQuestions.length === 0 && questions.length > 0;

    // Bulk Submission with Offline Handling
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!isValid) {
            toast.error(`Please fix ${invalidQuestions.length} incomplete question(s) before importing.`);
            return;
        }

        setLoading(true);

        const payloadQuestions = questions.map(q => {
            const cleanOptions = q.options.filter(o => o.trim());
            const correctText = cleanOptions[q.correctAnswerIndex] || cleanOptions[0];
            return {
                text: q.text.trim(),
                options: cleanOptions,
                correctAnswer: correctText,
                topicId,
                workspaceId,
                isPublic
            };
        });

        // Offline storage fallback
        if (!isOnline || (typeof window !== "undefined" && !window.navigator.onLine)) {
            try {
                const queueKey = "offline_pending_bulk_queue";
                const currentQueue: any[] = JSON.parse(localStorage.getItem(queueKey) || "[]");
                currentQueue.push({
                    questions: payloadQuestions,
                    timestamp: Date.now()
                });
                localStorage.setItem(queueKey, JSON.stringify(currentQueue));
                localStorage.removeItem(DRAFT_KEY);

                toast.warning(`Saved ${questions.length} questions in Offline Storage! They will sync automatically when back online.`);
                setLoading(false);
                router.push("/teacher/questions");
                return;
            } catch (err: any) {
                toast.error("Failed to save to local offline queue: " + err.message);
                setLoading(false);
                return;
            }
        }

        try {
            const response = await fetch("/api/teacher/questions/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questions: payloadQuestions }),
            });

            if (!response.ok) {
                const txt = await response.text();
                throw new Error(txt || "Failed to create questions in bulk");
            }

            localStorage.removeItem(DRAFT_KEY);
            toast.success(`Batch imported ${questions.length} questions successfully!`);
            router.push("/teacher/questions");
            router.refresh();
        } catch (err: any) {
            if (err.name === "TypeError" && err.message?.includes("fetch")) {
                const queueKey = "offline_pending_bulk_queue";
                const currentQueue: any[] = JSON.parse(localStorage.getItem(queueKey) || "[]");
                currentQueue.push({
                    questions: payloadQuestions,
                    timestamp: Date.now()
                });
                localStorage.setItem(queueKey, JSON.stringify(currentQueue));
                localStorage.removeItem(DRAFT_KEY);

                toast.warning("Network connection lost. Batch preserved in offline queue.");
                router.push("/teacher/questions");
            } else {
                toast.error(err.message || "An error occurred during bulk import");
            }
        } finally {
            setLoading(false);
        }
    }

    if (!mounted) return null;

    return (
        <form onSubmit={onSubmit} className="space-y-6 pb-20">
            {/* OFFLINE & DRAFT TELEMETRY STRIP */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-5 sm:py-3 rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                        isOnline ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse"
                    )}>
                        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                                {isOnline ? "Bulk Authoring Engine" : "Offline Bulk Mode Active"}
                            </span>
                            <span className={cn(
                                "text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                isValid 
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            )}>
                                {isValid ? `${questions.length} Ready` : `${invalidQuestions.length} Needs Attention`}
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Check className="w-3 h-3 text-emerald-500" />
                            {lastAutoSaveTime ? `Draft saved locally at ${lastAutoSaveTime}` : "Automatic local caching enabled"}
                        </p>
                    </div>
                </div>

                {/* Sub Tab Switcher & Template Downloads */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadCsvTemplate}
                        className="h-8 px-2.5 rounded-xl text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground border-border/70"
                        title="Download sample CSV format"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">CSV Template</span>
                    </Button>

                    <label className="cursor-pointer">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 rounded-xl text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground border-border/70 pointer-events-none"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Import CSV</span>
                        </Button>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleCsvUpload}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            {/* RECOVERABLE DRAFT BANNER */}
            {hasRecoverableDraft && (
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                            <h4 className="text-xs font-bold text-foreground">Unsaved Bulk Draft Found</h4>
                            <p className="text-[11px] text-muted-foreground">
                                A previous batch of questions was recovered on this local device.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={discardDraft}
                            className="h-8 px-3 rounded-xl text-xs font-bold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                        >
                            Discard
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={restoreDraft}
                            className="h-8 px-3.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            Restore Batch
                        </Button>
                    </div>
                </div>
            )}

            {/* COMMON TARGET SETTINGS CARD */}
            <Card className="border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs rounded-2xl overflow-hidden">
                <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-primary" />
                                <span>Apply Chapter to Batch</span>
                            </Label>
                            <div className="flex gap-2">
                                <Select value={topicId} onValueChange={setTopicId} required>
                                    <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs font-semibold">
                                        <SelectValue placeholder="Select chapter" />
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

                    <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                        <Checkbox
                            id="bulkPublic"
                            checked={isPublic}
                            onCheckedChange={(c) => setIsPublic(c as boolean)}
                            className="rounded-md"
                        />
                        <div className="grid gap-0.5 leading-none">
                            <Label htmlFor="bulkPublic" className="text-xs font-bold text-foreground cursor-pointer">
                                Share Batch as Public Curriculum Assets
                            </Label>
                            <p className="text-[11px] text-muted-foreground">
                                Enables inclusion into cross-institute mock examinations.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* INPUT METHOD SWITCHER (VISUAL BUILDER VS SMART PASTE) */}
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("builder")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                            activeSubTab === "builder" 
                                ? "bg-primary text-primary-foreground shadow-xs" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                    >
                        Question Builder ({questions.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("paste")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                            activeSubTab === "paste" 
                                ? "bg-primary text-primary-foreground shadow-xs" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Smart Text Fast-Paste</span>
                    </button>
                </div>

                <span className="text-[11px] font-bold text-muted-foreground">
                    {questions.length} Items Configured
                </span>
            </div>

            {/* FAST PASTE TAB */}
            {activeSubTab === "paste" && (
                <Card className="border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs rounded-2xl overflow-hidden p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                Smart Text / AI Output Parser
                            </h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Paste raw questions formatted from ChatGPT, Word, or text files. The engine automatically identifies questions, choices A/B/C/D, and correct answers.
                            </p>
                        </div>
                    </div>

                    <Textarea
                        placeholder={`1. What is the primary function of chlorophyll in plant cells?
A) Storing water
B) Absorbing light energy for photosynthesis
C) Providing structural rigidity
D) Transporting nutrients
Answer: B

2. Which planet has the highest surface temperature?
A) Mercury
B) Venus
C) Mars
D) Jupiter
Ans: B`}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        className="min-h-[220px] font-mono text-xs rounded-xl border-border/60 bg-muted/20 focus-visible:bg-background leading-relaxed"
                    />

                    <div className="flex items-center justify-between pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRawText("")}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Clear Text
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={parseRawText}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-5 rounded-xl gap-1.5"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Parse Questions</span>
                        </Button>
                    </div>
                </Card>
            )}

            {/* VISUAL QUESTION CARDS LIST */}
            {activeSubTab === "builder" && (
                <div className="space-y-4">
                    {questions.map((q, qIndex) => {
                        const isCardValid = q.text.trim().length >= 3 && q.options.filter(o => o.trim()).length >= 2;

                        return (
                            <Card
                                key={q.id}
                                className={cn(
                                    "border transition-all bg-card/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xs group",
                                    isCardValid ? "border-border/70" : "border-amber-500/40 bg-amber-500/[0.02]"
                                )}
                            >
                                <CardContent className="p-4 sm:p-5 space-y-4">
                                    {/* Question Card Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-lg bg-foreground text-background text-xs font-black flex items-center justify-center shrink-0">
                                                {qIndex + 1}
                                            </span>
                                            <span className="text-xs font-bold text-foreground">
                                                Question #{qIndex + 1}
                                            </span>
                                            {!isCardValid && (
                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                    Incomplete
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => duplicateQuestion(qIndex)}
                                                className="h-7 px-2 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                                title="Duplicate Question"
                                            >
                                                <Copy className="w-3 h-3 mr-1" />
                                                <span className="hidden sm:inline">Duplicate</span>
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={questions.length <= 1}
                                                onClick={() => removeQuestion(qIndex)}
                                                className="h-7 px-2 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                                                title="Delete Question"
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                <span className="hidden sm:inline">Remove</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Question Prompt */}
                                    <div className="space-y-1.5">
                                        <Textarea
                                            placeholder={`Type Question #${qIndex + 1} statement clearly...`}
                                            value={q.text}
                                            onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                                            className="min-h-[75px] rounded-xl border-border/60 bg-muted/20 text-xs sm:text-sm font-medium focus-visible:bg-background"
                                        />
                                    </div>

                                    {/* Options Grid */}
                                    <div className="space-y-2 pt-2 border-t border-border/40">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Options & Correct Answer
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addOption(qIndex)}
                                                disabled={q.options.length >= 6}
                                                className="h-6 px-2 rounded-lg text-[10.5px] font-bold border-border/60"
                                            >
                                                <PlusCircle className="w-3 h-3 mr-1" />
                                                <span>Add Option</span>
                                            </Button>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-2">
                                            {q.options.map((opt, oIndex) => {
                                                const letter = String.fromCharCode(65 + oIndex);
                                                const isCorrect = q.correctAnswerIndex === oIndex;

                                                return (
                                                    <div
                                                        key={oIndex}
                                                        className={cn(
                                                            "flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border transition-all",
                                                            isCorrect
                                                                ? "bg-emerald-500/10 border-emerald-500/40"
                                                                : "bg-muted/10 border-border/60"
                                                        )}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => setCorrectAnswer(qIndex, oIndex)}
                                                            className={cn(
                                                                "w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 transition-all cursor-pointer",
                                                                isCorrect
                                                                    ? "bg-emerald-500 text-white shadow-xs"
                                                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                            )}
                                                            title={`Mark Option ${letter} as correct`}
                                                        >
                                                            {letter}
                                                        </button>

                                                        <Input
                                                            placeholder={`Choice ${letter}...`}
                                                            value={opt}
                                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                            className="h-8 rounded-lg border-border/50 bg-background/50 text-xs font-medium focus-visible:bg-background"
                                                        />

                                                        {q.options.length > 2 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeOption(qIndex, oIndex)}
                                                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive shrink-0 opacity-40 hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {/* APPEND ANOTHER QUESTION BUTTON */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addQuestion}
                        className="w-full h-14 rounded-2xl border-2 border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5 font-bold text-xs text-muted-foreground hover:text-primary gap-2 transition-all"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>Append Another Question (Total: {questions.length + 1})</span>
                    </Button>
                </div>
            )}

            {/* BOTTOM SUMMARY & SUBMIT ACTION BAR */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push("/teacher/questions")}
                    disabled={loading}
                    className="h-10 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                    Cancel & Return
                </Button>

                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-xs font-bold text-muted-foreground">
                        {questions.length} Question{questions.length !== 1 ? "s" : ""}
                    </span>

                    <Button
                        type="submit"
                        disabled={loading || !isValid}
                        className="h-11 px-7 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-2"
                    >
                        <Save className="w-4 h-4" />
                        <span>{loading ? "Importing Batch..." : `Import ${questions.length} Questions`}</span>
                    </Button>
                </div>
            </div>
        </form>
    );
}
