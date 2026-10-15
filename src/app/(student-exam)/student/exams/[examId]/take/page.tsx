import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { PasswordGate } from "@/components/exam/PasswordGate";
import { AssessmentTerminal } from "@/components/assessment/AssessmentTerminal";
import { submitExamAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";

export default async function TakeExamPage(props: { params: Promise<{ examId: string }> }) {
    const params = await props.params;
    const examId = params.examId;

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { studentWorkspaces: true }
    });

    if (!dbUser) return <div>User not found.</div>;

    // Fetch the exam AND fully include questions BUT explicitly DO NOT forward the 'correctAnswer' to the client component.
    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: {
            workspace: true,
            allowedStudents: {
                select: { id: true }
            },
            questions: {
                include: {
                    question: {
                        select: {
                            id: true,
                            text: true,
                            options: true,
                            imageUrl: true
                        }
                    }
                }
            }
        }
    });

    if (!exam) return redirect("/student/exams");

    // Access Control based on 4 types
    const isEnrolledInWorkspace = dbUser.studentWorkspaces.some(ws => ws.id === exam.workspaceId);
    
    if (exam.accessType === "SELECTED_STUDENTS") {
        const isDirectlyAllowed = exam.allowedStudents.some(s => s.id === dbUser.id);
        if (!isEnrolledInWorkspace || !isDirectlyAllowed) return redirect("/student/exams");
    } else if (exam.accessType === "WORKSPACE_PRIVATE") {
        if (!isEnrolledInWorkspace) return redirect("/student/exams");
    } else if (exam.accessType === "GLOBAL_PUBLIC") {
        // Any valid logged-in user on the entire platform can take it
    } else if (exam.accessType === "OPEN_GUEST") {
        // OPEN_GUEST exams are accessible
    }

    const cookieStore = await cookies();
    const isUnlocked = cookieStore.has(`unlocked_${exam.id}`);

    if ((exam as any).password && !isUnlocked) {
        return <PasswordGate examId={exam.id} title={exam.title} />;
    }

    const ws = exam.workspace as any;
    
    // Check trial expiration
    if (ws.trialExpiresAt && new Date(ws.trialExpiresAt) < new Date()) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
                <div className="max-w-md w-full border border-border/80 shadow-xl bg-card rounded-3xl p-8 space-y-5">
                    <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace Trial Expired</h1>
                        <p className="text-muted-foreground text-xs leading-relaxed max-w-sm mx-auto">
                            The educational workspace hosting this exam has reached the end of its subscription trial. Examination access is temporarily paused.
                        </p>
                    </div>
                    <Link href="/student/exams" className="block pt-2">
                        <Button className="w-full h-11 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                            Explore Active Exams
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Check concurrency limits
    const maxConcurrent = ws.maxConcurrentExams ?? 100;
    const workspaceDraftsCount = await db.examDraft.count({
        where: { exam: { workspaceId: ws.id } }
    });

    const existingDraft = await db.examDraft.findUnique({
        where: { examId_studentId: { examId: exam.id, studentId: dbUser.id } }
    });

    if (!existingDraft && workspaceDraftsCount >= maxConcurrent) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
                <div className="max-w-md w-full border border-border/80 shadow-xl bg-card rounded-3xl p-8 space-y-5">
                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace at Peak Capacity</h1>
                        <p className="text-muted-foreground text-xs leading-relaxed max-w-sm mx-auto">
                            The workspace concurrent examinee limit has been reached. Please check back in a few minutes once active sessions complete.
                        </p>
                    </div>
                    <Link href="/student/exams" className="block pt-2">
                        <Button variant="outline" className="w-full h-11 rounded-xl font-bold text-xs border-border/80">
                            Return to Exam Directory
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Check Exam specific participant limit
    const examParticipantLimit = ws.maxStudentsPerExam ?? 100;
    const currentSubmissions = await db.examResult.count({
        where: { examId: exam.id }
    });
    const activeExamDrafts = await db.examDraft.count({
        where: { examId: exam.id }
    });
    
    if (!existingDraft && (currentSubmissions + activeExamDrafts) >= examParticipantLimit) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
                <div className="max-w-md w-full border border-border/80 shadow-xl bg-card rounded-3xl p-8 space-y-5">
                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Session at Full Capacity</h1>
                        <p className="text-muted-foreground text-xs leading-relaxed max-w-sm mx-auto">
                            This specific assessment has reached its maximum quota of simultaneous participants. Please contact your coordinator.
                        </p>
                    </div>
                    <Link href="/student/exams" className="block pt-2">
                        <Button variant="outline" className="w-full h-11 rounded-xl font-bold text-xs border-border/80">
                            Return to Exam Directory
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Check if taken
    const existingResult = await db.examResult.findFirst({
        where: { examId: exam.id, studentId: dbUser.id }
    });

    if (existingResult) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <h1 className="text-2xl font-bold mb-2">Exam Already Taken</h1>
                <p className="text-muted-foreground mb-6">You submitted this on {new Date(existingResult.createdAt).toLocaleDateString()}.</p>
                <div className="flex flex-wrap gap-3 justify-center">
                    <a href={`/student/results/${existingResult.id}`}>
                        <button className="h-11 px-6 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                            View Result
                        </button>
                    </a>
                </div>
            </div>
        );
    }

    const sanitizedQuestions = exam.questions.map(eq => eq.question);
    const shuffledQuestions = sanitizedQuestions.sort(() => Math.random() - 0.5);

    return (
        <AssessmentTerminal
            exam={{
                id: exam.id,
                title: exam.title,
                duration: exam.duration,
                passMarks: exam.passMarks,
                workspaceName: ws.siteName || ws.name || "Assessment Center"
            }}
            questions={shuffledQuestions}
            studentId={dbUser.id}
            mode="LIVE"
            onFinish={async (answers, timeTaken) => {
                "use server";
                return await submitExamAction(exam.id, answers, timeTaken);
            }}
            exitUrl="/student/exams"
        />
    );
}
