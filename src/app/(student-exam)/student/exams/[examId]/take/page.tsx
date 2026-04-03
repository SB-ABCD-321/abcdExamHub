import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { PasswordGate } from "@/components/exam/PasswordGate";
import { AssessmentTerminal } from "@/components/assessment/AssessmentTerminal";
import { submitExamAction } from "./actions";

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mb-6 text-rose-600 dark:text-rose-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Workspace Trial Expired</h1>
                <p className="text-muted-foreground font-medium mb-8 max-w-sm">The institution hosting this exam has an expired subscription trial. Access is temporarily suspended.</p>
                <Link href="/student/exams">
                    <button className="h-11 px-8 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm">
                        Browse Other Exams
                    </button>
                </Link>
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Platform at Capacity</h1>
                <p className="text-muted-foreground font-medium mb-8 max-w-sm">This institution has reached its maximum concurrent examinee limit. Please try again later.</p>
                <Link href="/student/exams">
                    <button className="h-11 px-8 rounded-xl font-bold text-sm border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-700 dark:text-slate-300">
                        Go Back
                    </button>
                </Link>
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Exam at Capacity</h1>
                <p className="text-muted-foreground font-medium mb-8 max-w-sm">This exam has reached its maximum participant limit set by the workspace administrator. Please try again later.</p>
                <Link href="/student/exams">
                    <button className="h-11 px-8 rounded-xl font-bold text-sm border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-700 dark:text-slate-300">
                        Go Back
                    </button>
                </Link>
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
