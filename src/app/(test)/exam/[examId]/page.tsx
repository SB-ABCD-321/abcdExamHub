import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StudentExamClient } from "./StudentExamClient";
import { PasswordGate } from "@/components/exam/PasswordGate";

export default async function StudentExamPage(
    props: { 
        params: Promise<{ examId: string }>;
        searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
    }
) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const params = await props.params;
    const searchParams = await props.searchParams;
    const isTest = searchParams.test === 'true';

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { studentWorkspaces: true }
    });

    if (!dbUser) redirect("/dashboard");

    const exam = await db.exam.findUnique({
        where: { id: params.examId },
        include: {
            workspace: {
                include: {
                    admin: { select: { id: true } }
                }
            },
            allowedStudents: { select: { id: true } },
            questions: {
                include: {
                    question: true
                }
            }
        }
    });

    if (!exam) return <div className="p-12 text-center">Exam not found.</div>;

    // Authorization Check Logic
    const hasAssignedStudents = exam.allowedStudents.length > 0;
    const isDirectlyAllowed = exam.allowedStudents.some(s => s.id === dbUser.id);
    const isWorkspaceStudent = dbUser.studentWorkspaces.some(w => w.id === exam.workspaceId);
    
    // Testing Permissions: Author, Workspace Admin, or Super Admin
    const isAuthor = (exam as any).authorId === dbUser.id;
    const isWorkspaceAdmin = exam.workspace.admin.id === dbUser.id;
    const isSuperAdmin = dbUser.role === "SUPER_ADMIN";
    const canTest = isAuthor || isWorkspaceAdmin || isSuperAdmin;

    // Access Control:
    // If students are assigned → only those students can access
    // If no students assigned → anyone with the link (+ password if set) can take it
    if (!exam.isPublic && hasAssignedStudents && !isDirectlyAllowed) {
        if (!(isTest && canTest)) {
            return <div className="p-12 text-center">You are not in the allowed participants list for this exam. Please contact the examiner.</div>;
        }
    }

    // Password Gate: Only for open-access exams (no assigned students) with a password
    if (!hasAssignedStudents && (exam as any).password) {
        if (!(isTest && canTest)) {
            return <PasswordGate examId={exam.id} title={exam.title} />;
        }
    }

    // Check if they already took it (Bypass if Testing)
    const existingResult = isTest ? null : await db.examResult.findFirst({
        where: { examId: exam.id, studentId: dbUser.id }
    });

    if (existingResult) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <h1 className="text-2xl font-bold mb-2">Exam Already Taken</h1>
                <p className="text-muted-foreground mb-6">You have already submitted this exam on {new Date(existingResult.createdAt).toLocaleDateString()}.</p>
                <div className="bg-muted p-6 rounded-xl w-full max-w-sm mb-8">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Your Score</p>
                    <p className="text-4xl font-black mb-2">{existingResult.score} / {exam.questions.length}</p>
                    <p className="font-medium text-sm">
                        {existingResult.score >= exam.passMarks ? (
                            <span className="text-green-600 dark:text-green-500">Passed successfully</span>
                        ) : (
                            <span className="text-destructive">Failed to meet passing criteria ({exam.passMarks})</span>
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                    <a href={`/student/results/${existingResult.id}`}>
                        <button className="h-11 px-6 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                            View Result
                        </button>
                    </a>
                    <a href="/student/exams">
                        <button className="h-11 px-6 rounded-xl font-bold text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">
                            Browse Exams
                        </button>
                    </a>
                    <a href="/student">
                        <button className="h-11 px-6 rounded-xl font-bold text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">
                            Dashboard
                        </button>
                    </a>
                </div>
            </div>
        );
    }

    // Transform questions to standard format (removing correctAnswer for the client)
    const clientQuestions = exam.questions.map(eq => ({
        id: eq.question.id,
        text: eq.question.text,
        imageUrl: eq.question.imageUrl,
        options: eq.question.options
    }));

    return (
        <StudentExamClient
            exam={{
                id: exam.id,
                title: exam.title,
                duration: exam.duration,
                passMarks: exam.passMarks,
                workspaceName: exam.workspace.name
            }}
            questions={clientQuestions}
            studentId={dbUser.id}
            isTest={isTest}
        />
    );
}
