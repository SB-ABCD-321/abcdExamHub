import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Clock, 
    PlayCircle, 
    ShieldAlert, 
    ArrowLeft, 
    ArrowRight, 
    Target, 
    Building2, 
    CheckCircle2, 
    Award, 
    FileQuestion, 
    ShieldCheck, 
    Wifi, 
    UserCheck,
    Lock,
    Sparkles,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function ExamStartPage(props: { params: Promise<{ examId: string }> }) {
    const params = await props.params;
    const examId = params.examId;

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { studentWorkspaces: true }
    });

    if (!dbUser) return <div>User not found.</div>;

    // Fetch exam with allowed students & question count
    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: {
            workspace: true,
            allowedStudents: {
                select: { id: true }
            },
            _count: { select: { questions: true } }
        }
    });

    if (!exam) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center p-4">
                <Card className="max-w-md w-full border border-destructive/30 shadow-xl bg-card rounded-3xl p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto text-destructive">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-foreground">Assessment Unavailable</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This examination session does not exist, has expired, or was removed by the administrator.
                        </p>
                    </div>
                    <Link href="/student/exams" className="block pt-2">
                        <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-bold gap-1.5">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Return to Exam Catalog
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    // Check if the student already completed this exam
    const existingResult = await db.examResult.findFirst({
        where: { examId: exam.id, studentId: dbUser.id }
    });

    if (existingResult) {
        const isPassed = existingResult.score >= exam.passMarks;
        return (
            <div className="min-h-[75vh] flex items-center justify-center p-4">
                <Card className="max-w-md w-full border border-border/70 shadow-xl bg-card rounded-3xl p-8 text-center space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                        <Award className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                            Assessment Completed
                        </Badge>
                        <h2 className="text-xl font-bold text-foreground">{exam.title}</h2>
                        <p className="text-xs text-muted-foreground">
                            You completed this examination on {new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(existingResult.createdAt))}.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
                        <div className="text-left">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recorded Score</p>
                            <p className="text-2xl font-black text-foreground">{existingResult.score} <span className="text-xs font-normal text-muted-foreground">pts</span></p>
                        </div>
                        <Badge className={isPassed ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none" : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-none"}>
                            {isPassed ? "Passed" : "Needs Review"}
                        </Badge>
                    </div>

                    <div className="flex flex-col gap-2.5 pt-2">
                        <Link href={`/student/results/${existingResult.id}`}>
                            <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2">
                                <span>Inspect Detailed Result Analysis</span>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Link href="/student/exams">
                            <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-semibold border-border/80">
                                Return to Exams
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    // Access control evaluation
    const hasAssignedStudents = exam.allowedStudents.length > 0;
    const isDirectlyAllowed = exam.allowedStudents.some(s => s.id === dbUser.id);
    const isEnrolledInWorkspace = dbUser.studentWorkspaces.some(ws => ws.id === exam.workspaceId);

    if (exam.accessType === "SELECTED_STUDENTS" && (!isEnrolledInWorkspace || !isDirectlyAllowed)) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center p-4">
                <Card className="max-w-md w-full border border-destructive/30 shadow-xl bg-card rounded-3xl p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto text-destructive">
                        <Lock className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This exam is restricted to selected students. Your account has not been designated for access. Contact your educator for clearance.
                        </p>
                    </div>
                    <Link href="/student/exams" className="block pt-2">
                        <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-bold gap-1.5">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Exams
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    if (!exam.isPublic && hasAssignedStudents && !isDirectlyAllowed) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center p-4">
                <Card className="max-w-md w-full border border-destructive/30 shadow-xl bg-card rounded-3xl p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto text-destructive">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-foreground">Restricted Enrollment</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            You are not included in the allowed examinee directory for this assessment.
                        </p>
                    </div>
                    <Link href="/student/exams" className="block pt-2">
                        <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-bold gap-1.5">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Exams
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    // Calculations
    const totalQuestions = exam._count.questions;
    const marksPerQuestion = exam.marksPerQuestion || 1;
    const totalMarks = totalQuestions * marksPerQuestion;
    const passPercentage = totalMarks > 0 ? Math.round((exam.passMarks / totalMarks) * 100) : 0;
    const studentFullName = [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") || "Student";

    return (
        <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 space-y-6">
            {/* Navigation Header */}
            <div className="flex items-center justify-between gap-4">
                <Link href="/student/exams">
                    <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Exam Directory</span>
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Terminal Ready</span>
                    </Badge>
                </div>
            </div>

            {/* Premium Assessment Briefing Card */}
            <Card className="border border-border/80 shadow-xl bg-card rounded-3xl overflow-hidden relative">
                {/* Top Subtle Ambient Glow */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />

                <CardHeader className="p-6 sm:p-8 pb-6 border-b border-border/50 bg-gradient-to-b from-primary/5 via-transparent to-transparent space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Academic Assessment</span>
                        </Badge>
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span>{exam.workspace?.name || "Global Workspace"}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground font-sans">
                            {exam.title}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                            {exam.description || "Review the official assessment parameters, scoring rules, and integrity protocols below before entering the secure testing environment."}
                        </p>
                    </div>

                    {/* Authenticated Candidate Chip */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Candidate Verification</p>
                            <p className="text-xs font-bold text-foreground truncate">{studentFullName} <span className="text-[11px] font-normal text-muted-foreground">({dbUser.email})</span></p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-none shrink-0">
                            Verified
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 space-y-6">
                    {/* Performance & Specification KPI Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/30 border border-border/60 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Duration</span>
                                <Clock className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-black text-foreground">{exam.duration}m</p>
                                <p className="text-[10.5px] text-muted-foreground font-medium">Timed session</p>
                            </div>
                        </div>

                        <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/30 border border-border/60 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Questions</span>
                                <FileQuestion className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-black text-foreground">{totalQuestions}</p>
                                <p className="text-[10.5px] text-muted-foreground font-medium">Multiple-choice</p>
                            </div>
                        </div>

                        <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/30 border border-border/60 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Pass Mark</span>
                                <Target className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-black text-foreground">{exam.passMarks} <span className="text-xs font-normal text-muted-foreground">/ {totalMarks}</span></p>
                                <p className="text-[10.5px] text-muted-foreground font-medium">{passPercentage}% target</p>
                            </div>
                        </div>

                        <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/30 border border-border/60 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Marking</span>
                                <Award className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-black text-foreground">+{marksPerQuestion}</p>
                                <p className="text-[10.5px] text-muted-foreground font-medium">
                                    {exam.negativeMarksEnabled ? `-${exam.negativeMarksValue} penalty` : "No negative"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Security & System Protocols Card */}
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5 sm:p-6 space-y-3.5">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Proctoring & Assessment Protocols</span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                            <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <strong className="text-foreground font-semibold">Full-Screen Focus:</strong>
                                    <p className="mt-0.5">The examination terminal requires active full-screen. Exiting will trigger automatic infraction logging.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <strong className="text-foreground font-semibold">Offline Resilience:</strong>
                                    <p className="mt-0.5">Every selected response is mirrored into persistent local storage in real-time to survive connection drops.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <strong className="text-foreground font-semibold">Countdown & Auto-Submit:</strong>
                                    <p className="mt-0.5">The countdown timer initiates immediately. Responses are automatically locked and sent upon time expiration.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <strong className="text-foreground font-semibold">Instant Result Analysis:</strong>
                                    <p className="mt-0.5">Detailed merit reports, question keys, and score breakdowns become available following successful submission.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-6 sm:p-8 pt-0 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 bg-muted/10">
                    <p className="text-[11px] text-muted-foreground font-medium text-center sm:text-left">
                        By proceeding, you verify your identity and commit to academic integrity standards.
                    </p>
                    <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                        <Link href={`/student/exams/${exam.id}/take`} className="w-full sm:w-auto">
                            <Button 
                                size="lg" 
                                className="w-full sm:w-auto h-12 px-7 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2 uppercase tracking-wider"
                            >
                                <PlayCircle className="w-4 h-4" />
                                <span>Initialize Assessment</span>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
