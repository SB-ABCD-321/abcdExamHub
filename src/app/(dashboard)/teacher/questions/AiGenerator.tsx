"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Sparkles,
    Loader2,
    BookOpen,
    Layers,
    FileText,
    Upload,
    CheckCircle2,
    Trash2,
    Save,
    RotateCcw,
    Zap,
    AlertCircle,
    ArrowRight,
    WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { generateAiQuestionsAction } from "@/actions/gemini";
import { QuickCreateTopicModal } from "@/components/workspace/QuickCreateTopicModal";
import { cn } from "@/lib/utils";

interface GeneratedQuestionItem {
    text: string;
    options: string[];
    correctAnswer: string;
    selected?: boolean;
}

interface AiQuestionGeneratorProps {
    topics: { id: string; name: string; workspaceId?: string | null; isGlobal?: boolean }[];
    workspaces?: { id: string; name: string }[];
    workspaceId: string;
    aiGenerationsCount: number;
    aiLimit: number;
    aiUnlimited: boolean;
    onBatchSaved?: () => void;
    isModal?: boolean;
}

// INLINE FULL-PAGE TAB COMPONENT
export function AiQuestionGeneratorTab({
    topics: initialTopics,
    workspaces = [],
    workspaceId: initialWorkspaceId,
    aiGenerationsCount,
    aiLimit,
    aiUnlimited,
    onBatchSaved,
    isModal = false
}: AiQuestionGeneratorProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form fields
    const [topics, setTopics] = useState(initialTopics);
    const [topicId, setTopicId] = useState(topics[0]?.id || "");
    const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId || workspaces[0]?.id || "");
    const [prompt, setPrompt] = useState("");
    const [count, setCount] = useState("5");
    const [difficulty, setDifficulty] = useState("standard");
    const [base64Pdf, setBase64Pdf] = useState<string | undefined>(undefined);
    const [fileName, setFileName] = useState("");
    const [directSave, setDirectSave] = useState(false);

    // Review / Preview generated questions
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionItem[]>([]);
    const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);

    const AI_DRAFT_KEY = "offline_ai_questions_draft_v2";

    useEffect(() => {
        setMounted(true);
        // Check for cached AI generation
        try {
            const rawDraft = localStorage.getItem(AI_DRAFT_KEY);
            if (rawDraft) {
                const parsed = JSON.parse(rawDraft);
                if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
                    setHasRecoverableDraft(true);
                }
            }
        } catch (e) {
            console.error("Failed to read AI draft", e);
        }
    }, []);

    // Recover cached AI questions
    const restoreAiDraft = () => {
        try {
            const rawDraft = localStorage.getItem(AI_DRAFT_KEY);
            if (!rawDraft) return;
            const parsed = JSON.parse(rawDraft);
            if (parsed.questions) setGeneratedQuestions(parsed.questions);
            if (parsed.topicId) setTopicId(parsed.topicId);
            setHasRecoverableDraft(false);
            toast.success("Recovered previous AI-generated question batch!");
        } catch (e) {
            toast.error("Failed to recover draft.");
        }
    };

    const discardAiDraft = () => {
        localStorage.removeItem(AI_DRAFT_KEY);
        setHasRecoverableDraft(false);
        setGeneratedQuestions([]);
        toast.info("AI draft cleared.");
    };

    const handleTopicCreated = (newTopic: { id: string; name: string }) => {
        setTopics(prev => [...prev, { ...newTopic, workspaceId, isGlobal: false }]);
        setTopicId(newTopic.id);
        toast.success(`Chapter "${newTopic.name}" created`);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Please upload a valid PDF document.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File is too large. Max 5MB allowed.");
            return;
        }

        setFileName(file.name);

        const reader = new FileReader();
        reader.onloadend = () => {
            setBase64Pdf(reader.result as string);
            toast.success(`Document "${file.name}" attached for curriculum extraction`);
        };
        reader.readAsDataURL(file);
    };

    // Trigger AI Generation
    const handleGenerate = async () => {
        if (!topicId) {
            toast.error("Please select a target topic chapter.");
            return;
        }
        if (!prompt.trim() && !base64Pdf) {
            toast.error("Please provide prompt instructions or attach a syllabus document.");
            return;
        }

        setIsLoading(true);

        const enrichedPrompt = `
Difficulty level: ${difficulty.toUpperCase()}.
Subject guidelines: ${prompt.trim() || "Extract balanced multiple choice assessment questions from the attached syllabus."}
Target audience: Academic examinations.
        `.trim();

        try {
            const result = await generateAiQuestionsAction(
                topicId,
                enrichedPrompt,
                parseInt(count),
                base64Pdf,
                !directSave
            );

            if (result.success) {
                if (directSave) {
                    toast.success(`Successfully generated and saved ${result.count} questions to Question Bank!`);
                    localStorage.removeItem(AI_DRAFT_KEY);
                    if (onBatchSaved) {
                        onBatchSaved();
                    } else {
                        router.push("/teacher/questions");
                        router.refresh();
                    }
                } else if (result.questions) {
                    const markedQuestions = result.questions.map((q: any) => ({
                        ...q,
                        selected: true
                    }));
                    setGeneratedQuestions(markedQuestions);
                    localStorage.setItem(AI_DRAFT_KEY, JSON.stringify({
                        topicId,
                        workspaceId,
                        questions: markedQuestions,
                        savedAt: Date.now()
                    }));
                    toast.success(`Generated ${result.questions.length} questions! Review and fine-tune below.`);
                }
            } else {
                toast.error(result.error || "Failed to generate questions.");
            }
        } catch (error: any) {
            console.error("AI Generation error:", error);
            toast.error(error.message || "An unexpected error occurred during AI generation.");
        } finally {
            setIsLoading(false);
        }
    };

    // Save reviewed questions to database via bulk endpoint
    const saveReviewedQuestions = async () => {
        const toSave = generatedQuestions.filter(q => q.selected !== false);
        if (toSave.length === 0) {
            toast.error("Please select at least one question to save.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = toSave.map(q => ({
                text: q.text.trim(),
                options: q.options.map(o => o.trim()),
                correctAnswer: q.correctAnswer.trim(),
                topicId,
                workspaceId,
                isPublic: false
            }));

            const res = await fetch("/api/teacher/questions/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questions: payload })
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Failed to save generated questions");
            }

            localStorage.removeItem(AI_DRAFT_KEY);
            toast.success(`Successfully saved ${toSave.length} AI-generated questions to Bank!`);
            if (onBatchSaved) {
                onBatchSaved();
            } else {
                router.push("/teacher/questions");
                router.refresh();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save questions to database");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSelect = (index: number) => {
        const next = [...generatedQuestions];
        next[index].selected = !next[index].selected;
        setGeneratedQuestions(next);
    };

    const removeQuestion = (index: number) => {
        const next = generatedQuestions.filter((_, i) => i !== index);
        setGeneratedQuestions(next);
        localStorage.setItem(AI_DRAFT_KEY, JSON.stringify({
            topicId,
            workspaceId,
            questions: next,
            savedAt: Date.now()
        }));
    };

    const updateQuestionText = (index: number, text: string) => {
        const next = [...generatedQuestions];
        next[index].text = text;
        setGeneratedQuestions(next);
    };

    if (!mounted) return null;

    return (
        <div className="space-y-5 pb-10">
            {/* AI QUOTA STRIP */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.07] via-indigo-500/[0.05] to-card backdrop-blur-xl shadow-xs">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20 shadow-xs">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                                Gemini 2.5 Flash Engine
                            </span>
                            <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                                AI Accelerated
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Draft multiple-choice assessment questions from prompts or syllabus PDFs.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border border-border/70 bg-card/80">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-muted-foreground">Generations:</span>
                        <span className="text-foreground">
                            {aiUnlimited ? "Unlimited" : `${aiGenerationsCount} / ${aiLimit}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* RECOVERABLE DRAFT BANNER */}
            {hasRecoverableDraft && (
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2.5">
                        <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                            <h4 className="text-xs font-bold text-foreground">Recovered Unsaved AI Questions</h4>
                            <p className="text-[11px] text-muted-foreground">
                                A previous batch of generated questions was recovered from local cache.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={discardAiDraft}
                            className="h-7.5 px-3 rounded-xl text-xs font-bold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                        >
                            Discard
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={restoreAiDraft}
                            className="h-7.5 px-3.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            Restore Batch
                        </Button>
                    </div>
                </div>
            )}

            {/* AI CONFIGURATION FORM */}
            <Card className="border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs rounded-2xl overflow-hidden">
                <CardContent className="p-5 sm:p-6 space-y-5">
                    {/* ROW 1: Subject Chapter with Quick Create (Full Width, No Overlap) */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>Target Subject Chapter</span>
                        </Label>
                        <div className="flex items-center gap-2.5">
                            <div className="flex-1 min-w-0">
                                <Select value={topicId} onValueChange={setTopicId} required>
                                    <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs font-semibold w-full">
                                        <SelectValue placeholder="Select topic chapter" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {topics.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name} {t.isGlobal ? "(Platform Global)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="shrink-0">
                                <QuickCreateTopicModal
                                    workspaceId={workspaceId}
                                    onTopicCreated={handleTopicCreated}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ROW 2: Question Count & Difficulty Level (Clean 2-Column Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Question Count
                            </Label>
                            <Select value={count} onValueChange={setCount}>
                                <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs font-semibold w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="3">3 Questions</SelectItem>
                                    <SelectItem value="5">5 Questions</SelectItem>
                                    <SelectItem value="10">10 Questions</SelectItem>
                                    <SelectItem value="15">15 Questions</SelectItem>
                                    <SelectItem value="20">20 Questions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Difficulty Level
                            </Label>
                            <Select value={difficulty} onValueChange={setDifficulty}>
                                <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/20 text-xs font-semibold w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="foundational">Foundational</SelectItem>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                    <SelectItem value="mixed">Mixed Tier</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* ROW 3: Prompt instructions */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            <span>Prompt & Syllabus Instructions</span>
                        </Label>
                        <Textarea
                            placeholder="e.g. Focus on cell division (Mitosis vs Meiosis), key phases (Prophase, Metaphase, Anaphase, Telophase), and chromosome count variations. Ensure questions test conceptual understanding."
                            className="min-h-[85px] text-xs sm:text-sm rounded-xl border-border/60 bg-muted/20 focus-visible:bg-background leading-relaxed font-medium"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    {/* ROW 4: PDF Document Upload */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-primary" />
                            <span>Optional: Extract directly from Syllabus / Notes PDF (Max 5MB)</span>
                        </Label>
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/70 hover:border-violet-500/50 hover:bg-violet-500/[0.02] p-4 rounded-2xl cursor-pointer transition-all">
                            <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                            <span className="text-xs font-bold text-foreground">
                                {fileName ? `Selected: ${fileName}` : "Click to browse or drop PDF document"}
                            </span>
                            <span className="text-[10.5px] text-muted-foreground mt-0.5">
                                AI will extract curriculum topics and construct questions based on document content.
                            </span>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* ROW 5: Direct Save Switch & Generate Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
                        <div className="flex items-center gap-2.5">
                            <Checkbox
                                id="directSave"
                                checked={directSave}
                                onCheckedChange={(c) => setDirectSave(c as boolean)}
                                className="rounded-md"
                            />
                            <Label htmlFor="directSave" className="text-xs font-bold text-foreground cursor-pointer">
                                Auto-save directly to Question Bank without review
                            </Label>
                        </div>

                        <Button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isLoading || !topicId || (!prompt.trim() && !base64Pdf)}
                            className="h-10 px-6 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Generating {count} Questions...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>Generate Questions</span>
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* REVIEW / PREVIEW SECTION (WHEN QUESTIONS ARE GENERATED) */}
            {generatedQuestions.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/60">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span>Generated Questions Review ({generatedQuestions.filter(q => q.selected !== false).length} / {generatedQuestions.length} selected)</span>
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                Review choices and refine statements before committing to your question bank.
                            </p>
                        </div>

                        <Button
                            type="button"
                            onClick={saveReviewedQuestions}
                            disabled={isSaving || generatedQuestions.filter(q => q.selected !== false).length === 0}
                            className="h-9 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-1.5"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>
                                {isSaving ? "Saving..." : `Save ${generatedQuestions.filter(q => q.selected !== false).length} to Bank`}
                            </span>
                        </Button>
                    </div>

                    <div className="grid gap-3">
                        {generatedQuestions.map((q, idx) => {
                            const isSelected = q.selected !== false;

                            return (
                                <Card
                                    key={idx}
                                    className={cn(
                                        "border transition-all rounded-2xl overflow-hidden p-4 bg-card/90 backdrop-blur-xl shadow-xs",
                                        isSelected ? "border-border/70" : "border-border/30 opacity-60"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelect(idx)}
                                                className="rounded-md mt-0.5"
                                            />
                                            <span className="text-xs font-black text-foreground">
                                                Question #{idx + 1}
                                            </span>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeQuestion(idx)}
                                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>

                                    <div className="mt-3 space-y-3">
                                        <Textarea
                                            value={q.text}
                                            onChange={(e) => updateQuestionText(idx, e.target.value)}
                                            className="min-h-[60px] text-xs sm:text-sm font-medium rounded-xl border-border/60 bg-muted/20"
                                        />

                                        <div className="grid sm:grid-cols-2 gap-2">
                                            {q.options.map((opt, oIdx) => {
                                                const letter = String.fromCharCode(65 + oIdx);
                                                const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

                                                return (
                                                    <div
                                                        key={oIdx}
                                                        className={cn(
                                                            "flex items-center gap-2 p-2 rounded-xl border text-xs font-medium",
                                                            isCorrect
                                                                ? "bg-emerald-500/10 border-emerald-500/40 text-foreground"
                                                                : "bg-muted/10 border-border/50 text-muted-foreground"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "w-5 h-5 rounded-md flex items-center justify-center text-[10.5px] font-bold shrink-0",
                                                            isCorrect ? "bg-emerald-500 text-white" : "bg-muted"
                                                        )}>
                                                            {letter}
                                                        </span>
                                                        <span className="flex-1">{opt}</span>
                                                        {isCorrect && (
                                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                                Correct
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// MODAL DIALOG COMPONENT (FOR QUESTION BANK LIST PAGE)
export function AiQuestionGenerator(props: AiQuestionGeneratorProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 shadow-xs transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate with AI</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6 bg-card border-border/80">
                <DialogHeader className="pb-2">
                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                        <Sparkles className="h-4 w-4 text-violet-600" />
                        <span>AI Question Generator</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Draft multiple-choice assessment questions from syllabus guidelines or prompts.
                    </DialogDescription>
                </DialogHeader>

                <AiQuestionGeneratorTab
                    {...props}
                    isModal={true}
                    onBatchSaved={() => {
                        setOpen(false);
                        window.location.reload();
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
