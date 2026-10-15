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
    Minimize2,
    Wifi,
    WifiOff,
    RotateCw,
    Save,
    Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

    // Offline Storage Keys
    const offlineDraftKey = `offline_answers_${exam.id}_${studentId || "guest"}`;
    const offlinePendingKey = `offline_pending_sub_${exam.id}_${studentId || "guest"}`;

    // Core Exam State
    const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
    const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);

    // Offline Connectivity State
    const [isOnline, setIsOnline] = useState(true);
    const [offlineSyncPending, setOfflineSyncPending] = useState(false);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isFullscreenWarning, setIsFullscreenWarning] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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

        if (typeof window !== "undefined") {
            setIsOnline(navigator.onLine);

            // 1. Offline-First: Restore previous draft if existing
            try {
                const cachedDraft = localStorage.getItem(offlineDraftKey);
                if (cachedDraft) {
                    const parsed = JSON.parse(cachedDraft);
                    if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
                        setAnswers(parsed);
                        toast.info("Offline Draft Restored: Loaded your previously saved responses.");
                    }
                }
            } catch (e) {
                console.error("Failed to restore offline draft:", e);
            }

            // 2. Offline-First: Check for pending submission waiting for network
            try {
                const pendingSub = localStorage.getItem(offlinePendingKey);
                if (pendingSub) {
                    setOfflineSyncPending(true);
                }
            } catch (e) {}

            // 3. Online/Offline network listeners
            const handleOnline = () => {
                setIsOnline(true);
                toast.success("Connection Restored! You are back online.");
                // Auto-sync pending submission if any
                try {
                    const pendingRaw = localStorage.getItem(offlinePendingKey);
                    if (pendingRaw) {
                        const pendingData = JSON.parse(pendingRaw);
                        toast.info("Auto-syncing offline exam submission now...");
                        submitFinalAssessment(pendingData.answers, pendingData.timeTaken);
                    }
                } catch (e) {}
            };

            const handleOffline = () => {
                setIsOnline(false);
                toast.warning("Network connection lost. Offline Mode active — all responses are safely stored on this device.");
            };

            window.addEventListener("online", handleOnline);
            window.addEventListener("offline", handleOffline);

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
                window.removeEventListener("online", handleOnline);
                window.removeEventListener("offline", handleOffline);
                document.removeEventListener("visibilitychange", handleVisibilityChange);
                document.removeEventListener("fullscreenchange", handleFullscreenChange);
                document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
                document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
                document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
                window.removeEventListener("beforeunload", handleBeforeUnload);
                window.removeEventListener("popstate", handlePopState);
            };
        }
    }, [offlineDraftKey, offlinePendingKey]);

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
        try {
            const timeTaken = (exam.duration * 60) - timeLeftRef.current;
            const result = await onFinish(answersRef.current, timeTaken);
            if (result?.success) {
                try {
                    localStorage.removeItem(offlineDraftKey);
                    localStorage.removeItem(offlinePendingKey);
                } catch (e) {}
                if (result.redirectUrl) router.push(result.redirectUrl);
                else router.push(`/student/exams/${exam.id}/thank-you`);
            } else {
                setIsSubmitting(false);
            }
        } catch (e) {
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

            // Offline-first save: persist immediately to device storage
            try {
                localStorage.setItem(offlineDraftKey, JSON.stringify(next));
            } catch (e) {}

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
            setIsMobileNavOpen(false);
        }
    };

    const handleAutoSubmit = async () => {
        toast.info("Time is up! Submitting your exam automatically.");
        submitFinalAssessment();
    };

    const submitFinalAssessment = async (overrideAnswers?: Record<string, string>, overrideTime?: number) => {
        setIsSubmitting(true);
        hasSubmittedRef.current = true;
        await exitFullscreen();

        const answersToSubmit = overrideAnswers || answers;
        const timeTaken = overrideTime !== undefined ? overrideTime : ((exam.duration * 60) - timeLeft);

        // 1. Cache to local storage as pending submission first!
        try {
            localStorage.setItem(offlinePendingKey, JSON.stringify({
                answers: answersToSubmit,
                timeTaken,
                timestamp: Date.now()
            }));
        } catch (e) {}

        if (isTest) {
            try {
                localStorage.removeItem(offlineDraftKey);
                localStorage.removeItem(offlinePendingKey);
            } catch (e) {}
            toast.success("Simulation concluded successfully! (Test mode - no server write)");
            setTimeout(() => {
                router.push(exitUrl || "/teacher/exams");
            }, 1500);
            return;
        }

        // 2. Offline check
        if (typeof navigator !== "undefined" && !navigator.onLine) {
            setOfflineSyncPending(true);
            setIsSubmitting(false);
            toast.warning("Offline Mode: You are offline. Your exam responses are stored securely on this device and will submit automatically when you reconnect.");
            return;
        }

        // 3. Network submission with error recovery
        try {
            const result = await onFinish(answersToSubmit, timeTaken);

            if (result?.success) {
                // Clear offline cache
                try {
                    localStorage.removeItem(offlineDraftKey);
                    localStorage.removeItem(offlinePendingKey);
                } catch (e) {}
                setOfflineSyncPending(false);

                toast.success("Assessment submitted successfully!");
                if (result.resultPublishMode === 'INSTANT' && result.newResultId) {
                    router.push(`/student/results/${result.newResultId}`);
                } else if (result.redirectUrl) {
                    router.push(result.redirectUrl);
                } else {
                    router.push(`/student/exams/${exam.id}/thank-you`);
                }
            } else {
                setOfflineSyncPending(true);
                toast.error(result?.error || "Submission encountered an error. Your answers remain safely saved offline.");
                setIsSubmitting(false);
            }
        } catch (error: any) {
            setOfflineSyncPending(true);
            toast.warning("Network transmission dropped. Your answers are safe on your device. We will auto-retry as soon as your connection restores.");
            setIsSubmitting(false);
        }
    };

    // Keyboard navigation: A, B, C, D (or 1, 2, 3, 4) to select options, ArrowLeft/ArrowRight to navigate, F to toggle flag
    useEffect(() => {
        if (!hasStarted || showSubmitModal || isFullscreenWarning) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

            const key = e.key.toUpperCase();
            const currentQ = questions[currentQuestionIndex];
            if (!currentQ) return;

            let optionIndex = -1;
            if (key === "A" || key === "1") optionIndex = 0;
            else if (key === "B" || key === "2") optionIndex = 1;
            else if (key === "C" || key === "3") optionIndex = 2;
            else if (key === "D" || key === "4") optionIndex = 3;

            if (optionIndex >= 0 && optionIndex < currentQ.options.length) {
                handleSelectOption(currentQ.id, currentQ.options[optionIndex]);
            } else if (e.key === "ArrowLeft") {
                if (currentQuestionIndex > 0) {
                    goToQuestion(currentQuestionIndex - 1);
                }
            } else if (e.key === "ArrowRight") {
                if (currentQuestionIndex < questions.length - 1) {
                    goToQuestion(currentQuestionIndex + 1);
                }
            } else if (key === "F") {
                toggleFlag(currentQ.id);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [hasStarted, showSubmitModal, isFullscreenWarning, currentQuestionIndex, questions]);

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
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 sm:p-6 font-sans antialiased relative overflow-hidden">
                <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

                <Card className="max-w-lg w-full border border-border/80 shadow-2xl bg-card rounded-3xl overflow-hidden relative z-10">
                    <div className="p-6 sm:p-8 space-y-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto text-primary shadow-md shadow-primary/20">
                            <Maximize2 className="w-8 h-8" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                    Secure Examination Environment
                                </Badge>
                                <span className="text-[11px] text-muted-foreground font-semibold">•</span>
                                <span className="text-[11px] text-muted-foreground font-semibold">{exam.workspaceName}</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">{exam.title}</h2>
                        </div>

                        {/* Specs Pill Grid */}
                        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-muted/40 border border-border/60 text-center">
                            <div>
                                <p className="text-[9.5px] uppercase font-bold text-muted-foreground">Duration</p>
                                <p className="text-sm font-extrabold text-foreground mt-0.5">{exam.duration} Min</p>
                            </div>
                            <div className="border-x border-border/60">
                                <p className="text-[9.5px] uppercase font-bold text-muted-foreground">Questions</p>
                                <p className="text-sm font-extrabold text-foreground mt-0.5">{questions.length} Items</p>
                            </div>
                            <div>
                                <p className="text-[9.5px] uppercase font-bold text-muted-foreground">Pass Target</p>
                                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{exam.passMarks} Pts</p>
                            </div>
                        </div>

                        {/* Anti-cheat Advisory */}
                        <div className="flex items-start gap-3 text-amber-700 dark:text-amber-300 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/25 text-left">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <div className="text-xs leading-relaxed">
                                <strong className="font-bold text-amber-800 dark:text-amber-200">Anti-Cheat Enforcement:</strong>
                                <p className="mt-0.5 text-amber-700/90 dark:text-amber-300/90 font-medium">
                                    This examination operates in strict full-screen mode. Switching tabs or applications will register proctoring infractions on your session record.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2.5 pt-1">
                            <Button 
                                size="lg" 
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
                                onClick={handleStartExam}
                            >
                                <Maximize2 className="w-4 h-4" />
                                <span>Enter Full Screen & Start Exam</span>
                            </Button>
                            <Link href={exitUrl} className="block">
                                <span className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1 inline-block">
                                    Cancel & Return
                                </span>
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-zinc-950 font-sans antialiased relative overflow-hidden">
            {isFullscreenWarning && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
                    <Card className="max-w-md w-full border border-rose-500/30 shadow-2xl bg-card rounded-3xl overflow-hidden relative">
                        <div className="p-7 sm:p-8 space-y-5 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500 shadow-xs">
                                <AlertCircle className="w-8 h-8 text-rose-500 animate-pulse" />
                            </div>
                            <div className="space-y-1.5">
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] font-bold uppercase tracking-wider">
                                    Proctoring Alert
                                </Badge>
                                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Full Screen Exited</h2>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                                    You have departed from full-screen focus mode. This event has been recorded in your session audit. Please return immediately to resume your assessment.
                                </p>
                            </div>
                            <div className="pt-2">
                                <Button 
                                    size="lg" 
                                    className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
                                    onClick={handleReturnToFullscreen}
                                >
                                    <Maximize2 className="w-4 h-4" />
                                    Return to Assessment
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            
            {/* Dark Enterprise Header - Highly Optimized for Mobile & Desktop */}
            <header className="h-16 md:h-20 flex items-center justify-between px-3 sm:px-6 md:px-12 bg-slate-950 text-white w-full z-50 relative border-b border-slate-800/80">
                {/* Left: Info */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                    <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20 shrink-0 hidden sm:block">
                        <Lock className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-xs sm:text-sm md:text-base text-white tracking-tight truncate max-w-[150px] sm:max-w-xs md:max-w-md">{exam.title}</h2>
                        <div className="flex items-center gap-1.5 text-[8px] sm:text-[10px] font-medium text-slate-400">
                            <span className="truncate max-w-[110px]">{exam.workspaceName}</span>
                            {isTest && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[8px] font-bold px-1.5 h-4">TEST</Badge>}
                            {!isOnline && (
                                <Badge className="bg-amber-500 text-slate-950 font-bold text-[8px] px-1.5 h-4 gap-1 animate-pulse border-none">
                                    <WifiOff className="w-2.5 h-2.5" />
                                    Offline
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Timer -> Fullscreen -> Mobile Menu -> Exit */}
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    {/* Timer Badge */}
                    <div className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl border transition-all duration-300 shrink-0",
                        timeLeft < 300 
                            ? "bg-red-500/10 border-red-500/30 text-red-500 shadow-sm shadow-red-500/10" 
                            : "bg-slate-900 border-slate-800 text-white"
                    )}>
                        <Clock className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", timeLeft < 300 && "animate-pulse")} />
                        <span className="font-bold font-mono text-xs sm:text-sm md:text-base tabular-nums leading-none">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="hidden md:flex bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl h-10 w-10 shrink-0"
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>

                    {/* Mobile Map Drawer Button */}
                    <div className="md:hidden shrink-0">
                        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                            <SheetTrigger asChild>
                                <Button className="h-9 px-2.5 bg-slate-900 border-slate-800 text-white hover:bg-slate-800 rounded-xl gap-1 text-xs" variant="outline">
                                    <Menu className="w-4 h-4" />
                                    <span className="text-[10px] font-bold">{answeredCount}/{questions.length}</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[310px] sm:w-[340px] p-0 border-l border-border bg-background">
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

                    {/* Exit Button */}
                    <button 
                        onClick={handleExitClick}
                        title="Submit / Exit Exam"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-800 flex items-center justify-center transition-all group shrink-0 active:scale-95"
                    >
                        <X className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
                    </button>
                </div>
            </header>

            {/* Progress Layer */}
            <div className="w-full bg-slate-900/5 dark:bg-zinc-900/50 px-4 md:px-12 py-2 border-b border-border/60 hidden md:block">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="shrink-0">Exam Progress</span>
                    <div className="flex-1 relative h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                            className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-primary font-bold shrink-0">{Math.round(progress)}% Complete</span>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 w-full overflow-hidden flex flex-col p-2.5 sm:p-5 md:p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto grid md:grid-cols-[1fr_300px] gap-4 md:gap-6 lg:gap-8 h-full w-full overflow-hidden">

                    {/* Question Card Area */}
                    <div className="flex flex-col h-full overflow-hidden">
                        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                            <motion.div
                                key={currentQuestion.id}
                                custom={direction}
                                initial={{ opacity: 0, x: direction * 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -24 }}
                                drag="x"
                                dragDirectionLock
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(_, info) => {
                                    const threshold = 60;
                                    const velocityThreshold = 400;
                                    
                                    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
                                        if (currentQuestionIndex < questions.length - 1) {
                                            goToQuestion(currentQuestionIndex + 1);
                                        }
                                    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
                                        if (currentQuestionIndex > 0) {
                                            goToQuestion(currentQuestionIndex - 1);
                                        }
                                    }
                                }}
                                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                                className="flex-1 min-h-0 touch-pan-y h-full"
                            >
                                <Card className="border border-border/80 shadow-sm bg-card rounded-2xl sm:rounded-3xl h-full flex flex-col overflow-hidden relative">
                                    <div className="p-4 sm:p-6 md:p-7 space-y-3 shrink-0 border-b border-border/50 bg-gradient-to-r from-primary/[0.04] via-transparent to-transparent">
                                        <div className="flex justify-between items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                                                    Question {currentQuestionIndex + 1} of {questions.length}
                                                </Badge>
                                                <span className="text-[10px] font-semibold text-muted-foreground hidden sm:inline">
                                                    Single Choice
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleFlag(currentQuestion.id)}
                                                className={cn(
                                                    "gap-1.5 px-3 h-8 rounded-xl transition-all font-semibold text-xs",
                                                    flaggedQuestions.includes(currentQuestion.id)
                                                        ? "text-amber-600 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                )}
                                            >
                                                <Flag className={cn("w-3.5 h-3.5", flaggedQuestions.includes(currentQuestion.id) && "fill-amber-600 text-amber-600")} />
                                                <span>{flaggedQuestions.includes(currentQuestion.id) ? "Flagged" : "Flag"}</span>
                                                <span className="hidden lg:inline text-[9.5px] opacity-60 font-mono">[F]</span>
                                            </Button>
                                        </div>
                                        <h3 className="text-base sm:text-lg md:text-xl font-bold leading-relaxed text-foreground select-none">
                                            {currentQuestion.text}
                                        </h3>
                                    </div>

                                    <div className="p-4 sm:p-6 md:p-7 pb-8 space-y-3 overflow-y-auto flex-1 min-h-0 select-none scrollbar-hide">
                                        {currentQuestion.imageUrl && (
                                            <div className="relative mb-4 sm:mb-6 rounded-2xl overflow-hidden border border-border/60 bg-muted/20 p-2 shadow-xs pointer-events-none">
                                                <img
                                                    src={currentQuestion.imageUrl}
                                                    alt="Question visual"
                                                    className="w-full max-h-[220px] sm:max-h-[280px] object-contain rounded-xl mx-auto"
                                                />
                                            </div>
                                        )}

                                        <RadioGroup
                                            value={answers[currentQuestion.id] || ""}
                                            onValueChange={(val) => handleSelectOption(currentQuestion.id, val)}
                                            className="grid gap-2.5 sm:gap-3"
                                        >
                                            {currentQuestion.options.map((opt, idx) => {
                                                const isSelected = answers[currentQuestion.id] === opt;
                                                const label = String.fromCharCode(65 + idx);
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleSelectOption(currentQuestion.id, opt)}
                                                        className={cn(
                                                            "group flex items-center space-x-3 sm:space-x-4 border-2 p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-150 active:scale-[0.99]",
                                                            isSelected
                                                                ? "border-primary bg-primary/[0.08] dark:bg-primary/[0.14] shadow-sm shadow-primary/10 ring-1 ring-primary/40"
                                                                : "border-border/60 hover:border-primary/40 hover:bg-accent/40 bg-card"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors shadow-2xs",
                                                            isSelected
                                                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                                                : "bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary"
                                                        )}>
                                                            {label}
                                                        </div>
                                                        <Label className="flex-1 cursor-pointer font-medium text-xs sm:text-sm md:text-base text-foreground leading-snug pr-2">
                                                            {opt}
                                                        </Label>
                                                        <RadioGroupItem value={opt} className="sr-only" />
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="hidden md:inline-block text-[9.5px] font-mono text-muted-foreground/60 uppercase group-hover:text-muted-foreground">
                                                                [{label}]
                                                            </span>
                                                            <div className={cn(
                                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                                isSelected 
                                                                    ? "border-primary bg-primary text-primary-foreground" 
                                                                    : "border-muted-foreground/30 group-hover:border-primary/50"
                                                            )}>
                                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 fill-current stroke-primary" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </RadioGroup>
                                    </div>
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Desktop Sidebar: Navigation Map */}
                    <aside className="hidden md:block h-full overflow-hidden">
                        <div className="sticky top-0 h-full flex flex-col">
                            <Card className="border border-border/70 shadow-sm bg-card rounded-3xl flex-1 flex flex-col overflow-hidden">
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
            <div className="h-16 sm:h-20 bg-background/95 backdrop-blur-md border-t border-border/60 z-40 shrink-0 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
                <div className="max-w-[1400px] mx-auto px-3 sm:px-6 md:px-12 h-full flex items-center justify-between gap-2 sm:gap-4">
                    
                    {/* Navigation Controls */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <Button
                            variant="outline"
                            className="h-10 sm:h-11 px-3 sm:px-5 rounded-xl border-border/80 text-foreground font-bold text-xs gap-1.5 transition-all active:scale-95"
                            onClick={() => goToQuestion(currentQuestionIndex - 1)}
                            disabled={currentQuestionIndex === 0}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </Button>
                        
                        <button
                            onClick={() => setIsMobileNavOpen(true)}
                            className="md:hidden bg-muted hover:bg-muted/80 h-10 px-3 rounded-xl flex items-center justify-center font-bold text-xs tabular-nums text-foreground border border-border/60 transition-colors"
                        >
                            {currentQuestionIndex + 1} / {questions.length}
                        </button>

                        <div className="hidden md:flex bg-muted/60 h-11 px-4 rounded-xl items-center justify-center font-bold text-xs text-muted-foreground border border-border/50">
                            {currentQuestionIndex + 1} / {questions.length}
                        </div>

                        <Button
                            variant="outline"
                            className="h-10 sm:h-11 px-3 sm:px-5 rounded-xl border-border/80 text-foreground font-bold text-xs gap-1.5 transition-all active:scale-95"
                            onClick={() => goToQuestion(currentQuestionIndex + 1)}
                            disabled={currentQuestionIndex === questions.length - 1}
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Right: Submit Button */}
                    <Button
                        className="h-10 sm:h-11 px-4 sm:px-7 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all active:scale-95 gap-2"
                        onClick={() => setShowSubmitModal(true)}
                        disabled={isSubmitting}
                    >
                        <Send className="w-3.5 h-3.5 hidden sm:inline" />
                        <span>{isSubmitting ? "Finalizing..." : "Submit Exam"}</span>
                    </Button>
                </div>
            </div>

            {/* Floating Offline Sync Indicator */}
            {offlineSyncPending && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-600 font-bold text-xs">
                    <WifiOff className="w-4 h-4 shrink-0" />
                    <span>Responses cached offline.</span>
                    <Button
                        size="sm"
                        onClick={() => {
                            const timeTaken = (exam.duration * 60) - timeLeft;
                            submitFinalAssessment(answers, timeTaken);
                        }}
                        disabled={isSubmitting}
                        className="h-7 px-3 rounded-xl bg-slate-950 text-white hover:bg-slate-900 text-[10px] font-black uppercase tracking-wider shadow-xs"
                    >
                        {isSubmitting ? "Syncing..." : "Sync Now"}
                    </Button>
                </div>
            )}

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
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Navigation Map</h3>
                    <Badge className="bg-primary/10 text-primary border-none rounded-lg px-2 py-0.5 font-bold text-[10px]">{answeredCount}/{questions.length}</Badge>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="grid grid-cols-5 gap-2.5 sm:gap-3 place-items-center">
                    {questions.map((q: any, idx: number) => {
                        const isAnswered = !!answers[q.id];
                        const isCurrent = idx === currentIdx;
                        const isFlagged = flagged.includes(q.id);

                        return (
                            <button
                                key={q.id}
                                onClick={() => onSelect(idx)}
                                className={cn(
                                    "relative w-9 h-9 sm:w-10 sm:h-10 aspect-square rounded-full text-xs font-bold flex items-center justify-center transition-all duration-200 select-none",
                                    isCurrent 
                                        ? "scale-105 shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background z-10" 
                                        : "hover:scale-105 active:scale-95",
                                    isAnswered
                                        ? "bg-primary text-primary-foreground font-black shadow-xs"
                                        : "bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700",
                                    isFlagged && !isAnswered && "bg-orange-50 text-orange-600 border border-orange-300 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-400"
                                )}
                            >
                                {idx + 1}
                                {isFlagged && (
                                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 rounded-full border border-background shadow-xs" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Styled Legend with exact circular badges */}
                <div className="mt-8 pt-6 border-t border-dashed border-border/60 grid grid-cols-2 gap-y-3 gap-x-2">
                    {[
                        { color: "bg-primary shadow-xs", label: "Answered" },
                        { color: "bg-slate-100 dark:bg-zinc-800 text-slate-400", label: "Pending" },
                        { color: "bg-orange-500 shadow-xs", label: "Flagged" },
                        { color: "border-2 border-primary bg-background", label: "In Focus" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={cn("w-3.5 h-3.5 rounded-full shrink-0", item.color)} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SubmitConfirmationModal({ isOpen, setIsOpen, onSubmit, isSubmitting, answeredCount, totalCount, flaggedCount }: any) {
    const unattempted = totalCount - answeredCount;
    const progressPercent = Math.round((answeredCount / (totalCount || 1)) * 100);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[460px] w-[calc(100vw-32px)] p-0 overflow-hidden border border-border/70 shadow-2xl bg-card rounded-3xl">
                <div className="p-6 sm:p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-3">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-xs">
                            <Send className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider mb-2">
                                Ready to Finalize
                            </Badge>
                            <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
                                Confirm Submission
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                                Please review your progress summary before submitting your assessment.
                            </DialogDescription>
                        </div>
                    </div>

                    {/* 3 Metric Cards */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                        <div className="text-center p-3 sm:p-3.5 rounded-2xl bg-primary/5 border border-primary/15 dark:bg-primary/10">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Answered</p>
                            <p className="text-xl sm:text-2xl font-black text-foreground">{answeredCount}</p>
                        </div>
                        <div className="text-center p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Flagged</p>
                            <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{flaggedCount}</p>
                        </div>
                        <div className="text-center p-3 sm:p-3.5 rounded-2xl bg-muted/60 border border-border/60">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Pending</p>
                            <p className="text-xl sm:text-2xl font-black text-foreground">{unattempted}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 bg-muted/30 p-3 rounded-2xl border border-border/50">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                            <span>Exam Completion</span>
                            <span className="text-foreground font-bold">{progressPercent}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-300 rounded-full" 
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Pending Advisory Notice */}
                    {unattempted > 0 && (
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                                You have <strong className="font-bold">{unattempted} unanswered question{unattempted > 1 ? 's' : ''}</strong> remaining. You can return to answer them or proceed to finalize.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
                        <Button
                            variant="outline"
                            className="h-11 sm:h-12 flex-1 rounded-xl font-bold text-xs border-border/80 text-foreground hover:bg-muted"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                        >
                            Return & Review
                        </Button>
                        <Button
                            className="h-11 sm:h-12 flex-1 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 gap-2"
                            onClick={onSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Confirm Submission
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
