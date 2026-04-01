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
    AlertCircle
} from "lucide-react";
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
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeftInSeconds, setTimeLeftInSeconds] = useState(durationMinutes * 60);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isFullscreenWarning, setIsFullscreenWarning] = useState(false);
    const router = useRouter();

    const hasSubmittedRef = useRef(false);
    const hasStartedRef = useRef(hasStarted);
    const timeLeftRef = useRef(timeLeftInSeconds);
    const answersRef = useRef(answers);
    
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;

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
        setHasStarted(true);
    };

    const handleReturnToFullscreen = async () => {
        await enterFullscreen();
        setIsFullscreenWarning(false);
    };

    const forceSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        await exitFullscreen();
        const timeElapsed = (durationMinutes * 60) - timeLeftInSeconds;
        const res = await submitExamAction(examId, answers, timeElapsed);
        if (res?.success) {
            router.push(`/student/exams/${examId}/thank-you`);
        }
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
            setCurrentIndex(index);
            if (mode === "classic") {
                const element = document.getElementById(`q-${index}`);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        }
    };

    const handleAutoSubmit = async () => {
        if (isSubmitting || hasSubmittedRef.current) return;
        hasSubmittedRef.current = true;
        setIsSubmitting(true);
        await exitFullscreen();
        const res = await submitExamAction(examId, answers, durationMinutes * 60);
        if (res?.success) {
            router.push(res.redirectUrl || `/student/exams/${examId}/thank-you`);
        }
    };

    const handleManualSubmit = async () => {
        hasSubmittedRef.current = true;
        setIsSubmitting(true);
        await exitFullscreen();
        const timeElapsed = (durationMinutes * 60) - timeLeftInSeconds;
        const res = await submitExamAction(examId, answers, timeElapsed);
        if (res?.success) {
            if (res.resultPublishMode === 'INSTANT' && res.newResultId) {
                router.push(`/student/results/${res.newResultId}`);
            } else {
                router.push(res.redirectUrl || `/student/exams/${examId}/thank-you`);
            }
        }
    };

    if (questions.length === 0) {
        return <div className="p-12 text-center text-muted-foreground font-medium">This exam has no questions configured.</div>;
    }

    if (!hasStarted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
                <Card className="max-w-md w-full border-none shadow-2xl bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden">
                    <div className="bg-primary p-8 text-center">
                        <Maximize2 className="w-12 h-12 text-white mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-white px-2 uppercase tracking-tighter">Ready to Begin?</h2>
                    </div>
                    <CardContent className="p-8 space-y-6 text-center">
                        <div className="space-y-4 text-sm">
                            <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</p>
                            <p className="font-semibold text-primary">Duration: {durationMinutes} Minutes</p>
                            <div className="flex items-start justify-center gap-3 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 mt-4 text-left">
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span className="text-[11px] font-bold leading-relaxed">
                                    Anti-Cheat Warning: This exam requires Full Screen mode. Changing tabs or exiting full screen will be logged and may result in automatic submission.
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
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-32 relative">
            {isFullscreenWarning && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm p-6">
                    <Card className="max-w-md w-full border-red-500/20 shadow-2xl shadow-red-500/10 bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500 animate-pulse" />
                        <CardContent className="p-8 space-y-6 text-center mt-2">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Full Screen Exited!</h2>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
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

            {/* Header / Mobile Sticky Nav */}
            <div className="bg-card rounded-xl border p-3 sm:p-4 shadow-sm mb-6 sticky top-2 sm:top-4 z-40">
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                             <h1 className="text-base sm:text-xl font-bold truncate">{title}</h1>
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
                                                    <div className="relative w-full max-w-2xl h-64 rounded-xl overflow-hidden border shadow-sm mt-4 bg-white dark:bg-black">
                                                        <img src={q.imageUrl} alt="Reference" className="object-contain w-full h-full" />
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="px-6 sm:px-8 pb-8">
                                            <RadioGroup
                                                value={answers[q.id] || ""}
                                                onValueChange={(val) => handleAnswerSelect(q.id, val)}
                                                className="space-y-4"
                                            >
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className={cn(
                                                        "flex items-center space-x-4 border rounded-xl p-4 transition-all cursor-pointer hover:border-primary/50",
                                                        answers[q.id] === opt ? "border-primary bg-primary/5 shadow-sm" : "border-muted"
                                                    )} onClick={() => {
                                                        if (answers[q.id] === opt) handleAnswerSelect(q.id, ""); 
                                                        else handleAnswerSelect(q.id, opt);
                                                    }}>
                                                        <RadioGroupItem value={opt} id={`${q.id}-${optIdx}`} className="w-5 h-5 shrink-0 pointer-events-none" />
                                                        <Label htmlFor={`${q.id}-${optIdx}`} className="text-base cursor-pointer w-full leading-relaxed font-medium pointer-events-none">
                                                            {opt}
                                                        </Label>
                                                    </div>
                                                ))}
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
                                                <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border bg-white dark:bg-black">
                                                    <img src={q.imageUrl} alt="Reference" className="object-contain w-full h-full" />
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pl-4 pr-4 sm:pl-[3.5rem] sm:pr-6 pb-4 sm:pb-6">
                                        <RadioGroup
                                            value={answers[q.id] || ""}
                                            onValueChange={(val) => handleAnswerSelect(q.id, val)}
                                            className="space-y-3"
                                        >
                                            {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-start sm:items-center space-x-3 cursor-pointer group" onClick={() => {
                                                    if (answers[q.id] === opt) handleAnswerSelect(q.id, "");
                                                    else handleAnswerSelect(q.id, opt);
                                                }}>
                                                    <RadioGroupItem value={opt} id={`${q.id}-${optIdx}`} className="w-5 h-5 mt-0.5 sm:mt-0 shrink-0 pointer-events-none" />
                                                    <Label htmlFor={`${q.id}-${optIdx}`} className="text-sm sm:text-base group-hover:bg-muted/50 w-full py-2 px-3 rounded-md transition-colors leading-relaxed pointer-events-none">
                                                        {opt}
                                                    </Label>
                                                </div>
                                            ))}
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
                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q: any, idx: number) => {
                        const isAnswered = !!answers[q.id];
                        const isCurrent = idx === currentIdx;
                        const isFlagged = flagged.includes(q.id);
                        return (
                            <button
                                key={q.id}
                                onClick={() => onSelect(idx)}
                                className={cn(
                                    "relative h-10 w-full text-[11px] font-black rounded-lg flex items-center justify-center transition-all duration-200 border",
                                    isCurrent ? "scale-110 shadow-md ring-2 ring-primary ring-offset-1 z-10" : "hover:bg-muted/50 hover:scale-105",
                                    isAnswered
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : isFlagged 
                                            ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/40"
                                            : "bg-muted/30 text-muted-foreground border-transparent"
                                )}
                            >
                                {idx + 1}
                                {isFlagged && isAnswered && (
                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-background" />
                                )}
                            </button>
                        );
                    })}
                </div>
                {/* Legend */}
                <div className="mt-8 space-y-3 pt-6 border-t border-dashed">
                    {[
                        { color: "bg-primary", label: "Answered" },
                        { color: "bg-orange-100 border border-orange-200", label: "Flagged" },
                        { color: "bg-muted/30", label: "Pending" },
                        { color: "ring-2 ring-primary ring-offset-1", label: "Current" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-sm", item.color)} />
                            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/70">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SubmitModal({ isOpen, setIsOpen, onSubmit, isSubmitting, answeredCount, totalCount, flaggedCount }: any) {
    const unattempted = totalCount - answeredCount;
    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent side="bottom" className="h-auto rounded-t-[2.5rem] border-none p-0 overflow-hidden outline-none">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-primary dark:to-primary/80 p-8 text-white dark:text-slate-950 text-center">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-black mb-1 uppercase tracking-tighter text-inherit">Confirm Submission</SheetTitle>
                        <SheetDescription className="text-inherit opacity-70 text-xs font-medium">Please review your exam statistics before finalization.</SheetDescription>
                    </SheetHeader>
                </div>
                <div className="p-8 bg-background">
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="text-center p-4 rounded-2xl bg-muted/30 border border-muted-foreground/10">
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1">Answered</p>
                            <p className="text-2xl font-black">{answeredCount}</p>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40">
                            <p className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest mb-1">Flagged</p>
                            <p className="text-2xl font-black text-orange-600">{flaggedCount}</p>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-muted/30 border border-muted-foreground/10">
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1">Pending</p>
                            <p className="text-2xl font-black">{unattempted}</p>
                        </div>
                    </div>
                    {unattempted > 0 && (
                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 mb-8">
                            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
                                Warning: {unattempted} questions are still pending. These will be marked as incorrect if you submit now.
                            </p>
                        </div>
                    )}
                    <div className="flex gap-4">
                        <Button variant="ghost" className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-muted" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Review</Button>
                        <Button className="h-14 flex-1 rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/30 uppercase tracking-widest text-xs transition-all active:scale-[0.98]" onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Exam"}</Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
