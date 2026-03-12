"use client"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitExamAction } from "./actions";

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
}

export function ExamTaker({ examId, title, durationMinutes, questions, studentId }: ExamTakerProps) {
    // Map question IDs to selected option strings
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeftInSeconds, setTimeLeftInSeconds] = useState(durationMinutes * 60);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasSubmittedRef = useRef(false);

    // Initial load tracking
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;

    useEffect(() => {
        if (timeLeftInSeconds <= 0) {
            handleAutoSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeftInSeconds((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeftInSeconds]);

    // Anti-Cheat Handlers
    useEffect(() => {
        // Auto-submit on tab switch
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden" && !hasSubmittedRef.current) {
                hasSubmittedRef.current = true;
                forceSubmit();
            }
        };

        // Auto-submit on reload/close via sendBeacon
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!hasSubmittedRef.current) {
                hasSubmittedRef.current = true;
                const timeElapsed = (durationMinutes * 60) - timeLeftInSeconds;
                const payload = JSON.stringify({ examId, studentId, answers, timeTaken: timeElapsed });
                navigator.sendBeacon('/api/exam/submit', payload);
            }
            e.preventDefault();
            e.returnValue = "";
        };

        // Auto-submit on back button
        const handlePopState = () => {
            if (!hasSubmittedRef.current) {
                hasSubmittedRef.current = true;
                forceSubmit();
            }
        };

        // Push a state so back button triggers popstate
        window.history.pushState(null, '', window.location.href);

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [answers, timeLeftInSeconds]);

    // Force submit (used by anti-cheat handlers)
    const forceSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const timeElapsed = (durationMinutes * 60) - timeLeftInSeconds;
        await submitExamAction(examId, answers, timeElapsed);
    };

    // Format time helper
    const getFormattedTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isWarningTime = timeLeftInSeconds < 300 && timeLeftInSeconds > 0;

    const handleAnswerSelect = (questionId: string, option: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: option
        }));
    };

    const handleAutoSubmit = async () => {
        if (isSubmitting || hasSubmittedRef.current) return;
        hasSubmittedRef.current = true;
        setIsSubmitting(true);
        await submitExamAction(examId, answers, durationMinutes * 60);
    };

    const handleManualSubmit = async () => {
        if (!confirm("Are you sure you want to finish and submit your exam?")) return;
        hasSubmittedRef.current = true;
        setIsSubmitting(true);
        const timeElapsed = (durationMinutes * 60) - timeLeftInSeconds;
        await submitExamAction(examId, answers, timeElapsed);
    };

    return (
        <div className="max-w-4xl mx-auto pb-32">
            <div className="flex items-center justify-between gap-3 sm:gap-4 bg-card rounded-xl border p-3 sm:p-4 shadow-sm mb-6 sticky top-2 sm:top-4 z-40">
                <div className="flex-1 min-w-0 pr-2">
                    <h1 className="text-base sm:text-xl font-bold truncate">{title}</h1>
                    <p className="text-sm text-muted-foreground hidden sm:block mt-1">
                        Answered: {answeredCount} / {totalQuestions}
                    </p>
                </div>

                <div className={cn(
                    "flex shrink-0 items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-mono text-sm sm:text-lg font-bold min-w-[90px] sm:min-w-[140px] justify-center transition-colors",
                    isWarningTime ? "bg-destructive/10 text-destructive border border-destructive/20 animate-pulse" : "bg-primary/10 text-primary"
                )}>
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    {getFormattedTime(timeLeftInSeconds)}
                </div>
            </div>

            <div className="space-y-8">
                {questions.map((q, index) => (
                    <Card key={q.id} id={`q-${index}`} className={cn(
                        "scroll-m-24 border transition-colors",
                        answers[q.id] ? "border-primary/40 bg-primary/5" : "border-muted"
                    )}>
                        <CardHeader className="flex flex-row gap-3 sm:gap-4 space-y-0 p-4 sm:p-6 pb-4 sm:pb-4">
                            <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">
                                {index + 1}
                            </div>
                            <div className="space-y-3 sm:space-y-4 w-full min-w-0">
                                <CardTitle className="text-base sm:text-lg leading-relaxed">{q.text}</CardTitle>
                                {q.imageUrl && (
                                    <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border">
                                        {/* Using standard img for broad compatibility given external URLs */}
                                        <img src={q.imageUrl} alt="Reference" className="object-contain w-full h-full bg-slate-100 dark:bg-slate-900" />
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
                                    <div key={optIdx} className="flex items-start sm:items-center space-x-3">
                                        <RadioGroupItem value={opt} id={`${q.id}-${optIdx}`} className="w-5 h-5 mt-0.5 sm:mt-0" />
                                        <Label htmlFor={`${q.id}-${optIdx}`} className="text-sm sm:text-base cursor-pointer hover:bg-muted/50 w-full py-2 px-3 rounded-md transition-colors leading-relaxed">
                                            {opt}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Sticky Bottom Actions - adjusted for mobile nav */}
            <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="max-w-4xl mx-auto flex items-center justify-center sm:justify-between">

                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                        {totalQuestions - answeredCount > 0 ? (
                            <>
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <span className="text-amber-600 dark:text-amber-500 font-medium">
                                    {totalQuestions - answeredCount} questions remaining
                                </span>
                            </>
                        ) : (
                            <span className="text-green-600 dark:text-green-500 font-medium">All answered!</span>
                        )}
                    </div>

                    <Button
                        size="lg"
                        onClick={handleManualSubmit}
                        disabled={isSubmitting}
                        className={cn(
                            "font-black px-8 shadow-xl w-full sm:w-auto h-12 text-sm uppercase tracking-widest transition-all",
                            answeredCount === totalQuestions
                                ? "bg-success hover:bg-success/90 text-white shadow-success/20"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                        )}
                    >
                        {isSubmitting ? "Submitting..." : "Finish & Submit"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
