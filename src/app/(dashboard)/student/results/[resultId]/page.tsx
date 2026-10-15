import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Trophy, 
    BarChart3, 
    Medal, 
    ArrowLeft, 
    ArrowRight,
    Zap, 
    Info, 
    History as HistoryIcon,
    Building2,
    Target,
    HelpCircle,
    UserCheck,
    Sparkles,
    ShieldCheck,
    FileText
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ResultActions } from "./ResultActions";

export default async function ExamResultPage(props: { params: Promise<{ resultId: string }> }) {
    const params = await props.params;
    const resultId = params.resultId;

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId }
    });

    if (!dbUser) return <div>User not found.</div>;

    const result = await db.examResult.findUnique({
        where: { id: resultId },
        include: {
            exam: {
                include: {
                    workspace: true,
                    _count: { select: { questions: true } },
                    questions: {
                        include: {
                            question: true
                        }
                    },
                    author: true
                }
            }
        }
    });

    if (!result || result.studentId !== dbUser.id) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
                <Card className="max-w-md w-full border border-border/80 shadow-xl bg-card rounded-3xl p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
                        <HistoryIcon className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-foreground">Record Not Found</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                            This result record does not exist or you do not have permission to view it.
                        </p>
                    </div>
                    <Link href="/student/results" className="block pt-2">
                        <Button variant="outline" className="w-full h-10 rounded-xl font-bold text-xs">
                            Return to Performance Vault
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const exam = result.exam as any;
    const isPublished = (() => {
        if (exam.resultPublishMode === "EXAM_END") {
            return exam.endTime ? new Date() > new Date(exam.endTime) : false;
        }
        if (exam.resultPublishMode === "CUSTOM") {
            return exam.customPublishDate ? new Date() > new Date(exam.customPublishDate) : false;
        }
        return true; // INSTANT
    })();

    if (!isPublished) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
                <Card className="max-w-md w-full border border-amber-500/30 shadow-xl bg-card rounded-3xl p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                            Evaluation Pending
                        </Badge>
                        <h2 className="text-2xl font-bold text-foreground">Official Results In Review</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                            The evaluation for "{exam.title}" will be released by the examination board on the scheduled publish date. Check your vault periodically for updates.
                        </p>
                    </div>
                    <Link href="/student/results" className="block pt-2">
                        <Button variant="outline" className="w-full h-10 rounded-xl font-bold text-xs">
                            Back to Performance Vault
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const totalQuestions = exam._count?.questions || exam.questions?.length || 0;
    const safeMarksPerQuestion = exam.marksPerQuestion ?? 1;
    const safePassMarks = exam.passMarks ?? 0;
    const maxMarks = safeMarksPerQuestion * totalQuestions;
    const isPass = result.score >= safePassMarks;
    const percentage = maxMarks > 0 ? Math.round((result.score / maxMarks) * 100) : 0;

    // Determine Merit Cohort Rank
    const allResults = await db.examResult.findMany({
        where: { examId: exam.id },
        orderBy: [
            { score: 'desc' },
            { timeTaken: 'asc' }
        ],
        select: { id: true }
    });

    const rank = allResults.findIndex(r => r.id === result.id) + 1;
    const totalParticipants = allResults.length;

    const getFormattedTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    // Calculate Archival Status
    const settings = await db.siteSetting.findFirst() as any;
    const accessDays = settings?.resultDetailedAccessDays ?? 30;

    const publishDate = (() => {
        if (exam.resultPublishMode === "EXAM_END") return exam.endTime ? new Date(exam.endTime) : new Date(result.createdAt);
        if (exam.resultPublishMode === "CUSTOM") return exam.customPublishDate ? new Date(exam.customPublishDate) : new Date(result.createdAt);
        return new Date(result.createdAt);
    })();

    const archivalDate = new Date(publishDate);
    archivalDate.setDate(archivalDate.getDate() + accessDays);
    const isArchived = new Date() > archivalDate;
    const studentFullName = [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") || "Student";

    // Question statistics
    const studentAnswers = ((result as any).answers || {}) as Record<string, string>;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    if (exam.questions) {
        for (const eq of exam.questions) {
            const ans = studentAnswers[eq.question.id];
            if (!ans) {
                unansweredCount++;
            } else if (ans === eq.question.correctAnswer) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16 px-4">
            {/* Top Navigation & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <Link 
                    href="/student/results" 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back to Performance Vault</span>
                </Link>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <ResultActions
                        resultId={resultId}
                        examTitle={exam.title}
                        isArchived={isArchived}
                        workspaceName={exam.workspace?.name || "Global Workspace"}
                        score={result.score}
                        maxMarks={maxMarks}
                        percentage={percentage}
                        isPass={isPass}
                        passMarks={safePassMarks}
                        timeTaken={result.timeTaken}
                        rank={rank}
                        totalParticipants={totalParticipants}
                        submittedAt={result.createdAt.toISOString()}
                        studentName={studentFullName}
                        questions={exam.questions}
                        studentAnswers={studentAnswers}
                        showCorrectAnswers={exam.showCorrectAnswers ?? true}
                        showDetailedLog={exam.showDetailedLog ?? true}
                        allowPdfDownload={exam.allowPdfDownload ?? true}
                    />
                </div>
            </div>

            {/* Cold Storage Notice (if archived) */}
            {isArchived && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                        <HistoryIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Archived in Cold Storage</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This result is older than {accessDays} days. Detailed forensic logs and PDF downloads have been archived to optimize platform infrastructure. Core proficiency scores remain active.
                        </p>
                    </div>
                </div>
            )}

            {/* Main Academic Merit Card */}
            <Card className="border border-border/80 shadow-xl bg-card rounded-3xl overflow-hidden relative">
                {/* Top Glowing Status Bar */}
                <div className={cn(
                    "h-2 w-full",
                    isPass ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" : "bg-gradient-to-r from-rose-500 via-amber-500 to-rose-400"
                )} />

                <CardHeader className="text-center pt-8 sm:pt-10 pb-6 px-6 sm:px-10 space-y-4">
                    {/* Status Icon */}
                    <div className="flex justify-center">
                        <div className={cn(
                            "w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center shadow-lg transition-transform",
                            isPass 
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10" 
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-rose-500/10"
                        )}>
                            {isPass ? <Trophy className="w-9 h-9 sm:w-11 sm:h-11" /> : <XCircle className="w-9 h-9 sm:w-11 sm:h-11" />}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            <Badge 
                                className={cn(
                                    "border-none text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5",
                                    isPass ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                )}
                            >
                                {isPass ? "Assessment Cleared" : "Needs Review"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-primary" />
                                {exam.workspace?.name || "Global Workspace"}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground font-sans">
                            {exam.title}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Candidate: <strong className="text-foreground">{studentFullName}</strong> • Completed on {new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(result.createdAt))}
                        </p>
                    </div>

                    {/* Central Score Display */}
                    <div className="pt-4 flex flex-col items-center">
                        <div className="flex items-baseline justify-center gap-1.5">
                            <span className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-foreground">
                                {result.score}
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-muted-foreground">
                                / {maxMarks} pts
                            </span>
                        </div>

                        <div className="w-48 sm:w-60 mt-3 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                                <span>Proficiency Meter</span>
                                <span className={isPass ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                    {percentage}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-1000 ease-out rounded-full", isPass ? "bg-emerald-500" : "bg-rose-500")}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-6 sm:px-10 pb-8 space-y-6">
                    {/* Performance Specifications Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 text-center space-y-1">
                            <Zap className={cn("w-4 h-4 mx-auto mb-1", isPass ? "text-emerald-500" : "text-rose-500")} />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Outcome</p>
                            <p className={cn("font-black text-lg leading-none", isPass ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                {isPass ? "PASSED" : "FAILED"}
                            </p>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 text-center space-y-1">
                            <Clock className="w-4 h-4 mx-auto mb-1 text-primary" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time Taken</p>
                            <p className="font-black text-lg leading-none text-foreground">{getFormattedTime(result.timeTaken)}</p>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 text-center space-y-1">
                            <Medal className={cn(
                                "w-4 h-4 mx-auto mb-1",
                                rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : rank === 3 ? "text-amber-700" : "text-primary"
                            )} />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Merit Rank</p>
                            <p className="font-black text-lg leading-none text-foreground">
                                #{rank} <span className="text-[10px] font-normal text-muted-foreground">of {totalParticipants}</span>
                            </p>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 text-center space-y-1">
                            <Target className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pass Target</p>
                            <p className="font-black text-lg leading-none text-foreground">{safePassMarks} Pts</p>
                        </div>
                    </div>

                    {/* Breakdown Summary Chips */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/20 border border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-foreground">Official Academic Verification</span>
                            <span className="text-muted-foreground hidden sm:inline">• Reference: {result.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {correctCount} Correct
                            </span>
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                {incorrectCount} Incorrect
                            </span>
                            {unansweredCount > 0 && (
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    {unansweredCount} Skipped
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>

                {/* Footer Call-to-Action */}
                <CardFooter className="bg-muted/40 p-5 sm:p-6 flex flex-col sm:flex-row gap-3 justify-between items-center border-t border-border/60">
                    <div className="text-center sm:text-left">
                        <p className="text-xs font-bold text-foreground">Ready for your next milestone?</p>
                        <p className="text-[11px] text-muted-foreground">Browse available examinations to earn additional academic credits.</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link href="/student" className="flex-1 sm:flex-none">
                            <Button variant="outline" size="sm" className="w-full h-9 rounded-xl font-semibold text-xs border-border/80">
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/student/exams" className="flex-1 sm:flex-none">
                            <Button size="sm" className="w-full h-9 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-2xs">
                                <span>Explore Exams</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                </CardFooter>
            </Card>

            {/* Detailed Question-by-Question Forensic Log */}
            {!isArchived && exam.showDetailedLog && (
                <div className="space-y-4 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div>
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <FileText className="w-4.5 h-4.5 text-primary" />
                                <span>Question-by-Question Forensic Analysis</span>
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Review your submitted responses against official keys and question parameters.
                            </p>
                        </div>
                        {exam.showCorrectAnswers && (
                            <Badge variant="outline" className="border-primary/25 text-primary bg-primary/10 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 shrink-0 self-start sm:self-auto">
                                <Info className="w-3 h-3 mr-1 inline" />
                                Solution Keys Revealed
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-3">
                        {exam.questions.map((eq: any, index: number) => {
                            const studentAnswer = studentAnswers[eq.question.id];
                            const isCorrect = studentAnswer === eq.question.correctAnswer;
                            const isUnanswered = !studentAnswer;

                            return (
                                <Card key={eq.questionId} className={cn(
                                    "border shadow-2xs rounded-2xl overflow-hidden transition-all",
                                    isCorrect 
                                        ? "border-emerald-500/25 bg-card" 
                                        : isUnanswered 
                                            ? "border-border/70 bg-card" 
                                            : "border-rose-500/25 bg-card"
                                )}>
                                    <div className="flex flex-col sm:flex-row items-stretch">
                                        {/* Question Index Badge */}
                                        <div className={cn(
                                            "flex sm:flex-col items-center justify-between sm:justify-center p-3.5 sm:p-5 w-full sm:w-20 shrink-0 border-b sm:border-b-0 sm:border-r border-border/50",
                                            isCorrect 
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                                : isUnanswered 
                                                    ? "bg-muted text-muted-foreground" 
                                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                        )}>
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Q{index + 1}</span>
                                            <div>
                                                {isCorrect ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                ) : isUnanswered ? (
                                                    <span className="text-xs font-bold text-muted-foreground">Skip</span>
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-rose-500" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Question Body & Answers */}
                                        <div className="p-4 sm:p-5 flex-1 space-y-4">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm sm:text-base text-foreground leading-relaxed">
                                                    {eq.question.text}
                                                </h4>
                                                {eq.question.imageUrl && (
                                                    <div className="rounded-xl overflow-hidden border border-border/60 max-w-sm">
                                                        <img 
                                                            src={eq.question.imageUrl} 
                                                            alt="Question figure" 
                                                            className="w-full max-h-48 object-contain bg-muted/20"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Answer Review Grid */}
                                            <div className="grid sm:grid-cols-2 gap-2.5">
                                                <div className={cn(
                                                    "p-3 rounded-xl border text-xs space-y-1",
                                                    isCorrect 
                                                        ? "bg-emerald-500/5 border-emerald-500/25 text-emerald-950 dark:text-emerald-200" 
                                                        : isUnanswered 
                                                            ? "bg-muted/40 border-border/60 text-muted-foreground" 
                                                            : "bg-rose-500/5 border-rose-500/25 text-rose-950 dark:text-rose-200"
                                                )}>
                                                    <span className="text-[9.5px] font-bold uppercase tracking-wider block opacity-70">
                                                        Your Submitted Response
                                                    </span>
                                                    <p className="font-semibold text-xs sm:text-sm">
                                                        {studentAnswer || "No answer submitted"}
                                                    </p>
                                                </div>

                                                {(!isCorrect && exam.showCorrectAnswers) && (
                                                    <div className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200 text-xs space-y-1">
                                                        <span className="text-[9.5px] font-bold uppercase tracking-wider block text-emerald-700 dark:text-emerald-400">
                                                            Official Solution Key
                                                        </span>
                                                        <p className="font-semibold text-xs sm:text-sm">
                                                            {eq.question.correctAnswer}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
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
