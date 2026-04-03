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
import { submitExam } from "./actions";
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
    isTest?: boolean;
}

export function StudentExamClient({ exam, questions, studentId, isTest }: ExamProps) {
    const router = useRouter();

    // Core Exam State
    const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
    const [tabSwitches, setTabSwitches] = useState(0);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isFullscreenWarning, setIsFullscreenWarning] = useState(false);

    // State Refs for event listeners (avoids frequent re-registration)
    const answersRef = useRef(answers);
    const timeLeftRef = useRef(timeLeft);
    const hasSubmittedRef = useRef(false);
    const hasStartedRef = useRef(hasStarted);

    // Sync refs with state
    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
    useEffect(() => { hasStartedRef.current = hasStarted; }, [hasStarted]);

    useEffect(() => {
        setMounted(true);

        // Anti-Cheat: Auto-submit on tab switch
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden" && !isTest && !hasSubmittedRef.current) {
                console.log("Anti-cheat: Visibility hidden - forcing submission");
                hasSubmittedRef.current = true;
                forceSubmit();
            }
        };

        // Anti-Cheat: Auto-submit on page reload/close
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isTest && !hasSubmittedRef.current) {
                hasSubmittedRef.current = true;
                // Use sendBeacon for reliable submission during unload
                const timeTaken = (exam.duration * 60) - timeLeftRef.current;
                const payload = JSON.stringify({ 
                    examId: exam.id, 
                    studentId, 
                    answers: answersRef.current, 
                    timeTaken 
                });
                navigator.sendBeacon('/api/exam/submit', payload);
            }
            e.preventDefault();
            e.returnValue = "";
        };

        // Anti-Cheat: Auto-submit on back button
        const handlePopState = () => {
            if (!isTest && !hasSubmittedRef.current) {
                console.log("Anti-cheat: Back button intercepted - forcing submission");
                hasSubmittedRef.current = true;
                forceSubmit();
            }
        };

        // Full Screen exit detection
        const handleFullscreenChange = () => {
            const doc = document as any;
            const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
            if (!isFullscreen && hasStartedRef.current && !hasSubmittedRef.current) {
                setIsFullscreenWarning(true);
            }
        };

        // Push a state so back button triggers popstate instead of navigating away
        if (!isTest) {
            window.history.pushState(null, '', window.location.href);
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.addEventListener("mozfullscreenchange", handleFullscreenChange);
        document.addEventListener("MSFullscreenChange", handleFullscreenChange);
        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
            document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, []); // Runs once on mount

    // Timer Logic - Decoupled from listeners
    useEffect(() => {
        if (!hasStarted) return;
        if (timeLeft <= 0) {
            handleAutoSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, hasStarted]);

    // Force submit (used by anti-cheat handlers)
    const forceSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        hasSubmittedRef.current = true;
        await exitFullscreen();
        try {
            const timeTaken = (exam.duration * 60) - timeLeftRef.current;
            const result = await submitExam(exam.id, studentId, answersRef.current, timeTaken);
            if (result?.success) {
                router.push(`/student`);
            } else {
                setIsSubmitting(false);
            }
        } catch (e) {
            setIsSubmitting(false);
        }
    };


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
        hasSubmittedRef.current = true;
        await exitFullscreen();
        
        if (isTest) {
            toast.success("Test session completed successfully! (No data was saved)");
            setTimeout(() => {
                router.push("/teacher/exams");
            }, 2000);
            return;
        }

        try {
            const timeTaken = (exam.duration * 60) - timeLeft;
            const result = await submitExam(exam.id, studentId, answers, timeTaken);

            if (result?.success) {
                toast.success("Exam submitted successfully!");
                router.push(`/student`);
            } else {
                toast.error("Failed to submit exam. Please contact support.");
                setIsSubmitting(false);
            }
        } catch (error: any) {
             toast.error(error?.message || "An unexpected error occurred during submission.");
             setIsSubmitting(false);
        }
    };

    const enterFullscreen = async () => {
        const docEl = document.documentElement as any;
        const requestFunc = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        if (requestFunc) {
            try {
                await requestFunc.call(docEl);
            } catch (err) { console.error("Fullscreen error", err); }
        }
    };

    const exitFullscreen = async () => {
        const doc = document as any;
        const exitFunc = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
        if (exitFunc && isFullscreen) {
            try {
                await exitFunc.call(doc);
            } catch(e) {}
        }
    };

    const toggleFullscreen = () => {
        const doc = document as any;
        const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
        if (!isFullscreen) {
            enterFullscreen();
        } else {
            exitFullscreen();
        }
    };

    const handleStartExam = async () => {
        await enterFullscreen();
        setHasStarted(true);
    };

    const handleReturnToFullscreen = async () => {
        await enterFullscreen();
        setIsFullscreenWarning(false);
    };

    if (!mounted) return null;

    if (questions.length === 0) {
        return <div className="p-12 text-center text-muted-foreground font-medium">This exam has no questions configured.</div>;
    }

    if (!hasStarted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-6 font-sans antialiased">
                <Card className="max-w-md w-full border-none shadow-2xl bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden">
                    <div className="bg-indigo-600 p-8 text-center">
                        <Maximize2 className="w-12 h-12 text-white mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-white px-2">Ready to Begin?</h2>
                    </div>
                    <CardContent className="p-8 space-y-6 text-center">
                        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                            <p className="font-bold text-lg">{exam.title}</p>
                            <p className="font-semibold text-indigo-600 dark:text-indigo-400">Duration: {exam.duration} Minutes</p>
                            <div className="flex items-center justify-center gap-3 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 mt-4 text-left">
                                <AlertCircle className="w-6 h-6 shrink-0" />
                                <span className="text-xs font-bold leading-relaxed">This exam requires Full Screen mode. Changing tabs or exiting full screen may result in automatic submission. Ensure a stable internet connection.</span>
                            </div>
                        </div>
                        <Button 
                            size="lg" 
                            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={handleStartExam}
                        >
                            Enter Full Screen & Start
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-zinc-950 font-sans antialiased relative overflow-hidden">
            {isFullscreenWarning && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm p-6">
                    <Card className="max-w-md w-full border-red-500/20 shadow-2xl shadow-red-500/10 bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500 animate-pulse" />
                        <CardContent className="p-8 space-y-6 text-center mt-2">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Full Screen Exited!</h2>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                You have left full screen mode. This violation has been logged. Please return immediately to continue your exam.
                            </p>
                            <Button 
                                size="lg" 
                                className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-xl shadow-red-600/20"
                                onClick={handleReturnToFullscreen}
                            >
                                Return to Exam
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
            
            {/* Enterprise Header */}
            <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b shadow-sm w-full z-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg hidden sm:block">
                        <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-sm md:text-lg text-slate-900 dark:text-white line-clamp-1">{exam.title}</h2>
                            {isTest && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/30 text-[8px] md:text-[10px] font-black uppercase tracking-widest px-1.5 h-5 flex-shrink-0">
                                    Test Mode
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground">
                            <span className="font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">{exam.workspaceName}</span>
                            <span className="opacity-30">•</span>
                            <span>{answeredCount} of {questions.length} Answered</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-6">
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
                </div>
            </div>

            {/* Main Exam Area - Proportional Layout */}
            <main className="flex-1 w-full overflow-hidden flex flex-col p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_320px] gap-6 lg:gap-8 h-full w-full overflow-hidden">

                    {/* Question Content */}
                    <div className="flex flex-col h-full overflow-hidden gap-2">
                        <div className="flex items-center justify-between md:hidden">
                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Question {currentQuestionIndex + 1} of {questions.length}</span>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestion.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(e, { offset, velocity }) => {
                                    const swipeThreshold = 50;
                                    if (offset.x < -swipeThreshold) {
                                        goToQuestion(currentQuestionIndex + 1);
                                    } else if (offset.x > swipeThreshold) {
                                        goToQuestion(currentQuestionIndex - 1);
                                    }
                                }}
                                className="flex-1 min-h-0"
                            >
                                <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl h-full flex flex-col overflow-hidden">
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-t-3xl overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 transition-all duration-500"
                                            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                        />
                                    </div>
                                    <CardHeader className="p-4 md:p-6 space-y-3 shrink-0">
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
                                    <CardContent className="px-4 md:px-6 pb-6 space-y-3 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
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
                                                            "group flex items-center space-x-3 border p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]",
                                                            isSelected
                                                                ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm ring-1 ring-indigo-600/20"
                                                                : "border-slate-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-white dark:hover:bg-zinc-800/50"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-black text-xs md:text-sm transition-all shrink-0",
                                                            isSelected
                                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                                                                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                                        )}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-semibold text-sm md:text-base text-slate-700 dark:text-slate-200 pr-2">
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

                        </div>
                    </aside>
                </div>
            </main>

            {/* Bottom Navigation Bar (Same height as header) */}
            <div className="h-16 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="max-w-7xl mx-auto px-3 md:px-8 h-full flex items-center justify-between gap-2 md:gap-4">
                    {/* Left: Timer */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700/50 select-none shrink-0">
                        <Clock className={cn("w-4 h-4", timeLeft < 300 ? "text-red-500 animate-pulse" : "text-indigo-600 dark:text-indigo-400")} />
                        <span className={cn("font-mono text-sm md:text-base font-bold leading-none tracking-tight", timeLeft < 300 ? "text-red-500 animate-pulse" : "text-slate-900 dark:text-slate-100")}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    {/* Center: Previous / Next Navigation */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 w-10 md:w-auto md:px-5 rounded-xl border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800"
                            onClick={() => goToQuestion(currentQuestionIndex - 1)}
                            disabled={currentQuestionIndex === 0}
                        >
                            <ArrowLeft className="w-4 h-4 md:mr-1.5" />
                            <span className="hidden md:inline text-xs font-bold">Prev</span>
                        </Button>
                        <span className="text-xs font-bold text-muted-foreground tabular-nums whitespace-nowrap">{currentQuestionIndex + 1}/{questions.length}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 w-10 md:w-auto md:px-5 rounded-xl border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800"
                            onClick={() => goToQuestion(currentQuestionIndex + 1)}
                            disabled={currentQuestionIndex === questions.length - 1}
                        >
                            <span className="hidden md:inline text-xs font-bold">Next</span>
                            <ArrowRight className="w-4 h-4 md:ml-1.5" />
                        </Button>
                    </div>

                    {/* Right: Submit Button */}
                    <Button
                        className="h-11 px-5 md:px-10 bg-slate-900 text-white dark:bg-primary dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-primary/90 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 text-sm md:text-base shadow-lg"
                        onClick={() => setShowSubmitModal(true)}
                        disabled={isSubmitting}
                    >
                        <span className="hidden sm:inline">Finish &</span> Submit
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
                    <DialogTitle className="text-2xl font-black mb-1 uppercase tracking-tighter">Final Submission</DialogTitle>
                    <DialogDescription className="text-indigo-100 text-xs font-medium opacity-80">
                        Are you ready to submit your exam responses?
                    </DialogDescription>
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
