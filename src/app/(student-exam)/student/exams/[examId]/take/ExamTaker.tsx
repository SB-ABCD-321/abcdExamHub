"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
    Clock, 
    AlertTriangle, 
    Flag, 
    Menu, 
    CheckCircle2, 
    ArrowLeft, 
    ArrowRight,
    Maximize2,
    Lock,
    AlertCircle,
    Wifi,
    WifiOff,
    RefreshCw,
    Loader2
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { submitExamAction } from "./actions";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Question = {
    id: string;
    text: string;
    options: string[];
    imageUrl?: string | null;
};

interface ExamTakerProps {
    examId: string;
    title: string;
    durationMinutes: number;
    questions: Question[];
    studentId: string;
    mode?: "classic" | "premium";
}

export function ExamTaker({ examId, title, durationMinutes, questions, studentId, mode = "classic" }: ExamTakerProps) {
    const offlineDraftKey = `offline_answers_${examId}_${studentId}`;
    const offlineSessionKey = `offline_session_${examId}_${studentId}`;
    const offlinePendingKey = `offline_pending_submit_${examId}_${studentId}`;

    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeftInSeconds, setTimeLeftInSeconds] = useState(durationMinutes * 60);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isFullscreenWarning, setIsFullscreenWarning] = useState(false);
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [isPendingOfflineSubmit, setIsPendingOfflineSubmit] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const router = useRouter();

    const hasSubmittedRef = useRef(false);
    const hasStartedRef = useRef(hasStarted);
    const timeLeftRef = useRef(timeLeftInSeconds);
    const answersRef = useRef(answers);
    const isOnlineRef = useRef(isOnline);
    
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;

    // Track online/offline status and auto-sync pending submission
    useEffect(() => {
        if (typeof window === "undefined") return;
        setIsOnline(navigator.onLine);
        isOnlineRef.current = navigator.onLine;

        const handleOnline = () => {
            setIsOnline(true);
            isOnlineRef.current = true;
            toast.success("Internet connection restored!", { duration: 3000 });
            // Attempt auto-sync if pending
            try {
                const pending = localStorage.getItem(offlinePendingKey);
                if (pending) {
                    syncPendingSubmission();
                }
            } catch (e) {}
        };

        const handleOffline = () => {
            setIsOnline(false);
            isOnlineRef.current = false;
            toast.warning("Network connection lost. Offline mode active — responses saved locally.", { duration: 5000 });
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [offlinePendingKey]);

    // Restore answers and active session timer from offline cache on mount
    useEffect(() => {
        try {
            // 1. Check if there is an unsubmitted pending payload
            const pending = localStorage.getItem(offlinePendingKey);
            if (pending) {
                setIsPendingOfflineSubmit(true);
            }

            // 2. Restore saved answers
            const savedAnswers = localStorage.getItem(offlineDraftKey);
            if (savedAnswers) {
                const parsed = JSON.parse(savedAnswers);
                if (parsed && typeof parsed === "object") {
                    setAnswers(prev => ({ ...parsed, ...prev }));
                }
            }

            // 3. Restore session timer & navigation position
            const savedSession = localStorage.getItem(offlineSessionKey);
            if (savedSession) {
                const session = JSON.parse(savedSession);
                if (session && session.targetEndTime) {
                    const remainingSeconds = Math.max(0, Math.round((session.targetEndTime - Date.now()) / 1000));
                    if (remainingSeconds > 0) {
                        setTimeLeftInSeconds(remainingSeconds);
                        setHasStarted(true);
                        if (typeof session.currentIndex === "number") setCurrentIndex(session.currentIndex);
                        if (Array.isArray(session.flagged)) setFlaggedQuestions(session.flagged);
                    } else {
                        // Time elapsed while offline or away
                        setTimeLeftInSeconds(0);
                        setHasStarted(true);
                        executeSubmission(durationMinutes * 60, true);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to restore offline state:", e);
        }
    }, [offlineDraftKey, offlineSessionKey, offlinePendingKey]);

    // Sync Refs (for event listeners)
    useEffect(() => { hasStartedRef.current = hasStarted; }, [hasStarted]);
    useEffect(() => { timeLeftRef.current = timeLeftInSeconds; }, [timeLeftInSeconds]);
    useEffect(() => { answersRef.current = answers; }, [answers]);

    useEffect(() => {
        if (!hasStarted) return;
        if (timeLeftInSeconds <= 0) {
            handleAutoSubmit();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeftInSeconds((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeftInSeconds, hasStarted]);

    useEffect(() => {
        // Anti-Cheat: Auto-submit on tab switch
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden" && !hasSubmittedRef.current) {
                console.log("Anti-cheat: Visibility hidden - forcing submission");
                hasSubmittedRef.current = true;
                forceSubmit();
            }
        };

        // Anti-Cheat: Auto-submit on page reload/close
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!hasSubmittedRef.current) {
                hasSubmittedRef.current = true;
                const timeTaken = (durationMinutes * 60) - timeLeftRef.current;
                const payload = JSON.stringify({ 
                    examId, 
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
            if (!hasSubmittedRef.current) {
                console.log("Anti-cheat: Back button intercepted - forcing submission");
                hasSubmittedRef.current = true;
                forceSubmit();
            }
        };

        // Full Screen Exit Detection
        const handleFullscreenChange = () => {
            const doc = document as any;
            const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
            if (!isFullscreen && hasStartedRef.current && !hasSubmittedRef.current) {
                console.log("Anti-cheat: Fullscreen exited - showing warning");
                setIsFullscreenWarning(true);
            }
        };

        window.history.pushState(null, '', window.location.href);

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

    const handleStartExam = async () => {
        await enterFullscreen();
        const now = Date.now();
        const targetEndTime = now + (durationMinutes * 60 * 1000);
        try {
            localStorage.setItem(offlineSessionKey, JSON.stringify({
                startedAt: now,
                targetEndTime,
                currentIndex: 0,
                flagged: []
            }));
        } catch (e) {}
        setHasStarted(true);
    };

    const handleReturnToFullscreen = async () => {
        await enterFullscreen();
        setIsFullscreenWarning(false);
    };

    const executeSubmission = async (timeElapsed: number, isAuto: boolean = false) => {
        if (hasSubmittedRef.current && isSubmitting) return;
        hasSubmittedRef.current = true;
        setIsSubmitting(true);
        await exitFullscreen();

        const currentAnswers = answersRef.current;

        // If offline, lock and store to pending queue
        if (typeof window !== "undefined" && (!navigator.onLine || !isOnlineRef.current)) {
            try {
                localStorage.setItem(offlinePendingKey, JSON.stringify({
                    examId,
                    studentId,
                    answers: currentAnswers,
                    timeElapsed,
                    isAuto,
                    savedAt: Date.now()
                }));
            } catch (e) {}
            setIsPendingOfflineSubmit(true);
            setIsSubmitting(false);
            toast.warning("Network offline. Exam responses are locked and saved on your device.");
            return;
        }

        try {
            const res = await submitExamAction(examId, currentAnswers, timeElapsed);
            if (res?.success) {
                try {
                    localStorage.removeItem(offlineDraftKey);
                    localStorage.removeItem(offlineSessionKey);
                    localStorage.removeItem(offlinePendingKey);
                } catch (e) {}
                if (res.resultPublishMode === 'INSTANT' && res.newResultId) {
                    router.push(`/student/results/${res.newResultId}`);
                } else {
                    router.push(res.redirectUrl || `/student/exams/${examId}/thank-you`);
                }
            } else {
                throw new Error("Submission could not be recorded.");
            }
        } catch (err: any) {
            console.error("Submission failed, storing locally:", err);
            try {
                localStorage.setItem(offlinePendingKey, JSON.stringify({
                    examId,
                    studentId,
                    answers: currentAnswers,
                    timeElapsed,
                    isAuto,
                    savedAt: Date.now()
                }));
            } catch (e) {}
            setIsPendingOfflineSubmit(true);
            setIsSubmitting(false);
            toast.error("Network error during submission. Your responses are safely backed up locally.");
        }
    };

    const syncPendingSubmission = async () => {
        try {
            const pendingStr = localStorage.getItem(offlinePendingKey);
            if (!pendingStr) return;
            const pending = JSON.parse(pendingStr);
            if (!pending || !pending.answers) return;

            setIsSyncing(true);
            const res = await submitExamAction(examId, pending.answers, pending.timeElapsed || durationMinutes * 60);
            if (res?.success) {
                try {
                    localStorage.removeItem(offlineDraftKey);
                    localStorage.removeItem(offlineSessionKey);
                    localStorage.removeItem(offlinePendingKey);
                } catch (e) {}
                setIsPendingOfflineSubmit(false);
                toast.success("Exam submitted successfully!");
                if (res.resultPublishMode === 'INSTANT' && res.newResultId) {
                    router.push(`/student/results/${res.newResultId}`);
                } else {
                    router.push(res.redirectUrl || `/student/exams/${examId}/thank-you`);
                }
            } else {
                toast.error("Submission retry failed. Please verify internet connection.");
            }
        } catch (err) {
            console.error("Sync error:", err);
            toast.error("Submission retry encountered a network error. Please try again.");
        } finally {
            setIsSyncing(false);
        }
    };

    const forceSubmit = async () => {
        const timeElapsed = (durationMinutes * 60) - timeLeftRef.current;
        await executeSubmission(timeElapsed, false);
    };

    const handleAutoSubmit = async () => {
        await executeSubmission(durationMinutes * 60, true);
    };

    const handleManualSubmit = async () => {
        const timeElapsed = (durationMinutes * 60) - timeLeftInSeconds;
        await executeSubmission(timeElapsed, false);
    };

    const getFormattedTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isWarningTime = timeLeftInSeconds < 300 && timeLeftInSeconds > 0;

    const handleAnswerSelect = (questionId: string, option: string) => {
        setAnswers(prev => {
            const next = { ...prev };
            if (!option) delete next[questionId];
            else next[questionId] = option;
            try {
                localStorage.setItem(offlineDraftKey, JSON.stringify(next));
            } catch (e) {
                console.error("Failed to cache answer locally:", e);
            }
            return next;
        });
    };

    const saveSessionMeta = (newIdx: number, newFlagged: string[]) => {
        try {
            const current = localStorage.getItem(offlineSessionKey);
            if (current) {
                const parsed = JSON.parse(current);
                parsed.currentIndex = newIdx;
                parsed.flagged = newFlagged;
                localStorage.setItem(offlineSessionKey, JSON.stringify(parsed));
            }
        } catch (e) {}
    };

    const toggleFlag = (questionId: string) => {
        setFlaggedQuestions(prev => {
            const next = prev.includes(questionId)
                ? prev.filter(id => id !== questionId)
                : [...prev, questionId];
            saveSessionMeta(currentIndex, next);
            return next;
        });
    };

    const goToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentIndex(index);
            saveSessionMeta(index, flaggedQuestions);
            if (mode === "classic") {
                const element = document.getElementById(`q-${index}`);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        }
    };

    // Keyboard Shortcuts for enhanced student examination experience
    useEffect(() => {
        if (!hasStarted || isSubmitModalOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

            const q = questions[currentIndex];
            if (!q) return;

            const key = e.key.toUpperCase();
            let optionIndex = -1;
            if (key >= '1' && key <= '4') {
                optionIndex = parseInt(key) - 1;
            } else if (key === 'A') optionIndex = 0;
            else if (key === 'B') optionIndex = 1;
            else if (key === 'C') optionIndex = 2;
            else if (key === 'D') optionIndex = 3;

            if (optionIndex >= 0 && optionIndex < q.options.length) {
                const opt = q.options[optionIndex];
                if (answers[q.id] === opt) handleAnswerSelect(q.id, "");
                else handleAnswerSelect(q.id, opt);
                e.preventDefault();
                return;
            }

            if (e.key === "ArrowRight" || key === "N") {
                if (currentIndex < questions.length - 1) {
                    goToQuestion(currentIndex + 1);
                    e.preventDefault();
                }
            } else if (e.key === "ArrowLeft" || key === "P") {
                if (currentIndex > 0) {
                    goToQuestion(currentIndex - 1);
                    e.preventDefault();
                }
            } else if (key === "F") {
                toggleFlag(q.id);
                e.preventDefault();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [hasStarted, currentIndex, questions, answers, isSubmitModalOpen]);


    if (isPendingOfflineSubmit) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 sm:p-6 font-sans antialiased">
                <Card className="max-w-md w-full border border-amber-500/30 shadow-2xl bg-card rounded-3xl overflow-hidden relative">
                    <div className="p-7 sm:p-8 space-y-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
                            <WifiOff className="w-8 h-8 text-amber-600" />
                        </div>
                        <div className="space-y-2">
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                                Offline Sync Pending
                            </Badge>
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Exam Responses Locked & Saved</h2>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                                Your exam was completed, but your device is offline or experienced a network interruption. All answers and time metrics are 100% saved locally on this browser.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-muted/50 border text-xs font-semibold">
                            {isOnline ? (
                                <span className="flex items-center gap-1.5 text-emerald-600">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Internet Connected — Ready to Sync
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-amber-600">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    Awaiting Network Reconnection...
                                </span>
                            )}
                        </div>

                        <div className="space-y-3 pt-2">
                            <Button 
                                size="lg" 
                                disabled={isSyncing}
                                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-md gap-2"
                                onClick={syncPendingSubmission}
                            >
                                {isSyncing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting Responses...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Submit Exam Now
                                    </>
                                )}
                            </Button>
                            <p className="text-[11px] text-muted-foreground">
                                Do not clear browser cookies or site data until your submission is confirmed.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    if (questions.length === 0) {
        return <div className="p-12 text-center text-muted-foreground font-medium">This exam has no questions configured.</div>;
    }

    if (!hasStarted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 sm:p-6 font-sans antialiased">
                <Card className="max-w-md w-full border border-border/60 shadow-xl bg-card rounded-3xl overflow-hidden">
                    <div className="p-7 sm:p-8 space-y-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-xs">
                            <Maximize2 className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider mb-2">
                                Examination Session
                            </Badge>
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
                            <p className="text-xs font-semibold text-primary mt-1">Duration: {durationMinutes} Minutes</p>
                        </div>

                        <div className="flex items-start gap-3 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/40 text-left">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-medium leading-relaxed">
                                <strong className="font-bold">Anti-Cheat Protocol:</strong> This assessment enforces active full-screen focus. Exiting full-screen or switching tabs will be logged as proctoring infractions.
                            </span>
                        </div>

                        <Button 
                            size="lg" 
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
                            onClick={handleStartExam}
                        >
                            <Maximize2 className="w-4 h-4" />
                            Enter Full Screen & Start
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-32 relative">
            {isFullscreenWarning && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
                    <Card className="max-w-md w-full border border-rose-500/30 shadow-2xl bg-card rounded-3xl overflow-hidden relative">
                        <div className="p-7 sm:p-8 space-y-5 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500 shadow-xs">
                                <AlertCircle className="w-8 h-8 text-rose-500 animate-pulse" />
                            </div>
                            <div className="space-y-1.5">
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] font-bold uppercase tracking-wider">
                                    Proctoring Notice
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
                                    Return to Exam
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Header / Mobile Sticky Nav */}
            <div className="bg-card rounded-xl border p-3 sm:p-4 shadow-sm mb-6 sticky top-2 sm:top-4 z-40">
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                             <h1 className="text-base sm:text-xl font-bold truncate">{title}</h1>
                             {isOnline ? (
                                <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold py-0.5 px-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Synced
                                </Badge>
                             ) : (
                                <Badge variant="outline" className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800 text-[10px] font-semibold py-0.5 px-2">
                                    <WifiOff className="w-3 h-3 text-amber-600 animate-bounce" />
                                    Offline (Saved)
                                </Badge>
                             )}
                             <div className="md:hidden">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8 px-2 rounded-lg gap-2 border-primary/20">
                                            <Menu className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Map</span>
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="w-[300px] p-0 overflow-hidden" aria-describedby="map-description">
                                        <div className="sr-only">
                                            <SheetHeader>
                                                <SheetTitle>Examination Navigation Map</SheetTitle>
                                                <SheetDescription id="map-description">
                                                    Use this map to navigate between exam questions and track your progress.
                                                </SheetDescription>
                                            </SheetHeader>
                                        </div>
                                        <QuestionPalette
                                            questions={questions}
                                            answers={answers}
                                            currentIdx={currentIndex}
                                            flagged={flaggedQuestions}
                                            onSelect={goToQuestion}
                                        />
                                    </SheetContent>
                                </Sheet>
                             </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Answered: {answeredCount} / {totalQuestions}
                        </p>
                    </div>

                    <div className={cn(
                        "flex shrink-0 items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-mono text-sm sm:text-lg font-bold min-w-[90px] sm:min-w-[140px] justify-center transition-colors border",
                        isWarningTime ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                        {getFormattedTime(timeLeftInSeconds)}
                    </div>
                </div>
                {/* Mobile Progress */}
                <div className="mt-3 md:hidden">
                    <Progress value={(answeredCount / totalQuestions) * 100} className="h-1.5" />
                </div>
            </div>

            <div className="grid md:grid-cols-[1fr_300px] gap-6 lg:gap-8 items-start">
                {/* Main Content Area */}
                <div className="min-w-0 space-y-6">
                    {mode === "premium" ? (
                        <div className="space-y-8">
                            {(() => {
                                const q = questions[currentIndex];
                                const index = currentIndex;
                                if (!q) return null;
                                return (
                                    <Card id={`q-${index}`} className={cn(
                                        "border shadow-xl shadow-indigo-500/5 transition-all overflow-hidden",
                                        answers[q.id] ? "border-primary/40 bg-primary/5" : "border-slate-200 dark:border-zinc-800"
                                    )}>
                                        <CardHeader className="flex flex-col gap-4 p-6 sm:p-8 pb-6">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold text-[10px] sm:text-xs tracking-widest uppercase border border-primary/10">
                                                    Question {index + 1} of {totalQuestions}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFlag(q.id);
                                                    }}
                                                    className={cn(
                                                        "gap-2 px-3 rounded-lg h-8 transition-all shrink-0 border",
                                                        flaggedQuestions.includes(q.id)
                                                            ? "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/30 dark:border-orange-900/40"
                                                            : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                                                    )}
                                                >
                                                    <Flag className={cn("w-3.5 h-3.5", flaggedQuestions.includes(q.id) && "fill-orange-600")} />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">{flaggedQuestions.includes(q.id) ? "Flagged" : "Flag"}</span>
                                                </Button>
                                            </div>
                                            <div className="space-y-4 w-full min-w-0 flex-1">
                                                <CardTitle className="text-xl sm:text-2xl leading-relaxed">{q.text}</CardTitle>
                                                {q.imageUrl && (
                                                    <div className="relative w-full max-w-2xl h-64 rounded-xl overflow-hidden border shadow-sm mt-4 bg-muted/20">
                                                        <Image 
                                                            src={q.imageUrl} 
                                                            alt={`Question ${index + 1} Diagram`} 
                                                            fill 
                                                            sizes="(max-width: 768px) 100vw, 700px" 
                                                            className="object-contain p-2" 
                                                            loading="lazy" 
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="px-6 sm:px-8 pb-8">
                                             <RadioGroup
                                                value={answers[q.id] || ""}
                                                onValueChange={(val) => handleAnswerSelect(q.id, val)}
                                                className="space-y-3"
                                            >
                                                {q.options.map((opt, optIdx) => {
                                                    const isSelected = answers[q.id] === opt;
                                                    const letter = String.fromCharCode(65 + optIdx);
                                                    return (
                                                        <div key={optIdx} className={cn(
                                                            "flex items-center space-x-3.5 border rounded-2xl p-4 transition-all cursor-pointer",
                                                            isSelected 
                                                                ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20" 
                                                                : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
                                                        )} onClick={() => {
                                                            if (answers[q.id] === opt) handleAnswerSelect(q.id, ""); 
                                                            else handleAnswerSelect(q.id, opt);
                                                        }}>
                                                            <div className={cn(
                                                                "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all shrink-0",
                                                                isSelected
                                                                    ? "bg-primary text-primary-foreground shadow-xs"
                                                                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                                            )}>
                                                                {letter}
                                                            </div>
                                                            <Label htmlFor={`${q.id}-${optIdx}`} className="text-sm sm:text-base cursor-pointer flex-1 leading-relaxed font-semibold pointer-events-none text-foreground">
                                                                {opt}
                                                            </Label>
                                                            <RadioGroupItem value={opt} id={`${q.id}-${optIdx}`} className="sr-only" />
                                                            {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                                                        </div>
                                                    );
                                                })}
                                            </RadioGroup>
                                            <div className="mt-8 flex items-center justify-between border-t pt-6 gap-3">
                                                <Button variant="outline" size="lg" disabled={currentIndex === 0} onClick={() => goToQuestion(currentIndex - 1)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-4 flex-1 sm:flex-none h-12">
                                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                                    Prev
                                                </Button>
                                                {currentIndex === totalQuestions - 1 ? (
                                                    <Button size="lg" onClick={() => setIsSubmitModalOpen(true)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 flex-1 sm:flex-none shadow-md bg-green-600 hover:bg-green-700 text-white h-12">
                                                        Finish
                                                    </Button>
                                                ) : (
                                                    <Button size="lg" onClick={() => goToQuestion(currentIndex + 1)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 flex-1 sm:flex-none shadow-md h-12">
                                                        Next
                                                        <ArrowRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })()}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {questions.map((q, index) => (
                                <Card key={q.id} id={`q-${index}`} className={cn(
                                    "scroll-m-24 border transition-colors overflow-hidden",
                                    answers[q.id] ? "border-primary/40 bg-primary/5 shadow-sm" : "border-muted"
                                )}>
                                    <CardHeader className="flex flex-col gap-3 p-4 sm:p-6 pb-4 sm:pb-4">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-sm border border-primary/10">
                                                {index + 1}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFlag(q.id);
                                                }}
                                                className={cn(
                                                    "gap-2 px-3 rounded-lg h-8 transition-all shrink-0 border",
                                                    flaggedQuestions.includes(q.id)
                                                        ? "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/30 dark:border-orange-900/40"
                                                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                                                )}
                                            >
                                                <Flag className={cn("w-3.5 h-3.5", flaggedQuestions.includes(q.id) && "fill-orange-600")} />
                                                <span className="text-[10px] font-black uppercase tracking-wider">{flaggedQuestions.includes(q.id) ? "Flagged" : "Flag"}</span>
                                            </Button>
                                        </div>
                                        <div className="space-y-3 sm:space-y-4 w-full min-w-0">
                                            <CardTitle className="text-base sm:text-lg leading-relaxed">{q.text}</CardTitle>
                                            {q.imageUrl && (
                                                <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border bg-muted/20">
                                                    <Image 
                                                        src={q.imageUrl} 
                                                        alt={`Question ${currentIndex + 1} Diagram`} 
                                                        fill 
                                                        sizes="(max-width: 768px) 100vw, 500px" 
                                                        className="object-contain p-2" 
                                                        loading="lazy" 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pl-4 pr-4 sm:pl-[3.5rem] sm:pr-6 pb-4 sm:pb-6">
                                         <RadioGroup
                                            value={answers[q.id] || ""}
                                            onValueChange={(val) => handleAnswerSelect(q.id, val)}
                                            className="space-y-2.5"
                                        >
                                            {q.options.map((opt, optIdx) => {
                                                const isSelected = answers[q.id] === opt;
                                                const letter = String.fromCharCode(65 + optIdx);
                                                return (
                                                    <div 
                                                        key={optIdx} 
                                                        className={cn(
                                                            "flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all",
                                                            isSelected 
                                                                ? "border-primary bg-primary/5 shadow-2xs" 
                                                                : "border-border/60 hover:bg-muted/40 hover:border-primary/30"
                                                        )}
                                                        onClick={() => {
                                                            if (answers[q.id] === opt) handleAnswerSelect(q.id, "");
                                                            else handleAnswerSelect(q.id, opt);
                                                        }}
                                                    >
                                                        <div className={cn(
                                                            "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all",
                                                            isSelected
                                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                                        )}>
                                                            {letter}
                                                        </div>
                                                        <Label htmlFor={`${q.id}-${optIdx}`} className="text-sm cursor-pointer flex-1 leading-relaxed font-semibold pointer-events-none text-foreground">
                                                            {opt}
                                                        </Label>
                                                        <RadioGroupItem value={opt} id={`${q.id}-${optIdx}`} className="sr-only" />
                                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                                                    </div>
                                                );
                                            })}
                                        </RadioGroup>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Navigation (Desktop) */}
                <aside className="hidden md:block sticky top-24 self-start space-y-6">
                    <Card className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                        <QuestionPalette 
                            questions={questions}
                            answers={answers}
                            currentIdx={currentIndex}
                            flagged={flaggedQuestions}
                            onSelect={goToQuestion}
                        />
                    </Card>
                    <div className="p-1">
                         <Button
                            size="lg"
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-slate-900 dark:bg-primary dark:text-slate-950 text-white shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
                            onClick={() => setIsSubmitModalOpen(true)}
                        >
                            Finish Assessment
                        </Button>
                    </div>
                </aside>
            </div>

            {/* Sticky Bottom Actions (Mobile) */}
            <div className="fixed md:hidden bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex-1 flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Overall Progress</span>
                        <Progress value={(answeredCount / totalQuestions) * 100} className="h-1.5" />
                    </div>
                    <Button
                        size="lg"
                        className={cn(
                            "h-12 px-6 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all",
                            answeredCount === totalQuestions ? "bg-green-600 text-white" : "bg-primary text-primary-foreground"
                        )}
                        onClick={() => setIsSubmitModalOpen(true)}
                    >
                        Finish
                    </Button>
                </div>
            </div>

            {/* Submit Modal Overlay */}
            <SubmitModal 
                isOpen={isSubmitModalOpen}
                setIsOpen={setIsSubmitModalOpen}
                onSubmit={handleManualSubmit}
                isSubmitting={isSubmitting}
                answeredCount={answeredCount}
                totalCount={totalQuestions}
                flaggedCount={flaggedQuestions.length}
            />
        </div>
    );
}

function QuestionPalette({ questions, answers, currentIdx, flagged, onSelect }: any) {
    const answeredCount = Object.keys(answers).length;
    return (
        <div className="flex flex-col h-full">
            <div className="p-5 border-b space-y-1 bg-muted/20">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Navigation</h3>
                    <div className="text-[10px] font-bold px-2 py-0.5 bg-background rounded-full border">
                        {answeredCount}/{questions.length}
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground/80">Tap a number to jump</p>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh] scrollbar-hide">
                <div className="grid grid-cols-5 gap-2.5 place-items-center">
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
                                    isCurrent ? "scale-105 shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background z-10" : "hover:bg-muted/50 hover:scale-105 active:scale-95",
                                    isAnswered
                                        ? "bg-primary text-primary-foreground font-black shadow-xs"
                                        : isFlagged 
                                            ? "bg-orange-50 text-orange-600 border border-orange-300 dark:bg-orange-950/20 dark:border-orange-800"
                                            : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
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
                {/* Legend */}
                <div className="mt-8 space-y-3 pt-6 border-t border-dashed">
                    {[
                        { color: "bg-primary shadow-xs", label: "Answered" },
                        { color: "bg-orange-100 border border-orange-200", label: "Flagged" },
                        { color: "bg-muted/40 text-muted-foreground", label: "Pending" },
                        { color: "border-2 border-primary bg-background", label: "In Focus" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full shrink-0", item.color)} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SubmitModal({ isOpen, setIsOpen, onSubmit, isSubmitting, answeredCount, totalCount, flaggedCount }: any) {
    const unattempted = totalCount - answeredCount;
    const progressPercent = Math.round((answeredCount / (totalCount || 1)) * 100);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent side="bottom" className="h-auto max-w-lg mx-auto rounded-t-3xl border-t border-border/70 p-0 overflow-hidden outline-none bg-card">
                <div className="p-6 sm:p-8 space-y-6">
                    <div className="text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-xs">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider mb-2">
                                Ready to Finalize
                            </Badge>
                            <SheetTitle className="text-xl sm:text-2xl font-bold text-foreground">
                                Confirm Submission
                            </SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                                Please review your progress statistics before submitting your assessment.
                            </SheetDescription>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                        <div className="text-center p-3 rounded-2xl bg-primary/5 border border-primary/15 dark:bg-primary/10">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Answered</p>
                            <p className="text-xl sm:text-2xl font-black text-foreground">{answeredCount}</p>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Flagged</p>
                            <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{flaggedCount}</p>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-muted/60 border border-border/60">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Pending</p>
                            <p className="text-xl sm:text-2xl font-black text-foreground">{unattempted}</p>
                        </div>
                    </div>

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

                    {unattempted > 0 && (
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                                You have <strong className="font-bold">{unattempted} unanswered question{unattempted > 1 ? 's' : ''}</strong> remaining. You can return to answer them or proceed to finalize.
                            </p>
                        </div>
                    )}

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
                            {isSubmitting ? "Submitting..." : "Confirm Submission"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
