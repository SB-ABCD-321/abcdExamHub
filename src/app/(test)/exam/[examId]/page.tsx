import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StudentExamClient } from "./StudentExamClient";

export default async function StudentExamPage(
    props: { params: Promise<{ examId: string }> }
) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const params = await props.params;

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { studentWorkspaces: true }
    });

    if (!dbUser) redirect("/dashboard");

    const exam = await db.exam.findUnique({
        where: { id: params.examId },
        include: {
            workspace: true,
            allowedStudents: { select: { id: true } },
            questions: {
                include: {
                    question: true
                }
            }
        }
    });

    if (!exam) return <div className="p-12 text-center">Exam not found.</div>;

    // Authorization Check: Is it public? Or are they allowed?
    const isAllowed = exam.allowedStudents.some(s => s.id === dbUser.id);
    if (!exam.isPublic && !isAllowed) {
        return <div className="p-12 text-center">You are not authorized to take this exam.</div>;
    }

    // Check if they already took it
    const existingResult = await db.examResult.findFirst({
        where: { examId: exam.id, studentId: dbUser.id }
    });

    if (existingResult) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <h1 className="text-2xl font-bold mb-2">Exam Already Taken</h1>
                <p className="text-muted-foreground mb-6">You have already submitted this exam on {new Date(existingResult.createdAt).toLocaleDateString()}.</p>
                <div className="bg-muted p-6 rounded-xl w-full max-w-sm">
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
            </div>
        );
    }

    // Check for existing draft to support Resume on Reconnect
    const draft = await db.examDraft.findUnique({
        where: {
            examId_studentId: {
                examId: exam.id,
                studentId: dbUser.id
            }
        }
    });

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
            initialDraft={draft ? {
                answers: draft.answers as any,
                timeLeft: draft.timeLeft,
                lastActiveIndex: draft.lastActiveIndex,
                flaggedQuestions: JSON.parse(draft.flaggedQuestions || "[]"),
                tabSwitches: draft.tabSwitches
            } : undefined}
        />
    );
}
