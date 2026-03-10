"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
    ArrowRight,
    ArrowLeft,
    Clock,
    Send,
    Menu,
    Flag,
    CheckCircle2,
    AlertCircle,
    Maximize2,
    Lock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { submitExam, saveExamDraft } from "./actions";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ClientQuestion {
    id: string;
    text: string;
    options: string[];
    imageUrl: string | null;
}

interface ExamProps {
    exam: {
        id: string;
        title: string;
        duration: number;
        passMarks: number;
        workspaceName: string;
    };
    questions: ClientQuestion[];
    studentId: string;
    initialDraft?: {
        answers: Record<string, string>;
        timeLeft: number;
        lastActiveIndex: number;
        flaggedQuestions: string[];
        tabSwitches: number;
    };
}

export function StudentExamClient({ exam, questions, studentId, initialDraft }: ExamProps) {
    const router = useRouter();

    // Core Exam State
    const [timeLeft, setTimeLeft] = useState(initialDraft?.timeLeft ?? exam.duration * 60);
    const [answers, setAnswers] = useState<Record<string, string>>(initialDraft?.answers ?? {});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialDraft?.lastActiveIndex ?? 0);
    const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>(initialDraft?.flaggedQuestions ?? []);
    const [tabSwitches, setTabSwitches] = useState(initialDraft?.tabSwitches ?? 0);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);

        // Anti-Tab Switching Detection (Enterprise Feature)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                setTabSwitches(prev => prev + 1);
                toast.warning("Warning: Tab switching detected. This activity is being logged.", {
                    description: "Please stay on the exam screen to avoid disqualification.",
                    duration: 5000,
                });
            }
        };

        // Prevent accidental refresh/close
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    // Timer Logic
    useEffect(() => {
        if (timeLeft <= 0) {
            handleAutoSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    // Auto-Save Logic (3 seconds)
    useEffect(() => {
        const triggerAutoSave = async () => {
            setIsSaving(true);
            await saveExamDraft(
                exam.id,
                studentId,
                answers,
                timeLeft,
                currentQuestionIndex,
                flaggedQuestions,
                tabSwitches
            );
            setIsSaving(false);
        };

        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(triggerAutoSave, 3000);

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [answers, timeLeft, currentQuestionIndex, flaggedQuestions, exam.id, studentId]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSelectOption = (questionId: string, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const toggleFlag = (questionId: string) => {
        setFlaggedQuestions(prev =>
            prev.includes(questionId)
                ? prev.filter(id => id !== questionId)
                : [...prev, questionId]
        );
    };

    const goToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentQuestionIndex(index);
        }
    };

    const handleAutoSubmit = async () => {
        toast.info("Time is up! Submitting your exam automatically.");
        submitAndRedirect();
    };

    const submitAndRedirect = async () => {
        setIsSubmitting(true);
        const timeTaken = (exam.duration * 60) - timeLeft;
        const result = await submitExam(exam.id, studentId, answers, timeTaken);

        if (result?.success) {
            toast.success("Exam submitted successfully!");
            router.push("/dashboard");
        } else {
            toast.error("Failed to submit exam. Please contact support.");
            setIsSubmitting(false);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    if (!mounted) return null;

    if (questions.length === 0) {
        return <div className="p-12 text-center text-muted-foreground font-medium">This exam has no questions configured.</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-zinc-950 overflow-hidden font-sans antialiased">
            {/* Enterprise Header */}
            <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-zinc-900 border-b shadow-sm z-30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg hidden sm:block">
                        <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm md:text-lg text-slate-900 dark:text-white line-clamp-1">{exam.title}</h2>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground">
                            <span className="font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">{exam.workspaceName}</span>
                            <span className="opacity-30">•</span>
                            <span>{answeredCount} of {questions.length} Answered</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-6">
                    {/* Compact Timer */}
                    <div className={cn(
                        "px-3 py-1.5 rounded-full flex items-center gap-2 font-mono font-bold text-sm md:text-xl transition-all",
                        timeLeft < 300
                            ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                            : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-transparent"
                    )}>
                        <Clock className="w-4 h-4 md:w-5 md:h-5" />
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleFullscreen}
                            className="hidden md:flex text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"
                            title="Focus Mode"
                        >
                            <Maximize2 className="w-5 h-5" />
                        </Button>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="md:hidden rounded-lg">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 border-l border-zinc-200 dark:border-zinc-800">
                                <QuestionPalette
                                    questions={questions}
                                    answers={answers}
                                    currentIdx={currentQuestionIndex}
                                    flagged={flaggedQuestions}
                                    onSelect={goToQuestion}
                                />
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            {/* Desktop Navigation Progress */}
            <div className="w-full bg-white dark:bg-zinc-900 px-8 py-2 border-b hidden md:block">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                            <span>Exam Progress</span>
                            <span>{Math.round(progress)}% Complete</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                    {isSaving && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                            Auto-saving...
                        </div>
                    )}
                </div>
            </div>

            {/* Main Exam Area */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden pb-32 pt-4 md:pt-8 scroll-smooth">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 grid md:grid-cols-[1fr_320px] gap-8">

                    {/* Question Content */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between md:hidden">
                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Question {currentQuestionIndex + 1} of {questions.length}</span>
                            {isSaving && <span className="text-[10px] text-muted-foreground italic">Syncing...</span>}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestion.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200 dark:ring-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl">
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800">
                                        <div
                                            className="h-full bg-indigo-600 transition-all duration-500"
                                            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                        />
                                    </div>
                                    <CardHeader className="p-6 md:p-8 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                Question {currentQuestionIndex + 1}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleFlag(currentQuestion.id)}
                                                className={cn(
                                                    "gap-2 px-3 rounded-xl",
                                                    flaggedQuestions.includes(currentQuestion.id)
                                                        ? "text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30"
                                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                                )}
                                            >
                                                <Flag className={cn("w-4 h-4", flaggedQuestions.includes(currentQuestion.id) && "fill-orange-600")} />
                                                <span className="text-[10px] font-black uppercase">{flaggedQuestions.includes(currentQuestion.id) ? "Flagged" : "Flag"}</span>
                                            </Button>
                                        </div>
                                        <CardTitle className="text-xl md:text-2xl font-bold leading-relaxed text-slate-800 dark:text-slate-100">
                                            {currentQuestion.text}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 md:px-8 pb-8 space-y-8">
                                        {currentQuestion.imageUrl && (
                                            <div className="relative group">
                                                <img
                                                    src={currentQuestion.imageUrl}
                                                    alt="Question Illustration"
                                                    className="w-full max-h-[400px] object-contain rounded-2xl border-2 border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 shadow-inner"
                                                />
                                            </div>
                                        )}

                                        <RadioGroup
                                            value={answers[currentQuestion.id] || ""}
                                            onValueChange={(val) => handleSelectOption(currentQuestion.id, val)}
                                            className="grid gap-4"
                                        >
                                            {currentQuestion.options.map((opt, idx) => {
                                                const isSelected = answers[currentQuestion.id] === opt;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleSelectOption(currentQuestion.id, opt)}
                                                        className={cn(
                                                            "group flex items-center space-x-4 border p-5 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98]",
                                                            isSelected
                                                                ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm ring-1 ring-indigo-600/20"
                                                                : "border-slate-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-white dark:hover:bg-zinc-800/50"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all",
                                                            isSelected
                                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                                                                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                                        )}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-semibold text-base md:text-lg text-slate-700 dark:text-slate-200 pr-4">
                                                            {opt}
                                                        </Label>
                                                        <RadioGroupItem value={opt} id={`opt-${idx}`} className="sr-only" />
                                                        {isSelected && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                                                    </div>
                                                );
                                            })}
                                        </RadioGroup>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Desktop Sidebar: Question Palette */}
                    <aside className="hidden md:block">
                        <div className="sticky top-8 space-y-6">
                            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Navigation Map</CardTitle>
                                        <Badge className="bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200 border-none px-2 py-0.5 rounded-lg">{answeredCount}/{questions.length}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-5 gap-2.5">
                                        {questions.map((q, idx) => {
                                            const isAnswered = !!answers[q.id];
                                            const isCurrent = idx === currentQuestionIndex;
                                            const isFlagged = flaggedQuestions.includes(q.id);

                                            return (
                                                <button
                                                    key={q.id}
                                                    onClick={() => goToQuestion(idx)}
                                                    className={cn(
                                                        "relative h-11 w-11 text-xs font-black rounded-xl flex items-center justify-center transition-all duration-200",
                                                        isCurrent ? "scale-105 shadow-md z-10" : "hover:scale-105",
                                                        isCurrent && "ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-zinc-900 border-none",
                                                        isAnswered
                                                            ? "bg-indigo-600 text-white"
                                                            : "bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700",
                                                        isFlagged && !isAnswered && "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
                                                    )}
                                                >
                                                    {idx + 1}
                                                    {isFlagged && (
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-zinc-900" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Legend */}
                                    <div className="mt-8 pt-6 border-t dark:border-zinc-800 grid grid-cols-2 gap-y-3 gap-x-4">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <div className="w-3 h-3 bg-indigo-600 rounded-sm" />
                                            <span>Answered</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <div className="w-3 h-3 bg-slate-100 dark:bg-zinc-800 rounded-sm" />
                                            <span>Pending</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                                            <span>Flagged</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <div className="w-3 h-3 border-2 border-indigo-600 rounded-sm" />
                                            <span>In Focus</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button
                                className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl shadow-xl shadow-indigo-600/20 font-black text-lg group transition-all"
                                onClick={() => setShowSubmitModal(true)}
                                disabled={isSubmitting}
                            >
                                <Send className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
                                Final Submission
                            </Button>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Sticky Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t dark:border-zinc-800 p-4 px-6 z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.05)]">
                <div className="flex items-center justify-between gap-4 max-w-sm mx-auto">
                    <Button
                        variant="ghost"
                        size="lg"
                        className="h-14 w-14 rounded-2xl flex-shrink-0 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200"
                        onClick={() => goToQuestion(currentQuestionIndex - 1)}
                        disabled={currentQuestionIndex === 0}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>

                    <Button
                        className="flex-1 h-14 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                        onClick={currentQuestionIndex === questions.length - 1 ? () => setShowSubmitModal(true) : () => goToQuestion(currentQuestionIndex + 1)}
                    >
                        {currentQuestionIndex === questions.length - 1 ? (
                            <>
                                <Send className="w-5 h-5" />
                                Review & Submit
                            </>
                        ) : (
                            <>
                                Next Question
                                <ArrowRight className="w-5 h-5 ml-1" />
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Premium Submit Confirmation Modal */}
            <SubmitModal
                isOpen={showSubmitModal}
                setIsOpen={setShowSubmitModal}
                onSubmit={submitAndRedirect}
                isSubmitting={isSubmitting}
                answeredCount={answeredCount}
                totalCount={questions.length}
                flaggedCount={flaggedQuestions.length}
            />
        </div>
    );
}

// Sub-components

function QuestionPalette({ questions, answers, currentIdx, flagged, onSelect }: any) {
    return (
        <div className="py-8 px-6 h-full flex flex-col bg-white dark:bg-zinc-900">
            <SheetHeader className="pb-8">
                <SheetTitle className="text-2xl font-black uppercase tracking-tighter">Section Navigator</SheetTitle>
                <SheetDescription className="text-sm font-medium">Quickly navigate between questions. Orange dots indicate flagged items.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-4 gap-4 p-1 pb-10">
                    {questions.map((q: any, idx: number) => {
                        const isAnswered = !!answers[q.id];
                        const isCurrent = idx === currentIdx;
                        const isFlagged = flagged.includes(q.id);

                        return (
                            <button
                                key={q.id}
                                onClick={() => onSelect(idx)}
                                className={cn(
                                    "relative h-14 w-14 text-sm font-black rounded-2xl flex items-center justify-center transition-all",
                                    isCurrent && "ring-4 ring-indigo-600 ring-offset-2 dark:ring-offset-zinc-950",
                                    isAnswered
                                        ? "bg-indigo-600 text-white shadow-md"
                                        : "bg-slate-100 dark:bg-zinc-800 text-slate-500"
                                )}
                            >
                                {idx + 1}
                                {isFlagged && (
                                    <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-zinc-950 shadow-sm" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function SubmitModal({ isOpen, setIsOpen, onSubmit, isSubmitting, answeredCount, totalCount, flaggedCount }: any) {
    const unattempted = totalCount - answeredCount;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white text-center">
                    <div className="mx-auto w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-xl">
                        <Send className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black mb-1 uppercase tracking-tighter">Final Submission</h2>
                    <p className="text-indigo-100 text-xs font-medium opacity-80">Are you ready to submit your exam responses?</p>
                </div>

                <div className="p-8 bg-white dark:bg-zinc-900">
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Answered</p>
                            <p className="text-lg font-black text-indigo-600">{answeredCount}</p>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-tighter mb-1">Flagged</p>
                            <p className="text-lg font-black text-orange-600">{flaggedCount}</p>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Pending</p>
                            <p className="text-lg font-black text-slate-600">{unattempted}</p>
                        </div>
                    </div>

                    {unattempted > 0 && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 mb-8">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
                                You have {unattempted} questions left. We recommend answering all questions for maximum score accuracy.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="gap-3 sm:gap-2 flex-row">
                        <Button
                            variant="ghost"
                            className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                        >
                            Review
                        </Button>
                        <Button
                            className="h-14 flex-1 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
                            onClick={onSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Finalizing..." : "Submit Now"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
