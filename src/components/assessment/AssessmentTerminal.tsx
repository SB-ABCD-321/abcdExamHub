"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    Lock,
    X,
    Minimize2
} from "lucide-react";
import { useRouter } from "next/navigation";
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

interface AssessmentTerminalProps {
    exam: {
        id: string;
        title: string;
        duration: number;
        passMarks: number;
        workspaceName: string;
    };
    questions: ClientQuestion[];
    studentId: string;
    mode?: "LIVE" | "TEST";
    onFinish: (answers: Record<string, string>, timeTaken: number) => Promise<{ success: boolean; redirectUrl?: string; error?: string; resultPublishMode?: string; newResultId?: string }>;
    exitUrl: string;
}

export function AssessmentTerminal({ exam, questions, studentId, mode = "LIVE", onFinish, exitUrl }: AssessmentTerminalProps) {
    const router = useRouter();
    const isTest = mode === "TEST";

    // Core Exam State
    const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
    const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isFullscreenWarning, setIsFullscreenWarning] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

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
                const timeTaken = (exam.duration * 60) - timeLeftRef.current;
                const payload = JSON.stringify({ 
                    examId: exam.id, 
                    studentId, 
                    answers: answersRef.current, 
                    timeTaken 
                });
                navigator.sendBeacon('/api/exam/submit', payload);
            }
            if (!hasSubmittedRef.current) {
                e.preventDefault();
                e.returnValue = "";
            }
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
            const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
            setIsFullscreen(isFs);
            if (!isFs && hasStartedRef.current && !hasSubmittedRef.current) {
                setIsFullscreenWarning(true);
            }
        };

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
    }, []);

    // Timer Logic
    useEffect(() => {
        if (!hasStarted) return;
        if (timeLeft <= 0) {
            handleAutoSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, hasStarted]);

    const forceSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        hasSubmittedRef.current = true;
        await exitFullscreen();
        const timeTaken = (exam.duration * 60) - timeLeftRef.current;
        const result = await onFinish(answersRef.current, timeTaken);
        if (result?.success) {
            if (result.redirectUrl) router.push(result.redirectUrl);
            else router.push(`/student/exams/${exam.id}/thank-you`);
        } else {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSelectOption = (questionId: string, option: string) => {
        setAnswers(prev => {
            const next = { ...prev };
            if (next[questionId] === option) delete next[questionId];
            else next[questionId] = option;
            return next;
        });
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
            setDirection(index > currentQuestionIndex ? 1 : -1);
            setCurrentQuestionIndex(index);
        }
    };

    const handleAutoSubmit = async () => {
        toast.info("Time is up! Submitting your exam automatically.");
        submitFinalAssessment();
    };

    const submitFinalAssessment = async () => {
        setIsSubmitting(true);
        hasSubmittedRef.current = true;
        await exitFullscreen();
        
        const timeTaken = (exam.duration * 60) - timeLeft;
        const result = await onFinish(answers, timeTaken);

        if (result?.success) {
            toast.success("Assessment completed successfully!");
            if (result.resultPublishMode === 'INSTANT' && result.newResultId) {
                router.push(`/student/results/${result.newResultId}`);
            } else if (result.redirectUrl) {
                router.push(result.redirectUrl);
            } else {
                router.push(`/student/exams/${exam.id}/thank-you`);
            }
        } else {
            toast.error(result?.error || "Failed to finalize assessment.");
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
        const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
        if (exitFunc && isFs) {
            try {
                await exitFunc.call(doc);
            } catch(e) {}
        }
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) enterFullscreen();
        else exitFullscreen();
    };

    const handleStartExam = async () => {
        await enterFullscreen();
        setHasStarted(true);
    };

    const handleReturnToFullscreen = async () => {
        await enterFullscreen();
        setIsFullscreenWarning(false);
    };

    const handleExitClick = () => {
        setShowSubmitModal(true);
    };

    if (!mounted) return null;

    if (questions.length === 0) {
        return <div className="p-12 text-center text-muted-foreground font-medium">This assessment has no questions configured.</div>;
    }

    if (!hasStarted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-6 font-sans antialiased">
                <Card className="max-w-md w-full border-none shadow-2xl bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden transition-all duration-500">
                    <div className="bg-primary p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                        <Maximize2 className="w-12 h-12 text-white mx-auto mb-4 relative z-10" />
                        <h2 className="text-2xl font-black text-white px-2 relative z-10 uppercase tracking-tight">Ready to Begin?</h2>
                    </div>
                    <CardContent className="p-8 space-y-6 text-center">
                        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                            <p className="font-bold text-lg text-slate-900 dark:text-white">{exam.title}</p>
                            <p className="font-semibold text-primary">Duration: {exam.duration} Minutes</p>
                            <div className="flex items-start justify-center gap-3 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 mt-4 text-left">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span className="text-[11px] font-bold leading-relaxed uppercase tracking-tighter">
                                    Anti-Cheat Warning: This assessment requires Full Screen mode. Changing tabs or exiting full screen will be logged and may result in automatic submission. Ensure a stable internet connection.
                                </span>
                            </div>
                        </div>
                        <Button 
                            size="lg" 
                            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Full Screen Exited!</h2>
                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-widest">
                                You have left full screen mode. This violation has been logged. Please return immediately to continue your assessment.
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
            
            {/* Dark Enterprise Header */}
            <header className="h-20 grid grid-cols-[1fr_auto_1fr] items-center px-4 md:px-12 bg-slate-950 text-white w-full z-50 relative">
                {/* Left: Info */}
                <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/20 shrink-0 hidden sm:block">
                        <Lock className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-black text-xs md:text-sm uppercase tracking-tight line-clamp-1">{exam.title}</h2>
                        <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold text-slate-400 tracking-wider">
                            <span className="uppercase truncate">{exam.workspaceName}</span>
                            {isTest && <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[7px] font-black uppercase px-1 h-3.5">TEST</Badge>}
                        </div>
                    </div>
                </div>

                {/* Center: Exit Button (Geometric Center) */}
                <div className="flex justify-center">
                    <button 
                        onClick={handleExitClick}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all group shadow-xl active:scale-90"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Right: Actions (Timer -> Menu) */}
                <div className="flex items-center justify-end gap-2 md:gap-4 pl-4">
                    {/* Timer Badge (Larger for Mobile) */}
                    <div className={cn(
                        "flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 rounded-xl border transition-all duration-500 shrink-0",
                        timeLeft < 300 
                            ? "bg-red-500/10 border-red-500/30 text-red-500 shadow-lg shadow-red-500/10" 
                            : "bg-slate-900 border-slate-800 text-white"
                    )}>
                        <Clock className={cn("w-3.5 h-3.5 md:w-4 md:h-4", timeLeft < 300 && "animate-pulse")} />
                        <span className="font-black text-xs md:text-base tabular-nums leading-none">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="hidden md:flex bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl h-11 w-11 shrink-0"
                    >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </Button>

                    <div className="md:hidden shrink-0">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button className="p-0 h-10 w-10 bg-slate-900 border-slate-800 text-white hover:bg-slate-800 rounded-xl" variant="outline">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] p-0 border-l border-zinc-800 bg-zinc-950">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Question Navigation</SheetTitle>
                                    <SheetDescription>Mobile navigation map for the assessment</SheetDescription>
                                </SheetHeader>
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

            {/* Progress Layer */}
            <div className="w-full bg-slate-900/5 px-4 md:px-12 py-2 border-b border-slate-200 dark:border-zinc-800 hidden md:block">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span className="shrink-0 uppercase">Exam Progress</span>
                    <div className="flex-1 relative h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                            className="absolute top-0 left-0 h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <span className="text-primary shrink-0">{Math.round(progress)}% Complete</span>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 w-full overflow-hidden flex flex-col p-3 md:p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto grid md:grid-cols-[1fr_300px] gap-6 lg:gap-8 h-full w-full overflow-hidden">

                    {/* Question Card Area */}
                    <div className="flex flex-col h-full overflow-hidden">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentQuestion.id}
                                custom={direction}
                                initial={{ opacity: 0, x: direction * 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -50 }}
                                drag="x"
                                dragDirectionLock
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.4}
                                whileDrag={{ scale: 0.98, opacity: 0.9 }}
                                onDragEnd={(_, info) => {
                                    const threshold = 80;
                                    const velocityThreshold = 500;
                                    
                                    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
                                        goToQuestion(currentQuestionIndex + 1);
                                    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
                                        goToQuestion(currentQuestionIndex - 1);
                                    }
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="flex-1 min-h-0 touch-pan-y h-full"
                            >
                                <Card className="border-none shadow-[0_12px_44px_-12px_rgba(0,0,0,0.08)] bg-white dark:bg-zinc-900 rounded-[2rem] h-full flex flex-col overflow-hidden relative">
                                    <CardHeader className="p-5 md:p-8 space-y-4 shrink-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                Question {currentQuestionIndex + 1}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleFlag(currentQuestion.id)}
                                                className={cn(
                                                    "gap-2 px-3 h-8 rounded-lg transition-all",
                                                    flaggedQuestions.includes(currentQuestion.id)
                                                        ? "text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30"
                                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                                )}
                                            >
                                                <Flag className={cn("w-3.5 h-3.5", flaggedQuestions.includes(currentQuestion.id) && "fill-orange-600")} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{flaggedQuestions.includes(currentQuestion.id) ? "Flagged" : "Flag"}</span>
                                            </Button>
                                        </div>
                                        <CardTitle className="text-lg md:text-2xl font-black leading-tight text-slate-900 dark:text-white tracking-tight select-none">
                                            {currentQuestion.text}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="px-5 md:px-8 pb-8 space-y-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide select-none transition-transform pointer-events-auto">
                                        {currentQuestion.imageUrl && (
                                            <div className="relative mb-6 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-zinc-800 shadow-sm pointer-events-none">
                                                <img
                                                    src={currentQuestion.imageUrl}
                                                    alt="Visualization"
                                                    className="w-full max-h-[280px] object-contain bg-slate-50 dark:bg-zinc-950 p-1 mx-auto"
                                                />
                                            </div>
                                        )}

                                        <RadioGroup
                                            value={answers[currentQuestion.id] || ""}
                                            onValueChange={(val) => handleSelectOption(currentQuestion.id, val)}
                                            className="grid gap-3"
                                        >
                                            {currentQuestion.options.map((opt, idx) => {
                                                const isSelected = answers[currentQuestion.id] === opt;
                                                const label = String.fromCharCode(65 + idx);
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleSelectOption(currentQuestion.id, opt)}
                                                        className={cn(
                                                            "group flex items-center space-x-4 border-2 p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200",
                                                            isSelected
                                                                ? "border-primary bg-primary/5"
                                                                : "border-slate-50 dark:border-zinc-800/50 hover:border-primary/20 hover:bg-slate-50 dark:hover:bg-zinc-800/10"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-black text-xs md:text-sm shrink-0",
                                                            isSelected
                                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 group-hover:bg-primary/20 group-hover:text-primary"
                                                        )}>
                                                            {label}
                                                        </div>
                                                        <Label className="flex-1 cursor-pointer font-bold text-xs md:text-base text-slate-700 dark:text-slate-200 pr-2">
                                                            {opt}
                                                        </Label>
                                                        <RadioGroupItem value={opt} className="sr-only" />
                                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                                    </div>
                                                );
                                            })}
                                        </RadioGroup>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Desktop Sidebar: Navigation Map */}
                    <aside className="hidden md:block h-full overflow-hidden">
                        <div className="sticky top-0 h-full flex flex-col">
                            <Card className="border-none shadow-[0_12px_44px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-[2rem] flex-1 flex flex-col overflow-hidden">
                                <QuestionPalette
                                    questions={questions}
                                    answers={answers}
                                    currentIdx={currentQuestionIndex}
                                    flagged={flaggedQuestions}
                                    onSelect={goToQuestion}
                                />
                            </Card>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Bottom Navigation / Action Bar */}
            <div className="h-20 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 z-40 shrink-0">
                <div className="max-w-[1400px] mx-auto px-4 md:px-12 h-full flex items-center justify-between gap-4">
                    
                    {/* Simplified Center Controls for All Devices */}
                    <div className="flex items-center gap-2 md:gap-4 flex-1 md:flex-initial">
                        <Button
                            variant="ghost"
                            className="h-12 w-12 sm:w-auto px-0 sm:px-6 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-all font-black text-[10px] uppercase tracking-widest shrink-0"
                            onClick={() => goToQuestion(currentQuestionIndex - 1)}
                            disabled={currentQuestionIndex === 0}
                        >
                            <ArrowLeft className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Prev</span>
                        </Button>
                        <div className="bg-slate-50 dark:bg-zinc-900 h-12 px-4 md:px-6 rounded-2xl flex items-center justify-center font-black text-[10px] md:text-xs min-w-[70px] tracking-widest text-slate-400">
                            {currentQuestionIndex + 1} / {questions.length}
                        </div>
                        <Button
                            variant="ghost"
                            className="h-12 w-12 sm:w-auto px-0 sm:px-6 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-all font-black text-[10px] uppercase tracking-widest shrink-0"
                            onClick={() => goToQuestion(currentQuestionIndex + 1)}
                            disabled={currentQuestionIndex === questions.length - 1}
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ArrowRight className="w-4 h-4 sm:ml-2" />
                        </Button>
                    </div>

                    {/* Right: Submit */}
                    <Button
                        className="h-12 px-6 md:px-8 bg-slate-900 text-white dark:bg-primary dark:text-slate-950 hover:bg-primary hover:text-white rounded-2xl font-black uppercase tracking-widest text-[11px] md:text-sm transition-all shadow-xl shrink-0"
                        onClick={() => setShowSubmitModal(true)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Finalizing..." : "Submit Exam"}
                    </Button>
                </div>
            </div>

            {/* Submit Confirmation Portal */}
            <SubmitConfirmationModal
                isOpen={showSubmitModal}
                setIsOpen={setShowSubmitModal}
                onSubmit={submitFinalAssessment}
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
    const answeredCount = Object.keys(answers).length;
    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
            <div className="p-8 border-b border-slate-50 dark:border-zinc-800">
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Navigation Map</h3>
                    <Badge className="bg-primary/10 text-primary border-none rounded-lg px-2 py-0.5 font-bold text-[10px]">{answeredCount}/{questions.length}</Badge>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <div className="grid grid-cols-5 gap-3">
                    {questions.map((q: any, idx: number) => {
                        const isAnswered = !!answers[q.id];
                        const isCurrent = idx === currentIdx;
                        const isFlagged = flagged.includes(q.id);

                        return (
                            <button
                                key={q.id}
                                onClick={() => onSelect(idx)}
                                className={cn(
                                    "relative h-11 w-full text-xs font-black rounded-xl flex items-center justify-center transition-all duration-300",
                                    isCurrent ? "scale-110 shadow-lg ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-900 z-10" : "hover:bg-slate-50 dark:hover:bg-zinc-800 hover:scale-105",
                                    isAnswered
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                                )}
                            >
                                {idx + 1}
                                {isFlagged && (
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Styled Legend */}
                <div className="mt-12 pt-8 border-t border-dashed border-slate-200 dark:border-zinc-800 space-y-4">
                    {[
                        { color: "bg-primary shadow-sm", label: "Answered" },
                        { color: "bg-slate-100 dark:bg-zinc-800", label: "Pending" },
                        { color: "bg-orange-500 shadow-sm", label: "Flagged" },
                        { color: "ring-2 ring-primary ring-offset-2", label: "In Focus" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className={cn("w-3.5 h-3.5 rounded-sm", item.color)} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SubmitConfirmationModal({ isOpen, setIsOpen, onSubmit, isSubmitting, answeredCount, totalCount, flaggedCount }: any) {
    const unattempted = totalCount - answeredCount;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
                <div className="bg-slate-950 p-10 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/30">
                        <Send className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <DialogTitle className="text-3xl font-black mb-2 uppercase tracking-tight">Final Submission</DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                        Are you ready to finalize your assessment?
                    </DialogDescription>
                </div>

                <div className="p-8 bg-white dark:bg-zinc-900">
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 border-2 border-slate-50 dark:border-zinc-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Answered</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{answeredCount}</p>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-orange-500/10 border-2 border-orange-500/20">
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1.5">Flagged</p>
                            <p className="text-2xl font-black text-orange-500">{flaggedCount}</p>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 border-2 border-slate-50 dark:border-zinc-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pending</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{unattempted}</p>
                        </div>
                    </div>

                    {unattempted > 0 && (
                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 mb-8">
                            <AlertCircle className="w-6 h-6 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-600 dark:text-amber-500 font-bold leading-relaxed">
                                WARNING: {unattempted} questions are still pending. It is strongly recommended to review all items before finalization.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="gap-4 sm:gap-0 flex-row">
                        <Button
                            variant="ghost"
                            className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                        >
                            Return & Review
                        </Button>
                        <Button
                            className="h-14 flex-1 rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary hover:opacity-90 shadow-xl shadow-primary/30 uppercase tracking-widest text-[10px] transition-all active:scale-[0.98]"
                            onClick={onSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Mission"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
